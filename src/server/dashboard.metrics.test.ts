import { describe, expect, it } from 'vitest';
import { buildDashboardSourceStats, roundMetric } from './dashboard.metrics.js';

describe('dashboard metrics helpers', () => {
  it('sorts source stats by job count and serializes dates', () => {
    const stats = buildDashboardSourceStats([
      {
        sourceId: 'remote-ok',
        source: 'Remote OK',
        count: 3,
        averageScore: 72.126,
        lastSeenAt: new Date('2026-05-18T10:00:00.000Z'),
        sourceTrustScore: 85
      },
      {
        sourceId: 'himalayas',
        source: 'Himalayas',
        count: 9,
        averageScore: 80.555,
        lastSeenAt: new Date('2026-05-19T10:00:00.000Z'),
        sourceTrustScore: 95
      }
    ]);

    expect(stats).toEqual([
      {
        sourceId: 'himalayas',
        source: 'Himalayas',
        count: 9,
        averageScore: 80.56,
        lastSeenAt: '2026-05-19T10:00:00.000Z',
        sourceTrustScore: 95
      },
      {
        sourceId: 'remote-ok',
        source: 'Remote OK',
        count: 3,
        averageScore: 72.13,
        lastSeenAt: '2026-05-18T10:00:00.000Z',
        sourceTrustScore: 85
      }
    ]);
  });

  it('normalizes missing numeric metrics to zero', () => {
    expect(roundMetric(null)).toBe(0);
  });
});
