import type { DynamicSearchConfig } from '@prisma/client';
import type { SourceConfig } from '../config/sources.js';
import { env } from '../config/env.js';
import { logger } from '../logger/logger.js';
import { fetchJson } from '../utils/http.js';
import { compactWhitespace } from '../utils/text.js';
import type { RawJobItem } from './collector.types.js';
import { inferSourceFromUrl, searxngHeaders } from './searxng.collector.js';
import type { EnrichedQuery } from '../dynamic-search/query-enrichment.service.js';

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

export class DynamicSearxngCollector {
  readonly name: string;

  constructor(
    private readonly config: DynamicSearchConfig,
    private readonly enrichedQuery: EnrichedQuery,
    private readonly allSources: SourceConfig[]
  ) {
    this.name = `dynamic-searxng:${config.label}`;
  }

  async collect(): Promise<RawJobItem[]> {
    const items: RawJobItem[] = [];
    const engines = this.enrichedQuery.targetEngines.join(',');

    const url = `${env.SEARXNG_BASE_URL.replace(/\/$/, '')}/search?q=${encodeURIComponent(
      this.enrichedQuery.dork
    )}&format=json&categories=general&language=${encodeURIComponent(
      this.config.locale
    )}&engines=${encodeURIComponent(engines)}`;

    const data = await fetchJson<SearxngResponse>(url, { headers: searxngHeaders() });
    const results = (data.results ?? []).slice(0, this.config.maxResults);

    logger.info(
      {
        configId: this.config.id,
        label: this.config.label,
        query: this.enrichedQuery.originalQuery,
        dork: this.enrichedQuery.dork,
        engines,
        rawResults: data.results?.length ?? 0,
        limitedResults: results.length,
        sample: results.slice(0, 5).map((result) => ({
          title: result.title,
          url: result.url,
          engine: result.engine
        }))
      },
      'Dynamic SearXNG query returned results'
    );

    for (const result of results) {
      if (!result.url || !result.title) continue;
      const inferredSource = inferSourceFromUrl(result.url, this.allSources);

      items.push({
        source: inferredSource ? `${inferredSource.name} via dynamic-searxng` : 'dynamic-searxng',
        sourceId: inferredSource?.id ?? 'dynamic-searxng',
        collector: this.name,
        discoveredVia: 'dynamic-searxng',
        sourceUrl: result.url,
        sourceTrustScore: inferredSource?.sourceTrustScore ?? 30,
        sourceAccessMode: inferredSource?.accessMode ?? 'search',
        title: result.title,
        description: compactWhitespace(result.content),
        postedAt: result.publishedDate ? new Date(result.publishedDate) : null,
        raw: {
          configId: this.config.id,
          originalQuery: this.enrichedQuery.originalQuery,
          generatedDork: this.enrichedQuery.dork,
          targetEngines: this.enrichedQuery.targetEngines,
          engine: result.engine
        }
      });
    }

    logger.info(
      {
        configId: this.config.id,
        label: this.config.label,
        items: items.length
      },
      'Dynamic SearXNG collector finished'
    );

    return items;
  }
}
