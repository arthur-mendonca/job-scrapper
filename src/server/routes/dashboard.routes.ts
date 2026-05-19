import type { FastifyInstance } from 'fastify';
import { prisma } from '../../persistence/prisma.js';
import { env } from '../../config/env.js';
import { isoOrNull, toCollectionRunDto } from '../dto.js';
import { buildDashboardSourceStats, roundMetric } from '../dashboard.metrics.js';

interface TopStackRow {
  stack: string;
  count: number;
}

interface JobsByStatusRow {
  status: string;
  _count: { _all: number };
}

interface JobsBySourceRow {
  sourceId: string;
  source: string;
  _count: { _all: number };
  _avg: { score: number | null };
  _max: { lastSeenAt: Date | null; sourceTrustScore: number | null };
}

export async function registerDashboardRoutes(app: FastifyInstance): Promise<void> {
  app.get('/dashboard', async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      newJobsToday,
      rediscoveredJobsToday,
      highScoreJobs,
      averageScore,
      jobsByStatus,
      jobsBySource,
      lastRun,
      recentErrorRuns
    ] = await prisma.$transaction([
      prisma.job.count({ where: { discoveredAt: { gte: todayStart } } }),
      prisma.jobEvent.count({ where: { eventType: 'rediscovered', createdAt: { gte: todayStart } } }),
      prisma.job.count({ where: { score: { gte: 70 } } }),
      prisma.job.aggregate({ _avg: { score: true } }),
      prisma.job.groupBy({
        by: ['status'],
        _count: { _all: true },
        orderBy: { status: 'asc' }
      }),
      prisma.job.groupBy({
        by: ['sourceId', 'source'],
        _count: { _all: true },
        _avg: { score: true },
        _max: { lastSeenAt: true, sourceTrustScore: true },
        orderBy: [{ sourceId: 'asc' }, { source: 'asc' }]
      }),
      prisma.collectionRun.findFirst({ orderBy: { startedAt: 'desc' } }),
      prisma.collectionRun.findMany({
        where: { status: { in: ['partial_failure', 'failed'] } },
        orderBy: { startedAt: 'desc' },
        take: 10
      })
    ]);

    const topStacks = await prisma.$queryRaw<TopStackRow[]>`
      SELECT tags.stack AS "stack", COUNT(*)::int AS "count"
      FROM "Job"
      CROSS JOIN LATERAL unnest("stackTags") AS tags(stack)
      GROUP BY tags.stack
      ORDER BY "count" DESC, tags.stack ASC
      LIMIT 10
    `;

    const sourceRows = jobsBySource as JobsBySourceRow[];
    const statusRows = jobsByStatus as JobsByStatusRow[];
    const sourceStats = buildDashboardSourceStats(
      sourceRows.map((row) => ({
        sourceId: row.sourceId,
        source: row.source,
        count: row._count._all,
        averageScore: row._avg.score,
        lastSeenAt: row._max.lastSeenAt,
        sourceTrustScore: row._max.sourceTrustScore
      }))
    );

    return {
      newJobsToday,
      rediscoveredJobsToday,
      highScoreJobs,
      averageScore: roundMetric(averageScore._avg.score),
      notificationScoreThreshold: env.NOTIFICATION_SCORE_THRESHOLD,
      jobsByStatus: statusRows
        .map((row) => ({ status: row.status, count: row._count._all }))
        .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status)),
      jobsBySource: sourceStats,
      topSources: sourceStats.slice(0, 5),
      topStacks,
      lastRun: toCollectionRunDto(lastRun),
      recentErrors: recentErrorRuns.map((run) => {
        const dto = toCollectionRunDto(run);
        return {
          runId: run.id,
          status: run.status,
          startedAt: run.startedAt.toISOString(),
          finishedAt: isoOrNull(run.finishedAt),
          errors: dto?.errors ?? []
        };
      })
    };
  });
}
