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

  it('accepts original user-controlled statuses', () => {
    expect(parseUpdateJobStatusBody({ status: 'new' })).toEqual({ status: 'new' });
    expect(parseUpdateJobStatusBody({ status: 'saved' })).toEqual({ status: 'saved' });
    expect(parseUpdateJobStatusBody({ status: 'discarded' })).toEqual({ status: 'discarded' });
    expect(parseUpdateJobStatusBody({ status: 'applied' })).toEqual({ status: 'applied' });
  });

  it('accepts expanded user-controlled statuses', () => {
    expect(parseUpdateJobStatusBody({ status: 'ignored' })).toEqual({ status: 'ignored' });
    expect(parseUpdateJobStatusBody({ status: 'interviewing' })).toEqual({ status: 'interviewing' });
    expect(parseUpdateJobStatusBody({ status: 'offer' })).toEqual({ status: 'offer' });
    expect(parseUpdateJobStatusBody({ status: 'ghosted' })).toEqual({ status: 'ghosted' });
  });

  it('rejects system-controlled statuses', () => {
    expect(() => parseUpdateJobStatusBody({ status: 'notified' })).toThrow();
    expect(() => parseUpdateJobStatusBody({ status: 'rejected' })).toThrow();
  });

  it('rejects unknown statuses', () => {
    expect(() => parseUpdateJobStatusBody({ status: 'xyz' })).toThrow();
    expect(() => parseUpdateJobStatusBody({ status: '' })).toThrow();
  });
});

