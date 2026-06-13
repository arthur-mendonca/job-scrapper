import { describe, expect, it } from 'vitest';
import type { NormalizedJob } from '../normalizer/normalizer.types.js';
import { findDuplicateInMemory } from './deduplication.service.js';

describe('findDuplicateInMemory', () => {
  it('matches canonical URL before weaker signals', () => {
    const existing = buildJob({ canonicalUrl: 'https://example.com/jobs/1' });
    const candidate = buildJob({
      canonicalUrl: 'https://example.com/jobs/1',
      normalizedTitle: 'different',
      contentHash: 'different'
    });

    expect(findDuplicateInMemory(candidate, [existing]).type).toBe('canonical-url');
  });

  it('matches title and company when URL differs', () => {
    const existing = buildJob({ canonicalUrl: 'https://trusted.example/jobs/1' });
    const candidate = buildJob({ canonicalUrl: 'https://search.example/result' });

    expect(findDuplicateInMemory(candidate, [existing]).type).toBe('title-company');
  });

  it('matches content hash as final fallback', () => {
    const existing = buildJob({
      canonicalUrl: 'https://trusted.example/jobs/1',
      normalizedTitle: 'backend engineer',
      contentHash: 'same-hash'
    });
    const candidate = buildJob({
      canonicalUrl: 'https://search.example/result',
      normalizedTitle: 'node engineer',
      contentHash: 'same-hash'
    });

    expect(findDuplicateInMemory(candidate, [existing]).type).toBe('content-hash');
  });
});

describe('findDuplicateInMemory — dynamic search provenance', () => {
  it('treats same URL from two dynamic configs as one job', () => {
    const fromConfig1 = buildJob({
      canonicalUrl: 'https://greenhouse.io/jobs/123',
      discoveredVia: 'dynamic-searxng',
      source: 'Greenhouse via dynamic-searxng'
    });
    const fromConfig2 = buildJob({
      canonicalUrl: 'https://greenhouse.io/jobs/123',
      discoveredVia: 'dynamic-searxng',
      source: 'Greenhouse via dynamic-searxng'
    });

    const match = findDuplicateInMemory(fromConfig2, [fromConfig1]);
    expect(match.type).toBe('canonical-url');
    expect(match.job).toBe(fromConfig1);
  });

  it('treats same title+company from dynamic and traditional collector as one job', () => {
    const fromTraditional = buildJob({
      canonicalUrl: 'https://remotive.com/jobs/full-stack-engineer-exampleco',
      discoveredVia: 'Remotive',
      source: 'Remotive'
    });
    const fromDynamic = buildJob({
      canonicalUrl: 'https://greenhouse.io/exampleco/fullstack',
      discoveredVia: 'dynamic-searxng',
      source: 'dynamic-searxng'
    });

    const match = findDuplicateInMemory(fromDynamic, [fromTraditional]);
    expect(match.type).toBe('title-company');
    expect(match.job).toBe(fromTraditional);
  });

  it('ignores dynamic config metadata when matching', () => {
    // Two jobs from different dynamic configs with different raw metadata
    // but same canonical URL — should still be treated as duplicates
    const existing = buildJob({
      canonicalUrl: 'https://example.com/jobs/456',
      discoveredVia: 'dynamic-searxng',
      source: 'dynamic-searxng'
    });
    const candidate = buildJob({
      canonicalUrl: 'https://example.com/jobs/456',
      discoveredVia: 'dynamic-searxng',
      source: 'dynamic-searxng',
      // Different title, different hash — URL still matches
      normalizedTitle: 'slightly different title',
      contentHash: 'different-hash'
    });

    const match = findDuplicateInMemory(candidate, [existing]);
    expect(match.type).toBe('canonical-url');
  });

  it('does not create duplicate when predefined SearXNG and dynamic SearXNG find same URL', () => {
    const fromPredefined = buildJob({
      canonicalUrl: 'https://lever.co/jobs/789',
      discoveredVia: 'SearXNG',
      source: 'Lever via SearXNG'
    });
    const fromDynamic = buildJob({
      canonicalUrl: 'https://lever.co/jobs/789',
      discoveredVia: 'dynamic-searxng',
      source: 'Lever via dynamic-searxng'
    });

    const match = findDuplicateInMemory(fromDynamic, [fromPredefined]);
    expect(match.type).toBe('canonical-url');
    expect(match.job).toBe(fromPredefined);
  });

  it('returns none when dynamic search job is truly new', () => {
    const existing = buildJob({
      canonicalUrl: 'https://example.com/jobs/1',
      normalizedTitle: 'backend engineer',
      companyName: 'OtherCo'
    });
    const newDynamic = buildJob({
      canonicalUrl: 'https://different.example/jobs/999',
      normalizedTitle: 'frontend developer',
      companyName: 'NewCo',
      discoveredVia: 'dynamic-searxng',
      contentHash: 'unique-hash'
    });

    const match = findDuplicateInMemory(newDynamic, [existing]);
    expect(match.type).toBe('none');
  });
});

function buildJob(overrides: Partial<NormalizedJob> = {}): NormalizedJob {
  return {
    source: 'Remotive',
    sourceId: 'remotive',
    collector: 'Remotive',
    discoveredVia: 'Remotive',
    sourceUrl: 'https://example.com/jobs/1',
    canonicalUrl: 'https://example.com/jobs/1',
    sourceTrustScore: 95,
    sourceAccessMode: 'api',
    title: 'Full Stack Engineer',
    normalizedTitle: 'full stack engineer',
    companyName: 'ExampleCo',
    location: 'Remote LATAM',
    remoteType: 'remote',
    geoRestrictions: [],
    salaryMin: null,
    salaryMax: null,
    currency: null,
    seniority: 'Mid-level',
    description: 'TypeScript Node.js React',
    requirements: null,
    stackTags: ['TypeScript', 'Node.js', 'React'],
    postedAt: null,
    contentHash: 'hash',
    ...overrides
  };
}
