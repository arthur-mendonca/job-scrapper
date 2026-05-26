import type { Job, Prisma } from '@prisma/client';
import type { NormalizedJob } from '../normalizer/normalizer.types.js';
import type { JobScore } from '../scoring/scoring.service.js';
import { prisma } from './prisma.js';

export const jobSorts = ['lastSeen_desc', 'score_desc', 'discovered_desc', 'company_asc', 'title_asc'] as const;
export type JobSort = (typeof jobSorts)[number];

export interface ListJobsInput {
  page: number;
  pageSize: number;
  status?: string;
  source?: string;
  stack?: string;
  minScore?: number;
  remoteType?: string;
  seniority?: string;
  q?: string;
  sort: JobSort;
}

export interface ListJobsResult {
  jobs: Job[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export type JobWithEvents = Prisma.JobGetPayload<{ include: { events: true } }>;

export class JobRepository {
  async create(job: NormalizedJob, score: JobScore, status = 'new'): Promise<Job> {
    return prisma.job.create({
      data: toJobData(job, score, status)
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

  async updateRediscovered(existing: Job, job: NormalizedJob, score: JobScore, status = existing.status): Promise<Job> {
    return prisma.job.update({
      where: { id: existing.id },
      data: {
        ...toJobData(job, score, status),
        sourceTrustScore: Math.max(existing.sourceTrustScore, job.sourceTrustScore),
        discoveredAt: existing.discoveredAt,
        lastSeenAt: new Date(),
        notifiedAt: existing.notifiedAt,
        status
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

  async listForApi(input: ListJobsInput): Promise<ListJobsResult> {
    const where = buildJobWhere(input);
    const skip = (input.page - 1) * input.pageSize;
    const orderBy = jobOrderBy(input.sort);

    const [total, jobs] = await prisma.$transaction([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy,
        skip,
        take: input.pageSize
      })
    ]);

    const totalPages = Math.ceil(total / input.pageSize);

    return {
      jobs,
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total,
        totalPages,
        hasNextPage: input.page < totalPages
      }
    };
  }

  async findByIdWithEvents(id: string): Promise<JobWithEvents | null> {
    return prisma.job.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  async updateStatusWithEvent(id: string, status: string): Promise<Job | null> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.job.findUnique({ where: { id } });
      if (!existing) return null;

      const updated = await tx.job.update({
        where: { id },
        data: { status }
      });

      await tx.jobEvent.create({
        data: {
          jobId: id,
          eventType: 'status_changed',
          metadata: {
            previousStatus: existing.status,
            status
          }
        }
      });

      return updated;
    });
  }
}

function buildJobWhere(input: ListJobsInput): Prisma.JobWhereInput {
  const and: Prisma.JobWhereInput[] = [];

  if (input.status) {
    and.push({ status: input.status });
  }

  if (input.source) {
    and.push({
      OR: [
        { source: { equals: input.source, mode: 'insensitive' } },
        { sourceId: { equals: input.source, mode: 'insensitive' } }
      ]
    });
  }

  if (input.stack) {
    and.push({ stackTags: { has: input.stack } });
  }

  if (input.minScore !== undefined) {
    and.push({ score: { gte: input.minScore } });
  }

  if (input.remoteType) {
    and.push({ remoteType: { equals: input.remoteType, mode: 'insensitive' } });
  }

  if (input.seniority) {
    and.push({ seniority: { equals: input.seniority, mode: 'insensitive' } });
  }

  if (input.q) {
    and.push({
      OR: [
        { title: { contains: input.q, mode: 'insensitive' } },
        { companyName: { contains: input.q, mode: 'insensitive' } },
        { source: { contains: input.q, mode: 'insensitive' } },
        { location: { contains: input.q, mode: 'insensitive' } },
        { description: { contains: input.q, mode: 'insensitive' } }
      ]
    });
  }

  return and.length ? { AND: and } : {};
}

function jobOrderBy(sort: JobSort): Prisma.JobOrderByWithRelationInput[] {
  switch (sort) {
    case 'score_desc':
      return [{ score: 'desc' }, { lastSeenAt: 'desc' }];
    case 'discovered_desc':
      return [{ discoveredAt: 'desc' }, { lastSeenAt: 'desc' }];
    case 'company_asc':
      return [{ companyName: 'asc' }, { title: 'asc' }];
    case 'title_asc':
      return [{ title: 'asc' }, { companyName: 'asc' }];
    case 'lastSeen_desc':
    default:
      return [{ lastSeenAt: 'desc' }];
  }
}

function toJobData(job: NormalizedJob, score: JobScore, status: string): Prisma.JobUncheckedCreateInput {
  return {
    source: job.source,
    sourceId: job.sourceId,
    collector: job.collector,
    discoveredVia: job.discoveredVia,
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
    geoRestrictions: job.geoRestrictions,
    postedAt: job.postedAt,
    lastSeenAt: new Date(),
    score: score.score,
    sourceTrustScore: job.sourceTrustScore,
    status,
    contentHash: job.contentHash,
    matchReasons: score.matchReasons,
    riskFlags: score.riskFlags,
    recommendedAction: score.recommendedAction
  };
}
