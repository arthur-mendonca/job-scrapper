import { logger } from '../logger/logger.js';
import { env } from '../config/env.js';
import { Scheduler } from '../scheduler/scheduler.js';
import { DynamicSearchScheduler } from '../scheduler/dynamic-search.scheduler.js';
import { prisma } from '../persistence/prisma.js';
import { buildCollectionCycle } from './bootstrap.js';

async function main(): Promise<void> {
  const { cycle, sources } = await buildCollectionCycle();

  // Set up dynamic search scheduler
  const dynamicSearchScheduler = new DynamicSearchScheduler({
    allSources: sources,
    processRawItems: (items) => cycle.processRawItems(items)
  });

  const scheduler = new Scheduler(cycle, dynamicSearchScheduler);
  scheduler.start();
  logger.info('Worker started');

  let shuttingDown = false;
  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info({ signal }, 'Worker shutting down');
    scheduler.stopScheduling();

    const result = await scheduler.awaitInFlight(env.WORKER_SHUTDOWN_TIMEOUT_MS);
    if (result === 'timeout') {
      logger.warn({ timeoutMs: env.WORKER_SHUTDOWN_TIMEOUT_MS }, 'Shutdown timeout reached, forcing exit');
      process.exit(0);
    }

    await prisma.$disconnect();
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

main().catch((error) => {
  logger.error({ err: error }, 'Worker failed to start');
  process.exitCode = 1;
});
