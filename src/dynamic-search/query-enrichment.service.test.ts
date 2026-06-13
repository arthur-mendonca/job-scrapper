import { describe, expect, it } from 'vitest';
import type { DynamicSearchConfig } from '@prisma/client';
import { enrichQuery } from './query-enrichment.service.js';

function buildConfig(overrides: Partial<DynamicSearchConfig> = {}): DynamicSearchConfig {
  return {
    id: 'cfg-1',
    label: 'Test Config',
    queryText: 'node react remote latam',
    normalizedQueryText: 'node react remote latam',
    targetEngines: ['google', 'bing', 'duckduckgo'],
    intervalMinutes: 360,
    isActive: true,
    targetSites: [],
    excludedTerms: [],
    requiredTerms: [],
    locale: 'en-US',
    maxResults: 30,
    lastRunAt: null,
    nextRunAt: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    failureCount: 0,
    lastError: null,
    lastGeneratedDork: null,
    cronExpression: null,
    lastItemsCount: null,
    lastAcceptedCount: null,
    lastRejectedCount: null,
    lastNewCount: null,
    lastRediscoveredCount: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

describe('enrichQuery', () => {
  it('preserves original role and stack terms in the dork', () => {
    const config = buildConfig({ queryText: 'node react remote latam' });
    const result = enrichQuery(config);

    expect(result.originalQuery).toBe('node react remote latam');
    expect(result.dork).toContain('node react remote latam');
  });

  it('adds remote-work terms when none present in query', () => {
    const config = buildConfig({ queryText: 'typescript backend engineer' });
    const result = enrichQuery(config);

    expect(result.dork).toContain('(remote OR LATAM OR Americas OR worldwide)');
  });

  it('does not add remote terms when already present', () => {
    const config = buildConfig({ queryText: 'typescript remote engineer' });
    const result = enrichQuery(config);

    expect(result.dork).not.toContain('(remote OR LATAM OR Americas OR worldwide)');
  });

  it('adds site: operators from targetSites', () => {
    const config = buildConfig({
      queryText: 'react developer',
      targetSites: ['greenhouse.io', 'lever.co', 'jobs.lever.co']
    });
    const result = enrichQuery(config);

    expect(result.dork).toContain('site:greenhouse.io');
    expect(result.dork).toContain('site:lever.co');
    expect(result.dork).toContain('site:jobs.lever.co');
  });

  it('adds default excluded terms as negative filters', () => {
    const config = buildConfig({ queryText: 'node developer' });
    const result = enrichQuery(config);

    expect(result.dork).toContain('-internship');
    expect(result.dork).toContain('-course');
    expect(result.dork).toContain('-bootcamp');
    expect(result.dork).toContain('-resume');
    expect(result.dork).toContain('-template');
    expect(result.dork).toContain('-onsite');
    expect(result.dork).toContain('-hybrid');
  });

  it('uses custom excluded terms instead of defaults', () => {
    const config = buildConfig({
      queryText: 'node developer',
      excludedTerms: ['senior', 'lead']
    });
    const result = enrichQuery(config);

    expect(result.dork).toContain('-senior');
    expect(result.dork).toContain('-lead');
    expect(result.dork).not.toContain('-internship');
  });

  it('adds required terms that are not already in the query', () => {
    const config = buildConfig({
      queryText: 'backend engineer',
      requiredTerms: ['TypeScript', 'Node.js']
    });
    const result = enrichQuery(config);

    expect(result.dork).toContain('"TypeScript"');
    expect(result.dork).toContain('"Node.js"');
  });

  it('does not duplicate required terms that appear in query', () => {
    const config = buildConfig({
      queryText: 'typescript backend engineer',
      requiredTerms: ['TypeScript']
    });
    const result = enrichQuery(config);

    // "TypeScript" should not appear as a quoted required term since it's already in the query
    expect(result.dork).not.toContain('"TypeScript"');
  });

  it('adds title/URL hints', () => {
    const config = buildConfig({ queryText: 'react developer' });
    const result = enrichQuery(config);

    expect(result.dork).toContain('intitle:jobs');
    expect(result.dork).toContain('intitle:careers');
  });

  it('returns target engines from config', () => {
    const config = buildConfig({ targetEngines: ['google', 'duckduckgo'] });
    const result = enrichQuery(config);

    expect(result.targetEngines).toEqual(['google', 'duckduckgo']);
  });

  it('returns default engines when config has empty array', () => {
    const config = buildConfig({ targetEngines: [] });
    const result = enrichQuery(config);

    expect(result.targetEngines).toEqual(['google', 'bing', 'duckduckgo']);
  });

  it('generated dork is inspectable for auditability', () => {
    const config = buildConfig({
      queryText: 'node react developer',
      targetSites: ['greenhouse.io'],
      excludedTerms: ['internship'],
      requiredTerms: ['LATAM']
    });
    const result = enrichQuery(config);

    // The dork is a string that can be logged and inspected
    expect(typeof result.dork).toBe('string');
    expect(result.dork.length).toBeGreaterThan(0);
    expect(result.originalQuery).toBe('node react developer');
  });
});
