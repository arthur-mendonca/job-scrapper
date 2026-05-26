import { describe, expect, it } from 'vitest';
import type { NormalizedJob } from '../normalizer/normalizer.types.js';
import { scoreJob } from './scoring.service.js';
import { sourceTrustAdjustment } from './scoring.rules.js';

describe('source trust adjustment', () => {
  it.each([
    [95, 5],
    [80, 2],
    [60, 0],
    [40, -8],
    [20, -20]
  ])('maps %i to %i', (trust, adjustment) => {
    expect(sourceTrustAdjustment(trust)).toBe(adjustment);
  });
});

describe('scoreJob', () => {
  it('keeps technical score and source trust adjustment separate', () => {
    const job = buildJob({ sourceTrustScore: 95 });
    const score = scoreJob(job);

    expect(score.technicalScore).toBeLessThanOrEqual(100);
    expect(score.sourceTrustAdjustment).toBe(5);
    expect(score.score).toBeGreaterThanOrEqual(score.technicalScore);
    expect(score.matchReasons).toContain('TypeScript');
  });

  it('flags low trust indirect sources', () => {
    const score = scoreJob(buildJob({ sourceTrustScore: 40, sourceAccessMode: 'search' }));

    expect(score.sourceTrustAdjustment).toBe(-8);
    expect(score.riskFlags).toContain('low-trust-source');
    expect(score.riskFlags).toContain('indirect-source');
  });

  it('prefers structured restriction flags when available', () => {
    const score = scoreJob(buildJob({ geoRestrictions: ['us-only'] }));
    expect(score.riskFlags).toContain('us-only');
  });

  it('falls back to text detection when structured restrictions are absent', () => {
    const score = scoreJob(
      buildJob({
        geoRestrictions: [],
        description: 'Remote role, but US only candidates.'
      })
    );
    expect(score.riskFlags).toContain('us-only');
  });
});

function buildJob(overrides: Partial<NormalizedJob> = {}): NormalizedJob {
  return {
    source: 'Remotive',
    sourceId: 'remotive',
    collector: 'Remotive',
    discoveredVia: 'Remotive',
    sourceUrl: 'https://example.com/job',
    canonicalUrl: 'https://example.com/job',
    sourceTrustScore: 95,
    sourceAccessMode: 'api',
    title: 'Full Stack Engineer TypeScript Node.js',
    normalizedTitle: 'full stack engineer typescript node.js',
    companyName: 'ExampleCo',
    location: 'Remote LATAM',
    remoteType: 'remote',
    geoRestrictions: [],
    salaryMin: 5000,
    salaryMax: 7000,
    currency: 'USD',
    seniority: 'Mid-level',
    description: 'Build backend-leaning full stack products using TypeScript, Node.js, React, AWS, Docker, CI/CD, PostgreSQL, REST APIs and AI automation.',
    requirements: '3+ years of practical product engineering experience.',
    stackTags: ['TypeScript', 'Node.js', 'React', 'AWS', 'Docker', 'CI/CD', 'PostgreSQL', 'REST APIs', 'AI', 'automation'],
    postedAt: null,
    contentHash: 'abc',
    ...overrides
  };
}
