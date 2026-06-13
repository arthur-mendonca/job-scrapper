import type { DynamicSearchConfig, Prisma } from '@prisma/client';
import { prisma } from './prisma.js';
import { CronExpressionParser } from 'cron-parser';

export interface DynamicSearchRunMetrics {
  lastItemsCount: number;
  lastAcceptedCount: number;
  lastRejectedCount: number;
  lastNewCount: number;
  lastRediscoveredCount: number;
}

export class DynamicSearchRepository {
  async create(
    input: Prisma.DynamicSearchConfigUncheckedCreateInput
  ): Promise<DynamicSearchConfig> {
    return prisma.dynamicSearchConfig.create({ data: input });
  }

  async update(
    id: string,
    input: Prisma.DynamicSearchConfigUncheckedUpdateInput
  ): Promise<DynamicSearchConfig> {
    return prisma.dynamicSearchConfig.update({ where: { id }, data: input });
  }

  async activate(id: string): Promise<DynamicSearchConfig> {
    return prisma.dynamicSearchConfig.update({
      where: { id },
      data: { isActive: true }
    });
  }

  async deactivate(id: string): Promise<DynamicSearchConfig> {
    return prisma.dynamicSearchConfig.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async findById(id: string): Promise<DynamicSearchConfig | null> {
    return prisma.dynamicSearchConfig.findUnique({ where: { id } });
  }

  async listAll(): Promise<DynamicSearchConfig[]> {
    return prisma.dynamicSearchConfig.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findDueConfigs(now: Date, limit: number): Promise<DynamicSearchConfig[]> {
    return prisma.dynamicSearchConfig.findMany({
      where: {
        isActive: true,
        OR: [
          { nextRunAt: { lte: now } },
          { nextRunAt: null }
        ]
      },
      orderBy: { nextRunAt: 'asc' },
      take: limit
    });
  }

  async markRunStart(id: string, generatedDork: string): Promise<void> {
    await prisma.dynamicSearchConfig.update({
      where: { id },
      data: {
        lastRunAt: new Date(),
        lastGeneratedDork: generatedDork
      }
    });
  }

  async markRunSuccess(
    id: string,
    intervalMinutes: number,
    cronExpression?: string | null,
    metrics?: DynamicSearchRunMetrics
  ): Promise<void> {
    const now = new Date();
    let nextRunAt: Date;

    if (cronExpression) {
      try {
        nextRunAt = CronExpressionParser.parse(cronExpression, { currentDate: now }).next().toDate();
      } catch {
        nextRunAt = new Date(now.getTime() + intervalMinutes * 60_000);
      }
    } else {
      nextRunAt = new Date(now.getTime() + intervalMinutes * 60_000);
    }

    await prisma.dynamicSearchConfig.update({
      where: { id },
      data: {
        lastSuccessAt: now,
        failureCount: 0,
        lastError: null,
        nextRunAt,
        ...(metrics ? {
          lastItemsCount: metrics.lastItemsCount,
          lastAcceptedCount: metrics.lastAcceptedCount,
          lastRejectedCount: metrics.lastRejectedCount,
          lastNewCount: metrics.lastNewCount,
          lastRediscoveredCount: metrics.lastRediscoveredCount
        } : {})
      }
    });
  }

  async markRunFailure(id: string, error: string, intervalMinutes: number, failureCount: number, cronExpression?: string | null): Promise<void> {
    const now = new Date();
    const backoffMultiplier = Math.min(Math.pow(2, failureCount), 24);
    const backoffMs = intervalMinutes * 60_000 * backoffMultiplier;
    const maxBackoffMs = 24 * 60 * 60_000; // 24 hours
    const nextRunAt = new Date(now.getTime() + Math.min(backoffMs, maxBackoffMs));

    await prisma.dynamicSearchConfig.update({
      where: { id },
      data: {
        lastFailureAt: now,
        failureCount: failureCount + 1,
        lastError: error.slice(0, 1000),
        nextRunAt
      }
    });
  }
}
