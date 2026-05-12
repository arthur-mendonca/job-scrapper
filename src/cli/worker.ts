import { logger } from '../logger/logger.js';
import { Scheduler } from '../scheduler/scheduler.js';
import { buildCollectionCycle } from './bootstrap.js';

async function main(): Promise<void> {
  const cycle = await buildCollectionCycle();
  const scheduler = new Scheduler(cycle);
  scheduler.start();
  logger.info('Worker started');
}

main().catch((error) => {
  logger.error({ err: error }, 'Worker failed to start');
  process.exitCode = 1;
});
