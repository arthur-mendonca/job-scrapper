import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loadSourceConfigs, trustBucket } from '../../config/sources.js';
import { prisma } from '../../persistence/prisma.js';
import { isoOrNull } from '../dto.js';
import { sourceListResponseSchema } from '../api-schemas.js';

interface SourceStatsRow {
  sourceId: string;
  source: string;
  _count: { _all: number };
  _avg: { score: number | null };
  _max: { lastSeenAt: Date | null; sourceTrustScore: number | null };
}

export async function registerSourcesRoutes(app: FastifyInstance): Promise<void> {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    '/sources',
    {
      schema: {
        operationId: 'listSources',
        tags: ['Sources'],
        summary: 'List job sources',
        description: 'Returns all configured and database-only sources with their job statistics.',
        response: {
          200: sourceListResponseSchema,
        },
      },
    },
    async () => {
      const [configs, statsRows] = await Promise.all([loadSourceConfigs(), loadSourceStats()]);
      const consumedRows = new Set<number>();

      const configuredSources = configs.map((source) => {
        const rows = statsRows.filter((row, index) => {
          const matches = row.sourceId === source.id || row.source.toLowerCase() === source.name.toLowerCase();
          if (matches) consumedRows.add(index);
          return matches;
        });
        const stats = combineStats(rows);

        return {
          id: source.id,
          name: source.name,
          type: source.type,
          enabled: source.enabled,
          baseUrl: source.baseUrl,
          accessMode: source.accessMode,
          sourceTrustScore: source.sourceTrustScore,
          trustBucket: trustBucket(source.sourceTrustScore),
          rateLimitMs: source.rateLimitMs,
          attributionRequired: source.attributionRequired,
          notes: source.notes ?? null,
          queries: source.queries ?? [],
          endpoints: source.endpoints ?? [],
          stats
        };
      });

      const databaseOnlySources = statsRows
        .filter((_, index) => !consumedRows.has(index))
        .map((row) => {
          const stats = combineStats([row]);
          const sourceTrustScore = row._max.sourceTrustScore ?? 0;

          return {
            id: row.sourceId,
            name: row.source,
            type: 'unknown',
            enabled: false,
            baseUrl: '',
            accessMode: 'unknown',
            sourceTrustScore,
            trustBucket: trustBucket(sourceTrustScore),
            rateLimitMs: 0,
            attributionRequired: false,
            notes: 'Source found in persisted jobs but not in the configured sources file.',
            queries: [],
            endpoints: [],
            stats
          };
        });

      return {
        data: [...configuredSources, ...databaseOnlySources]
      };
    }
  );
}

async function loadSourceStats() {
  return prisma.job.groupBy({
    by: ['sourceId', 'source'],
    _count: { _all: true },
    _avg: { score: true },
    _max: { lastSeenAt: true, sourceTrustScore: true },
    orderBy: [{ sourceId: 'asc' }, { source: 'asc' }]
  }) as unknown as Promise<SourceStatsRow[]>;
}

function combineStats(rows: SourceStatsRow[]) {
  let totalJobs = 0;
  let scoreTotal = 0;
  let sourceTrustScore = 0;
  let lastSeenAt: Date | null = null;

  for (const row of rows) {
    const count = row._count._all;
    totalJobs += count;
    scoreTotal += (row._avg.score ?? 0) * count;
    sourceTrustScore = Math.max(sourceTrustScore, row._max.sourceTrustScore ?? 0);

    if (row._max.lastSeenAt && (!lastSeenAt || row._max.lastSeenAt > lastSeenAt)) {
      lastSeenAt = row._max.lastSeenAt;
    }
  }

  return {
    totalJobs,
    averageScore: totalJobs ? Math.round((scoreTotal / totalJobs) * 100) / 100 : 0,
    sourceTrustScore,
    lastSeenAt: isoOrNull(lastSeenAt)
  };
}
