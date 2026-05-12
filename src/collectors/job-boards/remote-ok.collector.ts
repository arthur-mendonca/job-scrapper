import type { SourceConfig } from '../../config/sources.js';
import { fetchJson } from '../../utils/http.js';
import type { JobCollector, RawJobItem } from '../collector.types.js';
import { dedupeRawItems } from '../html-public.collector.js';

interface RemoteOkJob {
  id?: string;
  url?: string;
  apply_url?: string;
  position?: string;
  company?: string;
  location?: string;
  description?: string;
  salary_min?: number;
  salary_max?: number;
  date?: string;
  tags?: string[];
}

export class RemoteOkCollector implements JobCollector {
  readonly name: string;

  constructor(private readonly source: SourceConfig) {
    this.name = source.name;
  }

  async collect(): Promise<RawJobItem[]> {
    const data = await fetchJson<unknown[]>(`${this.source.baseUrl}/api`);
    const jobs = data.filter((item): item is RemoteOkJob => Boolean(item && typeof item === 'object' && 'position' in item));

    return dedupeRawItems(
      jobs.map((job) => ({
        source: this.source.name,
        sourceId: this.source.id,
        sourceUrl: job.url ?? job.apply_url ?? `${this.source.baseUrl}/remote-jobs/${job.id ?? ''}`,
        sourceTrustScore: this.source.sourceTrustScore,
        sourceAccessMode: this.source.accessMode,
        title: job.position,
        companyName: job.company,
        location: job.location,
        salaryText:
          job.salary_min || job.salary_max ? `USD ${job.salary_min ?? ''}-${job.salary_max ?? ''}` : undefined,
        description: job.description,
        postedAt: job.date ? new Date(job.date) : null,
        raw: job
      }))
    );
  }
}
