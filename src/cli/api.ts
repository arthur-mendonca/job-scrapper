import { env } from '../config/env.js';
import { logger } from '../logger/logger.js';
import { prisma } from '../persistence/prisma.js';
import { buildServer } from '../server/server.js';

async function main(): Promise<void> {
  const app = await buildServer();

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    logger.info({ signal }, 'API server shutting down');
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.once('SIGINT', (signal) => {
    void shutdown(signal);
  });
  process.once('SIGTERM', (signal) => {
    void shutdown(signal);
  });

  await app.listen({ host: env.API_HOST, port: env.API_PORT });
  logger.info({ host: env.API_HOST, port: env.API_PORT }, 'API server started');
}

main().catch(async (error) => {
  logger.error({ err: error }, 'API server failed to start');
  await prisma.$disconnect();
  process.exitCode = 1;
});
