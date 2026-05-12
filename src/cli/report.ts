import { env } from '../config/env.js';
import { logger } from '../logger/logger.js';
import { JobRepository } from '../persistence/job.repository.js';
import { prisma } from '../persistence/prisma.js';

async function main(): Promise<void> {
  const repository = new JobRepository();
  const highScoring = await repository.listHighScoring(20, env.NOTIFICATION_SCORE_THRESHOLD);
  const recent = await repository.listRecent(20);

  logger.info(
    {
      highScoring: highScoring.map((job) => ({
        score: job.score,
        sourceTrustScore: job.sourceTrustScore,
        title: job.title,
        companyName: job.companyName,
        source: job.source,
        riskFlags: job.riskFlags,
        url: job.canonicalUrl
      })),
      recent: recent.map((job) => ({
        score: job.score,
        sourceTrustScore: job.sourceTrustScore,
        title: job.title,
        companyName: job.companyName,
        source: job.source,
        url: job.canonicalUrl
      }))
    },
    'Job report'
  );
}

main()
  .catch((error) => {
    logger.error({ err: error }, 'Report failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
