import { describe, expect, it } from 'vitest';
import type { NormalizedJob } from '../normalizer/normalizer.types.js';
import { filterJobForTargetProfile } from './profile-filter.js';

describe('filterJobForTargetProfile', () => {
  it.each([
    'Marketing Manager',
    'Content & AI Enablement',
    'Office Assistant',
    'iOS Developer',
    'Copywriter'
  ])('rejects irrelevant role: %s', (title) => {
    expect(filterJobForTargetProfile(buildJob({ title, normalizedTitle: title.toLowerCase() })).accepted).toBe(false);
  });

  it.each([
    'Mid-level Full Stack Engineer',
    'Node.js Developer',
    'Backend-leaning Full Stack Engineer',
    'AI Automation Engineer',
    'TypeScript Backend Engineer'
  ])('accepts target role: %s', (title) => {
    expect(filterJobForTargetProfile(buildJob({ title, normalizedTitle: title.toLowerCase() })).accepted).toBe(true);
  });

  it('rejects US-only roles before scoring', () => {
    const result = filterJobForTargetProfile(
      buildJob({
        title: 'Node.js Backend Engineer',
        description: 'Remote role, but only candidates in the U.S. are eligible.'
      })
    );

    expect(result).toEqual({ accepted: false, reason: 'us-only role' });
  });

  it('rejects 7+ years roles before persistence', () => {
    const result = filterJobForTargetProfile(
      buildJob({
        title: 'Full Stack Engineer',
        requirements: '7+ years of production engineering experience.'
      })
    );

    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('7-plus-years-required');
  });
});

function buildJob(overrides: Partial<NormalizedJob> = {}): NormalizedJob {
  return {
    source: 'Example',
    sourceId: 'example',
    collector: 'Example',
    discoveredVia: 'Example',
    sourceUrl: 'https://example.com/job',
    canonicalUrl: 'https://example.com/job',
    sourceTrustScore: 80,
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
    description: 'Build TypeScript Node.js services with React, PostgreSQL, Docker and AWS.',
    requirements: null,
    stackTags: ['TypeScript', 'Node.js', 'React', 'PostgreSQL', 'Docker', 'AWS'],
    postedAt: null,
    contentHash: 'hash',
    ...overrides
  };
}
