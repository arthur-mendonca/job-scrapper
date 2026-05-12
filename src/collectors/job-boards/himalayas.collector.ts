import type { SourceConfig } from '../../config/sources.js';
import { fetchJson } from '../../utils/http.js';
import { sleep } from '../../utils/sleep.js';
import type { JobCollector, RawJobItem } from '../collector.types.js';
import { dedupeRawItems } from '../html-public.collector.js';

interface HimalayasJob {
  title?: string;
  companyName?: string;
  company?: { name?: string };
  applicationLink?: string;
  url?: string;
  link?: string;
  locationRestrictions?: string[];
  timezoneRestrictions?: string[];
  description?: string;
  content?: string;
  salary?: { min?: number; max?: number; currency?: string };
  pubDate?: string;
  createdAt?: string;
}

export class HimalayasCollector implements JobCollector {
  readonly name: string;

  constructor(private readonly source: SourceConfig) {
    this.name = source.name;
  }

  async collect(): Promise<RawJobItem[]> {
    const queries = this.source.queries?.length ? this.source.queries : ['typescript node'];
    const items: RawJobItem[] = [];

    for (const query of queries) {
      const url = `${this.source.baseUrl}/jobs/api/search?q=${encodeURIComponent(query)}&sort=recent&page=1`;
      const data = await fetchJson<unknown>(url);
      const jobs = extractJobs(data);
      for (const job of jobs) {
        const sourceUrl = job.applicationLink ?? job.url ?? job.link;
        if (!sourceUrl || !job.title) continue;
        const locationParts = [...(job.locationRestrictions ?? []), ...(job.timezoneRestrictions ?? [])];
        const salaryText = job.salary
          ? `${job.salary.currency ?? ''} ${job.salary.min ?? ''}-${job.salary.max ?? ''}`
          : undefined;
        items.push({
          source: this.source.name,
          sourceId: this.source.id,
          sourceUrl,
          sourceTrustScore: this.source.sourceTrustScore,
          sourceAccessMode: this.source.accessMode,
          title: job.title,
          companyName: job.companyName ?? job.company?.name,
          location: locationParts.join(', ') || 'Remote',
          salaryText,
          description: job.description ?? job.content,
          postedAt: job.pubDate || job.createdAt ? new Date(job.pubDate ?? job.createdAt ?? '') : null,
          raw: job
        });
      }
      await sleep(this.source.rateLimitMs);
    }

    return dedupeRawItems(items);
  }
}

function extractJobs(data: unknown): HimalayasJob[] {
  if (Array.isArray(data)) return data as HimalayasJob[];
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of ['jobs', 'data', 'items', 'results']) {
      const value = record[key];
      if (Array.isArray(value)) return value as HimalayasJob[];
    }
  }
  return [];
}
