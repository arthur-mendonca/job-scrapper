import type { CollectionRun, Job, JobEvent, Prisma } from '@prisma/client';
import type { JobWithEvents } from '../persistence/job.repository.js';

export function toJobListItemDto(job: Job) {
  return {
    id: job.id,
    source: job.source,
    sourceId: job.sourceId,
    collector: job.collector,
    discoveredVia: job.discoveredVia,
    sourceUrl: job.sourceUrl,
    canonicalUrl: job.canonicalUrl,
    title: job.title,
    companyName: job.companyName,
    location: job.location,
    remoteType: job.remoteType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    seniority: job.seniority,
    stackTags: job.stackTags,
    geoRestrictions: job.geoRestrictions,
    score: job.score,
    sourceTrustScore: job.sourceTrustScore,
    status: job.status,
    notifiedAt: isoOrNull(job.notifiedAt),
    matchReasons: asStringArray(job.matchReasons),
    riskFlags: asStringArray(job.riskFlags),
    recommendedAction: job.recommendedAction,
    postedAt: isoOrNull(job.postedAt),
    discoveredAt: iso(job.discoveredAt),
    lastSeenAt: iso(job.lastSeenAt),
    createdAt: iso(job.createdAt),
    updatedAt: iso(job.updatedAt)
  };
}

export function toJobDetailDto(job: JobWithEvents) {
  return {
    ...toJobListItemDto(job),
    normalizedTitle: job.normalizedTitle,
    description: job.description,
    requirements: job.requirements,
    events: job.events.map(toJobEventDto)
  };
}

export function toJobEventDto(event: JobEvent) {
  return {
    id: event.id,
    jobId: event.jobId,
    eventType: event.eventType,
    metadata: event.metadata ?? null,
    createdAt: iso(event.createdAt)
  };
}

export function toEventListItemDto(event: JobEvent & { job?: Pick<Job, 'id' | 'title' | 'companyName' | 'status' | 'score'> }) {
  return {
    ...toJobEventDto(event),
    job: event.job
      ? {
          id: event.job.id,
          title: event.job.title,
          companyName: event.job.companyName,
          status: event.job.status,
          score: event.job.score
        }
      : null
  };
}

export function toCollectionRunDto(run: CollectionRun | null) {
  if (!run) return null;

  return {
    id: run.id,
    status: run.status,
    startedAt: iso(run.startedAt),
    finishedAt: isoOrNull(run.finishedAt),
    rawItems: run.rawItems,
    normalizedJobs: run.normalizedJobs,
    acceptedJobs: run.acceptedJobs,
    rejectedJobs: run.rejectedJobs,
    newJobs: run.newJobs,
    rediscoveredJobs: run.rediscoveredJobs,
    highScoringJobs: run.highScoringJobs,
    notificationsSent: run.notificationsSent,
    collectorFailures: run.collectorFailures,
    sourceMetrics: jsonArray(run.sourceMetrics),
    errors: jsonArray(run.errors)
  };
}

export function iso(date: Date): string {
  return date.toISOString();
}

export function isoOrNull(date: Date | null): string | null {
  return date ? iso(date) : null;
}

export function asStringArray(value: Prisma.JsonValue | null): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function jsonArray(value: Prisma.JsonValue | null): unknown[] {
  return Array.isArray(value) ? value : [];
}
