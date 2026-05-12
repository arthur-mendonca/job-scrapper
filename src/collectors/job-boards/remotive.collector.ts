import type { SourceConfig } from '../../config/sources.js';
import { fetchJson } from '../../utils/http.js';
import { sleep } from '../../utils/sleep.js';
import type { JobCollector, RawJobItem } from '../collector.types.js';
import { dedupeRawItems } from '../html-public.collector.js';

interface RemotiveJob {
  url?: string;
  title?: string;
  company_name?: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
  publication_date?: string;
  tags?: string[];
}

interface RemotiveResponse {
  jobs?: RemotiveJob[];
}

export class RemotiveCollector implements JobCollector {
  readonly name: string;

  constructor(private readonly source: SourceConfig) {
    this.name = source.name;
  }

  async collect(): Promise<RawJobItem[]> {
    const queries = this.source.queries?.length ? this.source.queries : ['typescript node'];
    const items: RawJobItem[] = [];

    for (const query of queries) {
      const url = `${this.source.baseUrl}/api/remote-jobs?search=${encodeURIComponent(query)}`;
      const data = await fetchJson<RemotiveResponse>(url);
      for (const job of data.jobs ?? []) {
        if (!job.url || !job.title) continue;
        items.push({
          source: this.source.name,
          sourceId: this.source.id,
          sourceUrl: job.url,
          sourceTrustScore: this.source.sourceTrustScore,
          sourceAccessMode: this.source.accessMode,
          title: job.title,
          companyName: job.company_name,
          location: job.candidate_required_location,
          salaryText: job.salary,
          description: job.description,
          postedAt: job.publication_date ? new Date(job.publication_date) : null,
          raw: job
        });
      }
      await sleep(this.source.rateLimitMs);
    }

    return dedupeRawItems(items);
  }
}
