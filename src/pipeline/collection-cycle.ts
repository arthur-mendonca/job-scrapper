import type { Job } from '@prisma/client';
import { trustBucket } from '../config/sources.js';
import type { JobCollector, RawJobItem } from '../collectors/collector.types.js';
import { logger } from '../logger/logger.js';
import { normalizeJob } from '../normalizer/normalizer.service.js';
import type { NormalizedJob } from '../normalizer/normalizer.types.js';
import { NotificationService } from '../notifier/notification.service.js';
import { JobEventRepository } from '../persistence/job-event.repository.js';
import { JobRepository } from '../persistence/job.repository.js';
import { scoreJob } from '../scoring/scoring.service.js';
import type { CollectionCycleSummary, SourceRunMetrics } from './pipeline.types.js';

export interface CollectionCycleOptions {
  notificationScoreThreshold: number;
}

export class CollectionCycle {
  constructor(
    private readonly collectors: JobCollector[],
    private readonly options: CollectionCycleOptions,
    private readonly jobRepository = new JobRepository(),
    private readonly jobEventRepository = new JobEventRepository(),
    private readonly notificationService = new NotificationService()
  ) {}

  async run(): Promise<CollectionCycleSummary> {
    const startedAt = new Date();
    logger.info({ startedAt }, 'Collection cycle started');

    const rawItems: RawJobItem[] = [];
    const sourceMetrics = new Map<string, SourceRunMetrics>();
    let collectorFailures = 0;

    for (const collector of this.collectors) {
      logger.info({ collector: collector.name }, 'Collector started');
      try {
        const collected = await collector.collect();
        rawItems.push(...collected);
        const first = collected[0];
        sourceMetrics.set(collector.name, {
          source: collector.name,
          sourceTrustScore: first?.sourceTrustScore ?? 0,
          trustBucket: trustBucket(first?.sourceTrustScore ?? 0),
          rawItems: collected.length,
          normalizedItems: 0,
          failures: 0
        });
        logger.info({ collector: collector.name, rawItems: collected.length }, 'Collector finished');
      } catch (error) {
        collectorFailures += 1;
        sourceMetrics.set(collector.name, {
          source: collector.name,
          sourceTrustScore: 0,
          trustBucket: trustBucket(0),
          rawItems: 0,
          normalizedItems: 0,
          failures: 1
        });
        logger.error({ err: error, collector: collector.name }, 'Collector failed');
      }
    }

    const normalizedJobs = rawItems.map(normalizeJob).filter((job): job is NormalizedJob => job !== null);
    for (const job of normalizedJobs) {
      const metric = sourceMetrics.get(job.source);
      if (metric) {
        metric.normalizedItems += 1;
        metric.sourceTrustScore = job.sourceTrustScore;
        metric.trustBucket = trustBucket(job.sourceTrustScore);
      }
    }

    let newJobs = 0;
    let rediscoveredJobs = 0;
    let highScoringJobs = 0;
    let notificationsSent = 0;
    const highScoringPersistedJobs: Job[] = [];

    for (const normalized of normalizedJobs) {
      const score = scoreJob(normalized);
      const existing = await this.jobRepository.findDuplicate(normalized);
      const persisted = existing
        ? await this.jobRepository.updateRediscovered(existing, normalized, score)
        : await this.jobRepository.create(normalized, score);

      if (existing) {
        rediscoveredJobs += 1;
        await this.jobEventRepository.create({
          jobId: persisted.id,
          eventType: 'rediscovered',
          metadata: {
            source: normalized.source,
            sourceTrustScore: normalized.sourceTrustScore,
            score: score.score
          }
        });
      } else {
        newJobs += 1;
        await this.jobEventRepository.create({
          jobId: persisted.id,
          eventType: 'discovered',
          metadata: {
            source: normalized.source,
            sourceTrustScore: normalized.sourceTrustScore,
            score: score.score
          }
        });
      }

      if (score.score >= this.options.notificationScoreThreshold) {
        highScoringJobs += 1;
        highScoringPersistedJobs.push(persisted);
        if (!persisted.notifiedAt) {
          const sent = await this.notificationService.notifyJob(persisted);
          if (sent) {
            await this.jobRepository.markAsNotified(persisted.id);
            notificationsSent += 1;
          }
        }
      }
    }

    await this.notificationService.sendEmailDigest(highScoringPersistedJobs);

    const finishedAt = new Date();
    const summary: CollectionCycleSummary = {
      startedAt,
      finishedAt,
      rawItems: rawItems.length,
      normalizedJobs: normalizedJobs.length,
      newJobs,
      rediscoveredJobs,
      highScoringJobs,
      notificationsSent,
      collectorFailures,
      sourceMetrics: [...sourceMetrics.values()]
    };

    logger.info(summary, 'Collection cycle finished');
    await this.notificationService.sendRunSummary(formatRunSummary(summary));
    return summary;
  }
}

export function formatRunSummary(summary: CollectionCycleSummary): string {
  const sourceLines = summary.sourceMetrics
    .map(
      (source) =>
        `- ${source.source}: ${source.rawItems} raw, ${source.normalizedItems} normalized, trust ${source.sourceTrustScore}/100`
    )
    .join('\n');

  return [
    'Job intelligence cycle summary',
    '',
    `Raw items: ${summary.rawItems}`,
    `Normalized jobs: ${summary.normalizedJobs}`,
    `New jobs: ${summary.newJobs}`,
    `Rediscovered jobs: ${summary.rediscoveredJobs}`,
    `High-scoring jobs: ${summary.highScoringJobs}`,
    `Notifications sent: ${summary.notificationsSent}`,
    `Collector failures: ${summary.collectorFailures}`,
    '',
    'Sources:',
    sourceLines || '- none'
  ].join('\n');
}
