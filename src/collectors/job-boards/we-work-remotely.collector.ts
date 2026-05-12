import type { SourceConfig } from '../../config/sources.js';
import { fetchText } from '../../utils/http.js';
import { sleep } from '../../utils/sleep.js';
import type { JobCollector, RawJobItem } from '../collector.types.js';
import { dedupeRawItems } from '../html-public.collector.js';
import { parseRssItems } from '../rss.js';

export class WeWorkRemotelyCollector implements JobCollector {
  readonly name: string;

  constructor(private readonly source: SourceConfig) {
    this.name = source.name;
  }

  async collect(): Promise<RawJobItem[]> {
    const endpoints = this.source.endpoints?.length
      ? this.source.endpoints
      : [`${this.source.baseUrl}/remote-jobs.rss`];
    const items: RawJobItem[] = [];

    for (const endpoint of endpoints) {
      const xml = await fetchText(endpoint);
      items.push(...parseRssItems(xml, this.source));
      await sleep(this.source.rateLimitMs);
    }

    return dedupeRawItems(items);
  }
}
