import type { Prisma } from '@prisma/client';
import type { CollectionCycleSummary, SourceRunMetrics } from '../pipeline/pipeline.types.js';
import { prisma } from './prisma.js';

export type CollectionRunStatus = 'running' | 'success' | 'partial_failure' | 'failed';

export interface CollectionRunError {
  source?: string;
  message: string;
}

export class CollectionRunRepository {
  async start(startedAt = new Date()): Promise<{ id: string }> {
    return prisma.collectionRun.create({
      data: {
        status: 'running',
        startedAt,
        sourceMetrics: [],
        errors: []
      },
      select: { id: true }
    });
  }

  async finish(input: {
    id: string;
    status: Exclude<CollectionRunStatus, 'running'>;
    summary: CollectionCycleSummary;
    errors: CollectionRunError[];
  }): Promise<void> {
    await prisma.collectionRun.update({
      where: { id: input.id },
      data: {
        status: input.status,
        finishedAt: input.summary.finishedAt,
        rawItems: input.summary.rawItems,
        normalizedJobs: input.summary.normalizedJobs,
        acceptedJobs: input.summary.acceptedJobs,
        rejectedJobs: input.summary.rejectedJobs,
        newJobs: input.summary.newJobs,
        rediscoveredJobs: input.summary.rediscoveredJobs,
        highScoringJobs: input.summary.highScoringJobs,
        notificationsSent: input.summary.notificationsSent,
        collectorFailures: input.summary.collectorFailures,
        sourceMetrics: jsonArray(input.summary.sourceMetrics),
        errors: jsonArray(input.errors)
      }
    });
  }

  async fail(input: {
    id: string;
    error: unknown;
    errors: CollectionRunError[];
  }): Promise<void> {
    const errors = [...input.errors, { message: errorMessage(input.error) }];

    await prisma.collectionRun.update({
      where: { id: input.id },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        errors: jsonArray(errors)
      }
    });
  }
}

function jsonArray<T extends SourceRunMetrics | CollectionRunError>(items: T[]): Prisma.InputJsonValue {
  return items.map((item) => ({ ...item })) as unknown as Prisma.InputJsonValue;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
