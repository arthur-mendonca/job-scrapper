import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';
import type { SourceConfig } from '../config/sources.js';
import { env } from '../config/env.js';
import { compactWhitespace } from '../utils/text.js';
import type { JobCollector, RawJobItem } from './collector.types.js';
import { dedupeRawItems } from './html-public.collector.js';

export class EmailAlertsCollector implements JobCollector {
  readonly name: string;

  constructor(private readonly source: SourceConfig) {
    this.name = source.name;
  }

  async collect(): Promise<RawJobItem[]> {
    let files: string[];
    try {
      files = await readdir(env.INPUT_EMAIL_ALERTS_DIR);
    } catch {
      return [];
    }

    const items: RawJobItem[] = [];
    for (const file of files.filter((name) => /\.(txt|html?)$/i.test(name))) {
      const fullPath = path.join(env.INPUT_EMAIL_ALERTS_DIR, file);
      const content = await readFile(fullPath, 'utf8');
      items.push(...parseEmailAlert(content, file, this.source));
    }

    return dedupeRawItems(items);
  }
}

export function parseEmailAlert(content: string, fileName: string, source: SourceConfig): RawJobItem[] {
  if (/\.html?$/i.test(fileName)) {
    return parseHtmlEmail(content, fileName, source);
  }
  return parseTextEmail(content, fileName, source);
}

function parseHtmlEmail(content: string, fileName: string, source: SourceConfig): RawJobItem[] {
  const $ = cheerio.load(content);
  const items: RawJobItem[] = [];

  $('a[href]').each((_, element) => {
    const link = $(element);
    const href = link.attr('href');
    const title = compactWhitespace(link.text());
    if (!href || !/^https?:\/\//i.test(href) || title.length < 4) return;

    const parentText = compactWhitespace(link.closest('tr,li,div,p').text());
    items.push({
      source: source.name,
      sourceId: source.id,
      sourceUrl: href,
      sourceTrustScore: source.sourceTrustScore,
      sourceAccessMode: source.accessMode,
      title,
      description: parentText,
      raw: { fileName }
    });
  });

  return items;
}

function parseTextEmail(content: string, fileName: string, source: SourceConfig): RawJobItem[] {
  const urls = [...content.matchAll(/https?:\/\/[^\s<>"')]+/g)].map((match) => match[0]);
  const lines = content.split(/\r?\n/).map(compactWhitespace).filter(Boolean);

  return urls.map((url, index) => ({
    source: source.name,
    sourceId: source.id,
    sourceUrl: url,
    sourceTrustScore: source.sourceTrustScore,
    sourceAccessMode: source.accessMode,
    title: inferTitleFromLines(lines, url) ?? `Email alert job ${index + 1}`,
    description: lines.slice(Math.max(0, index - 2), index + 6).join(' '),
    raw: { fileName }
  }));
}

function inferTitleFromLines(lines: string[], url: string): string | undefined {
  const urlIndex = lines.findIndex((line) => line.includes(url));
  const candidates = lines.slice(Math.max(0, urlIndex - 3), urlIndex).reverse();
  return candidates.find((line) => line.length >= 4 && line.length <= 140);
}
