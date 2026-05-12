import type { NormalizedJob } from '../normalizer/normalizer.types.js';

export type DeduplicationMatchType = 'canonical-url' | 'title-company' | 'content-hash' | 'none';

export interface DeduplicationMatch {
  type: DeduplicationMatchType;
  job: NormalizedJob | null;
}

export function findDuplicateInMemory(candidate: NormalizedJob, existingJobs: NormalizedJob[]): DeduplicationMatch {
  const byUrl = existingJobs.find((job) => job.canonicalUrl === candidate.canonicalUrl);
  if (byUrl) return { type: 'canonical-url', job: byUrl };

  const byTitleCompany = existingJobs.find(
    (job) =>
      job.normalizedTitle === candidate.normalizedTitle &&
      job.companyName.toLowerCase() === candidate.companyName.toLowerCase()
  );
  if (byTitleCompany) return { type: 'title-company', job: byTitleCompany };

  const byContentHash = existingJobs.find((job) => job.contentHash === candidate.contentHash);
  if (byContentHash) return { type: 'content-hash', job: byContentHash };

  return { type: 'none', job: null };
}
