import type { SourceConfig } from '../config/sources.js';
import { env } from '../config/env.js';
import { fetchJson } from '../utils/http.js';
import { sleep } from '../utils/sleep.js';
import { compactWhitespace } from '../utils/text.js';
import { domainFromUrl } from '../utils/url.js';
import type { JobCollector, RawJobItem } from './collector.types.js';
import { dedupeRawItems } from './html-public.collector.js';

interface SearxngResult {
  title?: string;
  url?: string;
  content?: string;
  publishedDate?: string;
  engine?: string;
}

interface SearxngResponse {
  results?: SearxngResult[];
}

export class SearxngCollector implements JobCollector {
  readonly name: string;

  constructor(
    private readonly source: SourceConfig,
    private readonly allSources: SourceConfig[]
  ) {
    this.name = source.name;
  }

  async collect(): Promise<RawJobItem[]> {
    const queries = this.source.queries?.length ? this.source.queries : ['remote TypeScript Node.js LATAM'];
    const items: RawJobItem[] = [];

    for (const query of queries) {
      const url = `${env.SEARXNG_BASE_URL.replace(/\/$/, '')}/search?q=${encodeURIComponent(
        query
      )}&format=json&categories=general&language=en-US`;
      const data = await fetchJson<SearxngResponse>(url);

      for (const result of data.results ?? []) {
        if (!result.url || !result.title) continue;
        const inferredSource = inferSourceFromUrl(result.url, this.allSources);
        items.push({
          source: inferredSource ? `${inferredSource.name} via SearXNG` : this.source.name,
          sourceId: inferredSource?.id ?? this.source.id,
          sourceUrl: result.url,
          sourceTrustScore: inferredSource?.sourceTrustScore ?? this.source.sourceTrustScore,
          sourceAccessMode: inferredSource?.accessMode ?? this.source.accessMode,
          title: result.title,
          description: compactWhitespace(result.content),
          postedAt: result.publishedDate ? new Date(result.publishedDate) : null,
          raw: { query, engine: result.engine }
        });
      }
      await sleep(this.source.rateLimitMs);
    }

    return dedupeRawItems(items);
  }
}

function inferSourceFromUrl(url: string, sources: SourceConfig[]): SourceConfig | null {
  const resultDomain = domainFromUrl(url);
  if (!resultDomain) return null;

  return (
    sources.find((source) => {
      if (!source.baseUrl || source.id === 'searxng' || source.id === 'email-alerts') return false;
      const sourceDomain = domainFromUrl(source.baseUrl);
      return Boolean(sourceDomain && resultDomain.endsWith(sourceDomain));
    }) ?? null
  );
}
