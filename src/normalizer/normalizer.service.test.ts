import { describe, expect, it } from 'vitest';
import type { RawJobItem } from '../collectors/collector.types.js';
import { detectRemoteType, detectSeniority, detectStackTags, normalizeJob } from './normalizer.service.js';

describe('normalizer detection', () => {
  it('detects target stack tags', () => {
    expect(detectStackTags('TypeScript Node.js NestJS React AWS Docker CI/CD PostgreSQL REST APIs LLM automation')).toEqual(
      ['TypeScript', 'Node.js', 'NestJS', 'React', 'AWS', 'Docker', 'CI/CD', 'PostgreSQL', 'REST APIs', 'LLM', 'automation']
    );
  });

  it('detects remote type and seniority', () => {
    expect(detectRemoteType('Remote LATAM')).toBe('remote');
    expect(detectRemoteType('Hybrid Sao Paulo')).toBe('hybrid');
    expect(detectSeniority('Intermediate Full Stack Engineer')).toBe('Mid-level');
  });

  it('normalizes a raw item with source trust', () => {
    const normalized = normalizeJob({
      source: 'Email Alerts',
      sourceId: 'email-alerts',
      sourceUrl: 'https://example.com/job?utm_source=email',
      sourceTrustScore: 50,
      sourceAccessMode: 'email',
      title: 'Node.js Backend Engineer',
      companyName: 'ExampleCo',
      location: 'Remote LATAM',
      description: 'Build TypeScript Node.js APIs with PostgreSQL.'
    } satisfies RawJobItem);

    expect(normalized?.sourceTrustScore).toBe(50);
    expect(normalized?.collector).toBe('Email Alerts');
    expect(normalized?.discoveredVia).toBe('Email Alerts');
    expect(normalized?.canonicalUrl).toBe('https://example.com/job');
    expect(normalized?.stackTags).toContain('Node.js');
  });
});
