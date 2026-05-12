import type { SourceAccessMode } from '../config/sources.js';

export interface JobCollector {
  name: string;
  collect(): Promise<RawJobItem[]>;
}

export interface RawJobItem {
  source: string;
  sourceId: string;
  sourceUrl: string;
  sourceTrustScore: number;
  sourceAccessMode: SourceAccessMode;
  title?: string;
  companyName?: string;
  location?: string;
  salaryText?: string;
  description?: string;
  requirements?: string;
  postedAt?: Date | null;
  raw?: unknown;
}
