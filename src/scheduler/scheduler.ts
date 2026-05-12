import cron from 'node-cron';
import { env } from '../config/env.js';
import { logger } from '../logger/logger.js';
import type { CollectionCycle } from '../pipeline/collection-cycle.js';

export class Scheduler {
  private running = false;
  private task: cron.ScheduledTask | null = null;

  constructor(private readonly collectionCycle: CollectionCycle) {}

  start(): void {
    if (!cron.validate(env.COLLECT_CRON)) {
      throw new Error(`Invalid COLLECT_CRON expression: ${env.COLLECT_CRON}`);
    }

    logger.info({ cron: env.COLLECT_CRON }, 'Scheduler starting');

    this.task = cron.schedule(env.COLLECT_CRON, () => {
      void this.runScheduledCycle();
    });

    this.registerShutdownHandlers();
  }

  private async runScheduledCycle(): Promise<void> {
    if (this.running) {
      logger.warn('Skipping scheduled collection because previous cycle is still running');
      return;
    }

    this.running = true;
    try {
      await this.collectionCycle.run();
    } catch (error) {
      logger.error({ err: error }, 'Scheduled collection failed');
    } finally {
      this.running = false;
    }
  }

  private registerShutdownHandlers(): void {
    const shutdown = (signal: NodeJS.Signals): void => {
      logger.info({ signal }, 'Scheduler shutting down');
      this.task?.stop();
      process.exit(0);
    };

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  }
}
