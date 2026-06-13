import { logger } from '../logger/logger.js';
import { prisma } from '../persistence/prisma.js';
import { buildCollectionCycle } from './bootstrap.js';

async function main(): Promise<void> {
  const { cycle } = await buildCollectionCycle();
  await cycle.run();
}

main()
  .catch((error) => {
    logger.error({ err: error }, 'One-shot collection failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
