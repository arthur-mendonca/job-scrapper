import * as cheerio from 'cheerio';
import type { SourceConfig } from '../config/sources.js';
import { fetchText } from '../utils/http.js';
import { canonicalizeUrl } from '../utils/url.js';
import { compactWhitespace } from '../utils/text.js';
import type { JobCollector, RawJobItem } from './collector.types.js';

const jobHrefPattern = /\/(jobs?|careers?|positions?|vagas?|openings?|opportunities?)(\/|$)|careers\/job/i;
const jobTextPattern = /engineer|developer|software|backend|back-end|full stack|full-stack|node|typescript|react|devops|data|ai/i;

export class PublicHtmlCollector implements JobCollector {
  readonly name: string;

  constructor(private readonly source: SourceConfig) {
    this.name = source.name;
  }

  async collect(): Promise<RawJobItem[]> {
    const urls = this.source.endpoints?.length ? this.source.endpoints : [this.source.baseUrl];
    const items: RawJobItem[] = [];

    for (const url of urls) {
      const html = await fetchText(url);
      items.push(...extractPublicHtmlJobs(html, this.source, url));
    }

    return dedupeRawItems(items);
  }
}

export function extractPublicHtmlJobs(html: string, source: SourceConfig, pageUrl: string): RawJobItem[] {
  const $ = cheerio.load(html);
  const items: RawJobItem[] = [];

  $('a[href]').each((_, anchor) => {
    const link = $(anchor);
    const href = link.attr('href');
    if (!href) return;

    const absoluteUrl = canonicalizeUrl(href, pageUrl);
    const anchorText = compactWhitespace(link.text());
    const parent = link.closest('article, li, section, div');
    const parentText = compactWhitespace(parent.text());
    const title =
      compactWhitespace(parent.find('h1,h2,h3,h4,[class*=title],[class*=role],[class*=position]').first().text()) ||
      anchorText;

    const searchable = `${href} ${title} ${parentText}`;
    if (!jobHrefPattern.test(searchable) && !jobTextPattern.test(searchable)) return;
    if (!title || title.length < 4 || title.length > 160) return;

    items.push({
      source: source.name,
      sourceId: source.id,
      sourceUrl: absoluteUrl,
      sourceTrustScore: source.sourceTrustScore,
      sourceAccessMode: source.accessMode,
      title,
      companyName: source.type === 'company' ? source.name.replace(/\s*Careers$/i, '') : undefined,
      location: extractLocation(parentText),
      description: parentText,
      raw: { pageUrl }
    });
  });

  return dedupeRawItems(items).slice(0, 80);
}

export function dedupeRawItems(items: RawJobItem[]): RawJobItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.sourceUrl || `${item.title}-${item.companyName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractLocation(text: string): string | undefined {
  const match = text.match(/(Remote|Remoto|LATAM|Worldwide|Anywhere|Hybrid|Onsite|Brazil|Brasil|US|USA)[^|,.;)]{0,60}/i);
  return match?.[0]?.trim();
}
