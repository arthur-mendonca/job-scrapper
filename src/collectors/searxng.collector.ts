import type { SourceConfig } from '../config/sources.js';
import { env } from '../config/env.js';
import { logger } from '../logger/logger.js';
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
      const data = await fetchJson<SearxngResponse>(url, { headers: searxngHeaders() });
      const results = data.results ?? [];
      logger.info(
        {
          query,
          url,
          rawResults: results.length,
          sample: results.slice(0, 5).map((result) => ({
            title: result.title,
            url: result.url,
            engine: result.engine,
            inferredSource: result.url ? inferSourceFromUrl(result.url, this.allSources)?.name ?? null : null
          }))
        },
        'SearXNG query returned results'
      );

      for (const result of results) {
        if (!result.url || !result.title) continue;
        const inferredSource = inferSourceFromUrl(result.url, this.allSources);
        items.push({
          source: inferredSource ? `${inferredSource.name} via SearXNG` : this.source.name,
          sourceId: inferredSource?.id ?? this.source.id,
          collector: this.source.name,
          discoveredVia: this.source.name,
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

    const deduped = dedupeRawItems(items);
    logger.info(
      {
        rawItems: items.length,
        dedupedItems: deduped.length,
        sample: deduped.slice(0, 10).map((item) => ({
          title: item.title,
          source: item.source,
          sourceId: item.sourceId,
          collector: item.collector,
          discoveredVia: item.discoveredVia,
          url: item.sourceUrl
        }))
      },
      'SearXNG collector finished'
    );

    return deduped;
  }
}

export function inferSourceFromUrl(url: string, sources: SourceConfig[]): SourceConfig | null {
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

export function searxngHeaders(): Record<string, string> {
  return {
    'x-forwarded-for': '127.0.0.1',
    'x-real-ip': '127.0.0.1'
  };
}
