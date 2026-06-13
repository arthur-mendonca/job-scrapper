import type { DynamicSearchConfig } from '@prisma/client';

export interface EnrichedQuery {
  originalQuery: string;
  dork: string;
  targetEngines: string[];
}

const DEFAULT_EXCLUDED_TERMS = [
  'internship',
  'course',
  'bootcamp',
  'resume',
  'template',
  'onsite',
  'hybrid'
];

const REMOTE_TERMS = ['remote', 'LATAM', 'Americas', 'worldwide'];

const TITLE_URL_HINTS = ['intitle:jobs', 'intitle:careers', 'inurl:jobs', 'inurl:careers'];

/**
 * Deterministic query enrichment that transforms a user-defined search term
 * into a constrained SearXNG dork with job-search operators.
 *
 * Preserves the original query text for auditability while adding:
 * - Remote-work terms (if not already present)
 * - site: operators from targetSites
 * - Negative filters from excludedTerms
 * - Required terms
 * - Title/URL hints for job pages
 */
export function enrichQuery(config: DynamicSearchConfig): EnrichedQuery {
  const parts: string[] = [];

  // Preserve original meaningful terms
  const queryTerms = config.queryText.trim();
  if (queryTerms) {
    parts.push(queryTerms);
  }

  // Add required terms
  for (const term of config.requiredTerms) {
    const normalized = term.trim().toLowerCase();
    if (normalized && !queryTerms.toLowerCase().includes(normalized)) {
      parts.push(`"${term.trim()}"`);
    }
  }

  // Add remote-work terms if none are present in the query
  const lowerQuery = queryTerms.toLowerCase();
  const hasRemoteTerm = REMOTE_TERMS.some((term) => lowerQuery.includes(term.toLowerCase()));
  if (!hasRemoteTerm) {
    parts.push('(remote OR LATAM OR Americas OR worldwide)');
  }

  // Add site: operators for target domains
  if (config.targetSites.length > 0) {
    const siteFilters = config.targetSites
      .map((site) => `site:${site.trim()}`)
      .join(' OR ');
    parts.push(`(${siteFilters})`);
  }

  // Add title/URL hints (pick first two to avoid over-constraining)
  const hints = TITLE_URL_HINTS.slice(0, 2);
  parts.push(`(${hints.join(' OR ')})`);

  // Add excluded terms as negative filters
  const exclusions = config.excludedTerms.length > 0
    ? config.excludedTerms
    : DEFAULT_EXCLUDED_TERMS;

  for (const term of exclusions) {
    const trimmed = term.trim();
    if (trimmed) {
      parts.push(`-${trimmed}`);
    }
  }

  return {
    originalQuery: config.queryText,
    dork: parts.join(' '),
    targetEngines: config.targetEngines.length > 0
      ? config.targetEngines
      : ['google', 'bing', 'duckduckgo']
  };
}
