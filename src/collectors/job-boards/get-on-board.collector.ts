import type { SourceConfig } from '../../config/sources.js';
import { fetchJson } from '../../utils/http.js';
import { sleep } from '../../utils/sleep.js';
import type { JobCollector, RawJobItem } from '../collector.types.js';
import { dedupeRawItems } from '../html-public.collector.js';

interface GetOnBoardJob {
  id?: string;
  type?: string;
  attributes?: {
    title?: string;
    description?: string;
    location?: string;
    remote?: boolean;
    salary?: string;
    company_name?: string;
  };
  links?: {
    public_url?: string;
    self?: string;
  };
}

interface GetOnBoardResponse {
  data?: GetOnBoardJob[];
}

export class GetOnBoardCollector implements JobCollector {
  readonly name: string;

  constructor(private readonly source: SourceConfig) {
    this.name = source.name;
  }

  async collect(): Promise<RawJobItem[]> {
    const queries = this.source.queries?.length ? this.source.queries : ['TypeScript Node'];
    const items: RawJobItem[] = [];

    for (const query of queries) {
      const url = `${this.source.baseUrl}/api/v0/search/jobs?query=${encodeURIComponent(query)}`;
      const data = await fetchJson<GetOnBoardResponse>(url);
      for (const job of data.data ?? []) {
        const attrs = job.attributes ?? {};
        const sourceUrl = job.links?.public_url ?? job.links?.self;
        if (!sourceUrl || !attrs.title) continue;
        items.push({
          source: this.source.name,
          sourceId: this.source.id,
          sourceUrl,
          sourceTrustScore: this.source.sourceTrustScore,
          sourceAccessMode: this.source.accessMode,
          title: attrs.title,
          companyName: attrs.company_name,
          location: attrs.location ?? (attrs.remote ? 'Remote' : undefined),
          salaryText: attrs.salary,
          description: attrs.description,
          raw: job
        });
      }
      await sleep(this.source.rateLimitMs);
    }

    return dedupeRawItems(items);
  }
}
