import type { RawJobItem } from '../collectors/collector.types.js';
import { sha256 } from '../utils/hashing.js';
import { canonicalizeUrl } from '../utils/url.js';
import { compactWhitespace, normalizeKey, uniq } from '../utils/text.js';
import type { NormalizedJob, RemoteType } from './normalizer.types.js';

const stackPatterns: Array<[string, RegExp]> = [
  ['TypeScript', /\btypescript\b|\bts\b/i],
  ['JavaScript', /\bjavascript\b|\bvanilla js\b/i],
  ['Node.js', /\bnode\.?js\b|\bnode\b/i],
  ['NestJS', /\bnest\.?js\b|\bnestjs\b/i],
  ['React', /\breact\b|\breact\.js\b/i],
  ['Next.js', /\bnext\.?js\b|\bnextjs\b/i],
  ['AWS', /\baws\b|amazon web services/i],
  ['Docker', /\bdocker\b/i],
  ['CI/CD', /\bci\/cd\b|\bcontinuous integration\b|\bcontinuous delivery\b/i],
  ['PostgreSQL', /\bpostgresql\b|\bpostgres\b/i],
  ['REST APIs', /\brest apis?\b|\brestful\b|\bapi integrations?\b/i],
  ['AI', /\bai\b|artificial intelligence/i],
  ['LLM', /\bllm\b|large language model|openai|claude|rag\b/i],
  ['automation', /\bautomation\b|automacao|automate|workflow/i],
  ['Python', /\bpython\b/i],
  ['Java', /\bjava\b|\bkotlin\b/i],
  ['.NET', /\.net\b|dotnet/i],
  ['C#', /\bc#\b|c sharp/i],
  ['PHP', /\bphp\b|laravel/i],
  ['Ruby', /\bruby\b|rails\b/i],
  ['mobile-only', /\bios\b|\bandroid\b|react native|flutter/i],
  ['WordPress-only', /\bwordpress\b/i]
];

export function normalizeJob(raw: RawJobItem): NormalizedJob | null {
  const title = compactWhitespace(raw.title);
  const companyName = compactWhitespace(raw.companyName) || 'Unknown Company';
  const sourceUrl = compactWhitespace(raw.sourceUrl);

  if (!title || !sourceUrl) {
    return null;
  }

  const description = compactWhitespace(raw.description);
  const requirements = compactWhitespace(raw.requirements);
  const location = compactWhitespace(raw.location);
  const salary = parseSalary(raw.salaryText ?? `${description} ${requirements}`);
  const normalizedTitle = normalizeTitle(title);
  const canonicalUrl = canonicalizeUrl(sourceUrl);
  const stackTags = detectStackTags(`${title} ${description} ${requirements}`);
  const contentHash = sha256(
    normalizeKey(`${normalizedTitle} ${companyName} ${description || requirements || canonicalUrl}`)
  );

  return {
    source: raw.source,
    sourceId: raw.sourceId,
    collector: compactWhitespace(raw.collector) || raw.source,
    discoveredVia: compactWhitespace(raw.discoveredVia) || compactWhitespace(raw.collector) || raw.source,
    sourceUrl,
    canonicalUrl,
    sourceTrustScore: raw.sourceTrustScore,
    sourceAccessMode: raw.sourceAccessMode,
    title,
    normalizedTitle,
    companyName,
    location: location || null,
    remoteType: detectRemoteType(`${title} ${location} ${description} ${requirements}`),
    salaryMin: salary.salaryMin,
    salaryMax: salary.salaryMax,
    currency: salary.currency,
    seniority: detectSeniority(`${title} ${description} ${requirements}`),
    description: description || null,
    requirements: requirements || null,
    stackTags,
    postedAt: raw.postedAt ?? null,
    contentHash
  };
}

export function normalizeTitle(title: string): string {
  return normalizeKey(title)
    .replace(/\b(remote|latam|worldwide|contract|full time|part time)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectStackTags(text: string): string[] {
  return uniq(stackPatterns.filter(([, pattern]) => pattern.test(text)).map(([tag]) => tag));
}

export function detectRemoteType(text: string): RemoteType {
  const value = normalizeKey(text);
  if (/\bhybrid\b|\bhibrido\b|\bhibrida\b/.test(value)) return 'hybrid';
  if (/\bonsite\b|\bon site\b|\bin office\b|\bpresencial\b/.test(value)) return 'onsite';
  if (/\bremote\b|\bremoto\b|\bworldwide\b|\banywhere\b|\blatam\b|\bhome office\b/.test(value)) return 'remote';
  return 'unknown';
}

export function detectSeniority(text: string): string | null {
  const value = normalizeKey(text);
  if (/\bintern\b|\bestagio\b|\binternship\b/.test(value)) return 'Intern';
  if (/\bjunior\b|\bjr\b|\bentry level\b/.test(value)) return 'Junior';
  if (/\bmid\b|\bmid level\b|\bintermediate\b|\bintermediario\b|\bpleno\b/.test(value)) return 'Mid-level';
  if (/\bsenior\b|\bsr\b/.test(value)) return 'Senior';
  if (/\bstaff\b/.test(value)) return 'Staff';
  if (/\bprincipal\b/.test(value)) return 'Principal';
  if (/\blead\b|\btech lead\b/.test(value)) return 'Lead';
  return null;
}

interface SalaryParseResult {
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
}

export function parseSalary(text: string): SalaryParseResult {
  const value = compactWhitespace(text);
  const currency = detectCurrency(value);
  const matches = [...value.matchAll(/(?:\$|USD|US\$|EUR|€|BRL|R\$)?\s*(\d{2,6})(?:\s?k)?/gi)]
    .map((match) => {
      const rawNumber = Number.parseInt(match[1] ?? '', 10);
      if (!Number.isFinite(rawNumber)) return null;
      return /k\b/i.test(match[0]) && rawNumber < 1000 ? rawNumber * 1000 : rawNumber;
    })
    .filter((number): number is number => Boolean(number && number >= 1000));

  if (matches.length === 0) {
    return { salaryMin: null, salaryMax: null, currency };
  }

  return {
    salaryMin: Math.min(...matches),
    salaryMax: Math.max(...matches),
    currency
  };
}

function detectCurrency(text: string): string | null {
  if (/\bUSD\b|US\$|\$/.test(text)) return 'USD';
  if (/\bEUR\b|€/.test(text)) return 'EUR';
  if (/\bBRL\b|R\$/.test(text)) return 'BRL';
  if (/\bGBP\b|£/.test(text)) return 'GBP';
  return null;
}
