import * as cheerio from 'cheerio';
import type { SourceConfig } from '../config/sources.js';
import type { RawJobItem } from './collector.types.js';

export function parseRssItems(xml: string, source: SourceConfig): RawJobItem[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  const items: RawJobItem[] = [];

  $('item, entry').each((_, element) => {
    const node = $(element);
    const title = node.find('title').first().text();
    const link =
      node.find('link').first().text() ||
      node.find('link').first().attr('href') ||
      node.find('guid').first().text();
    const description = node.find('description, content\\:encoded, content').first().text();
    const companyName =
      node.find('himalayasJobs\\:companyName, company, author name, author').first().text() || undefined;
    const location = node.find('himalayasJobs\\:locationRestriction, location').first().text() || undefined;
    const postedAtText = node.find('pubDate, published, updated').first().text();

    if (!title || !link) return;

    items.push({
      source: source.name,
      sourceId: source.id,
      sourceUrl: link,
      sourceTrustScore: source.sourceTrustScore,
      sourceAccessMode: source.accessMode,
      title,
      companyName,
      location,
      description,
      postedAt: postedAtText ? new Date(postedAtText) : null,
      raw: { rssTitle: title }
    });
  });

  return items;
}
