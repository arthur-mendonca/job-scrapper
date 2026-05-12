import type { Job, Prisma } from '@prisma/client';
import type { NormalizedJob } from '../normalizer/normalizer.types.js';
import type { JobScore } from '../scoring/scoring.service.js';
import { prisma } from './prisma.js';

export class JobRepository {
  async create(job: NormalizedJob, score: JobScore): Promise<Job> {
    return prisma.job.create({
      data: toJobData(job, score)
    });
  }

  async findByCanonicalUrl(canonicalUrl: string): Promise<Job | null> {
    return prisma.job.findUnique({ where: { canonicalUrl } });
  }

  async findByTitleCompany(normalizedTitle: string, companyName: string): Promise<Job | null> {
    return prisma.job.findFirst({
      where: {
        normalizedTitle,
        companyName: { equals: companyName, mode: 'insensitive' }
      },
      orderBy: { lastSeenAt: 'desc' }
    });
  }

  async findByContentHash(contentHash: string): Promise<Job | null> {
    return prisma.job.findFirst({
      where: { contentHash },
      orderBy: { lastSeenAt: 'desc' }
    });
  }

  async findDuplicate(job: NormalizedJob): Promise<Job | null> {
    return (
      (await this.findByCanonicalUrl(job.canonicalUrl)) ??
      (await this.findByTitleCompany(job.normalizedTitle, job.companyName)) ??
      (await this.findByContentHash(job.contentHash))
    );
  }

  async updateRediscovered(existing: Job, job: NormalizedJob, score: JobScore): Promise<Job> {
    return prisma.job.update({
      where: { id: existing.id },
      data: {
        ...toJobData(job, score),
        sourceTrustScore: Math.max(existing.sourceTrustScore, job.sourceTrustScore),
        discoveredAt: existing.discoveredAt,
        lastSeenAt: new Date(),
        notifiedAt: existing.notifiedAt,
        status: existing.status
      }
    });
  }

  async markAsNotified(id: string): Promise<Job> {
    return prisma.job.update({
      where: { id },
      data: {
        notifiedAt: new Date(),
        status: 'notified'
      }
    });
  }

  async listHighScoring(limit = 25, minScore = 75): Promise<Job[]> {
    return prisma.job.findMany({
      where: { score: { gte: minScore } },
      orderBy: [{ score: 'desc' }, { lastSeenAt: 'desc' }],
      take: limit
    });
  }

  async listRecent(limit = 25): Promise<Job[]> {
    return prisma.job.findMany({
      orderBy: { lastSeenAt: 'desc' },
      take: limit
    });
  }
}

function toJobData(job: NormalizedJob, score: JobScore): Prisma.JobUncheckedCreateInput {
  return {
    source: job.source,
    sourceUrl: job.sourceUrl,
    canonicalUrl: job.canonicalUrl,
    title: job.title,
    normalizedTitle: job.normalizedTitle,
    companyName: job.companyName,
    location: job.location,
    remoteType: job.remoteType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    seniority: job.seniority,
    description: job.description,
    requirements: job.requirements,
    stackTags: job.stackTags,
    postedAt: job.postedAt,
    lastSeenAt: new Date(),
    score: score.score,
    sourceTrustScore: job.sourceTrustScore,
    status: 'new',
    contentHash: job.contentHash,
    matchReasons: score.matchReasons,
    riskFlags: score.riskFlags,
    recommendedAction: score.recommendedAction
  };
}
