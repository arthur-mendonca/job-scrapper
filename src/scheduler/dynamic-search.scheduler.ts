import type { DynamicSearchConfig } from '@prisma/client';
import { CronExpressionParser } from 'cron-parser';
import type { SourceConfig } from '../config/sources.js';
import { env } from '../config/env.js';
import { DynamicSearxngCollector } from '../collectors/dynamic-searxng.collector.js';
import type { RawJobItem } from '../collectors/collector.types.js';
import type { ProcessRawItemsResult } from '../pipeline/pipeline.types.js';
import { enrichQuery } from '../dynamic-search/query-enrichment.service.js';
import { logger } from '../logger/logger.js';
import { DynamicSearchRepository } from '../persistence/dynamic-search.repository.js';
import { sleep } from '../utils/sleep.js';

export interface DynamicSearchSchedulerOptions {
  allSources: SourceConfig[];
  processRawItems: (items: RawJobItem[]) => Promise<ProcessRawItemsResult | void>;
  repository?: DynamicSearchRepository;
}

export class DynamicSearchScheduler {
  private readonly repository: DynamicSearchRepository;
  private readonly runningConfigs = new Set<string>();
  private concurrentCount = 0;
  private requestTimestamps: number[] = [];

  constructor(private readonly options: DynamicSearchSchedulerOptions) {
    this.repository = options.repository ?? new DynamicSearchRepository();
  }

  async runDueConfigs(): Promise<void> {
    if (!env.DYNAMIC_SEARCH_ENABLED) {
      logger.debug('Dynamic search is disabled, skipping');
      return;
    }

    const now = new Date();
    const dueConfigs = await this.repository.findDueConfigs(now, env.DYNAMIC_SEARCH_MAX_PER_CYCLE);

    if (dueConfigs.length === 0) {
      logger.debug('No dynamic search configs are due');
      return;
    }

    logger.info(
      { dueCount: dueConfigs.length, maxPerCycle: env.DYNAMIC_SEARCH_MAX_PER_CYCLE },
      'Dynamic search scheduler found due configs'
    );

    for (const config of dueConfigs) {
      if (!this.validateConfig(config)) continue;
      if (this.runningConfigs.has(config.id)) {
        logger.warn({ configId: config.id, label: config.label }, 'Skipping overlapping dynamic search config');
        continue;
      }
      if (this.concurrentCount >= env.DYNAMIC_SEARCH_MAX_CONCURRENT) {
        logger.info(
          { configId: config.id, label: config.label, concurrent: this.concurrentCount },
          'Skipping dynamic search config due to concurrency limit'
        );
        continue;
      }
      if (this.isGlobalRateLimitReached()) {
        logger.warn(
          { configId: config.id, limit: env.DYNAMIC_SEARCH_GLOBAL_RATE_LIMIT_MAX },
          'Global dynamic search rate limit reached, skipping remaining configs for this cycle'
        );
        break;
      }

      this.requestTimestamps.push(Date.now());
      await this.executeConfig(config);
    }
  }

  private isGlobalRateLimitReached(): boolean {
    const now = Date.now();
    const windowStart = now - env.DYNAMIC_SEARCH_GLOBAL_RATE_LIMIT_WINDOW_MS;
    
    this.requestTimestamps = this.requestTimestamps.filter(t => t > windowStart);
    
    return this.requestTimestamps.length >= env.DYNAMIC_SEARCH_GLOBAL_RATE_LIMIT_MAX;
  }

  private validateConfig(config: DynamicSearchConfig): boolean {
    if (config.cronExpression) {
      try {
        CronExpressionParser.parse(config.cronExpression);
      } catch (error) {
        logger.warn(
          {
            configId: config.id,
            label: config.label,
            cronExpression: config.cronExpression
          },
          'Dynamic search config has invalid cron expression, skipping'
        );
        return false;
      }
    } else if (config.intervalMinutes < env.DYNAMIC_SEARCH_MIN_INTERVAL_MINUTES) {
      logger.warn(
        {
          configId: config.id,
          label: config.label,
          intervalMinutes: config.intervalMinutes,
          minimumMinutes: env.DYNAMIC_SEARCH_MIN_INTERVAL_MINUTES
        },
        'Dynamic search config interval is below minimum, skipping'
      );
      return false;
    }

    return true;
  }

  private async executeConfig(config: DynamicSearchConfig): Promise<void> {
    this.runningConfigs.add(config.id);
    this.concurrentCount += 1;

    try {
      // Apply randomized jitter
      const jitterMs = Math.floor(Math.random() * env.DYNAMIC_SEARCH_JITTER_MAX_MS);
      logger.debug(
        { configId: config.id, label: config.label, jitterMs },
        'Applying jitter before dynamic search execution'
      );
      await sleep(jitterMs);

      // Enrich query
      const enriched = enrichQuery(config);

      // Mark run start
      await this.repository.markRunStart(config.id, enriched.dork);

      // Collect
      const collector = new DynamicSearxngCollector(config, enriched, this.options.allSources);
      const items = await collector.collect();

      // Rate limit between search requests
      await sleep(env.DYNAMIC_SEARCH_RATE_LIMIT_MS);

      // Process through pipeline
      let result: ProcessRawItemsResult | void | undefined = undefined;
      if (items.length > 0) {
        result = await this.options.processRawItems(items);
      }

      const metrics = result ? {
        lastItemsCount: items.length,
        lastAcceptedCount: result.acceptedJobs,
        lastRejectedCount: result.rejectedJobs,
        lastNewCount: result.newJobs,
        lastRediscoveredCount: result.rediscoveredJobs
      } : {
        lastItemsCount: items.length,
        lastAcceptedCount: 0,
        lastRejectedCount: 0,
        lastNewCount: 0,
        lastRediscoveredCount: 0
      };

      // Mark success
      await this.repository.markRunSuccess(config.id, config.intervalMinutes, config.cronExpression, metrics);

      logger.info(
        { configId: config.id, label: config.label, items: items.length },
        'Dynamic search config executed successfully'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isThrottled = isThrottlingError(error);

      logger.error(
        { err: error, configId: config.id, label: config.label, isThrottled },
        'Dynamic search config execution failed'
      );

      await this.repository.markRunFailure(
        config.id,
        message,
        config.intervalMinutes,
        config.failureCount,
        config.cronExpression
      );
    } finally {
      this.runningConfigs.delete(config.id);
      this.concurrentCount -= 1;
    }
  }
}

function isThrottlingError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('429') || msg.includes('too many') || msg.includes('rate limit') || msg.includes('captcha');
  }
  return false;
}
