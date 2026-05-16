import type { SourceAccessMode } from '../config/sources.js';

export type RemoteType = 'remote' | 'hybrid' | 'onsite' | 'unknown';

export interface NormalizedJob {
  source: string;
  sourceId: string;
  collector: string;
  discoveredVia: string;
  sourceUrl: string;
  canonicalUrl: string;
  sourceTrustScore: number;
  sourceAccessMode: SourceAccessMode;
  title: string;
  normalizedTitle: string;
  companyName: string;
  location: string | null;
  remoteType: RemoteType;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  seniority: string | null;
  description: string | null;
  requirements: string | null;
  stackTags: string[];
  postedAt: Date | null;
  contentHash: string;
}
