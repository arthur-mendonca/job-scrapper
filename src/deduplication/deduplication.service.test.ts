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
