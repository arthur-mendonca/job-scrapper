import { describe, expect, it } from 'vitest';
import { parseListJobsQuery, parseUpdateJobStatusBody } from './jobs.routes.js';

describe('jobs route validation', () => {
  it('applies default pagination and sorting', () => {
    expect(parseListJobsQuery({})).toEqual({
      page: 1,
      pageSize: 25,
      sort: 'lastSeen_desc'
    });
  });

  it('parses URL query strings into typed filters', () => {
    expect(
      parseListJobsQuery({
        page: '2',
        pageSize: '50',
        status: 'saved',
        source: 'himalayas',
        stack: 'Node.js',
        minScore: '70',
        remoteType: 'remote',
        seniority: 'Senior',
        q: 'backend',
        sort: 'score_desc'
      })
    ).toEqual({
      page: 2,
      pageSize: 50,
      status: 'saved',
      source: 'himalayas',
      stack: 'Node.js',
      minScore: 70,
      remoteType: 'remote',
      seniority: 'Senior',
      q: 'backend',
      sort: 'score_desc'
    });
  });

  it('rejects oversized pages', () => {
    expect(() => parseListJobsQuery({ pageSize: '500' })).toThrow();
  });

  it('allows only writable workflow statuses', () => {
    expect(parseUpdateJobStatusBody({ status: 'applied' })).toEqual({ status: 'applied' });
    expect(() => parseUpdateJobStatusBody({ status: 'notified' })).toThrow();
  });
});
