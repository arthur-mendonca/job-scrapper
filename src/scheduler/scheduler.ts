import cron from 'node-cron';
import { env } from '../config/env.js';
import { logger } from '../logger/logger.js';
import type { CollectionCycle } from '../pipeline/collection-cycle.js';
import type { DynamicSearchScheduler } from './dynamic-search.scheduler.js';

export class Scheduler {
  private running = false;
  private task: cron.ScheduledTask | null = null;
  private inFlight: Promise<void> | null = null;
  private stopping = false;

  constructor(
    private readonly collectionCycle: CollectionCycle,
    private readonly dynamicSearchScheduler?: DynamicSearchScheduler
  ) {}

  start(): void {
    if (!cron.validate(env.COLLECT_CRON)) {
      throw new Error(`Invalid COLLECT_CRON expression: ${env.COLLECT_CRON}`);
    }

    logger.info({ cron: env.COLLECT_CRON }, 'Scheduler starting');

    this.task = cron.schedule(env.COLLECT_CRON, () => {
      void this.runOnce();
    });
  }

  stopScheduling(): void {
    this.stopping = true;
    this.task?.stop();
  }

  async awaitInFlight(timeoutMs: number): Promise<'idle' | 'completed' | 'timeout'> {
    if (!this.inFlight) return 'idle';

    const timeout = Math.max(0, Math.floor(timeoutMs));
    if (timeout === 0) {
      await this.inFlight;
      return 'completed';
    }

    const result = await Promise.race([
      this.inFlight.then(() => 'completed' as const),
      new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), timeout))
    ]);

    return result;
  }

  async runOnce(): Promise<void> {
    if (this.stopping) {
      logger.info('Skipping scheduled collection because scheduler is stopping');
      return;
    }

    if (this.running) {
      logger.warn('Skipping scheduled collection because previous cycle is still running');
      return;
    }

    this.running = true;
    const cyclePromise = this.collectionCycle
      .run()
      .then(async () => {
        // After main collection cycle, run dynamic search configs
        if (this.dynamicSearchScheduler && !this.stopping) {
          await this.dynamicSearchScheduler.runDueConfigs();
        }
      })
      .then(() => undefined)
      .catch((error) => {
        logger.error({ err: error }, 'Scheduled collection failed');
      })
      .finally(() => {
        this.running = false;
        this.inFlight = null;
      });

    this.inFlight = cyclePromise;
    await cyclePromise;
  }
}
