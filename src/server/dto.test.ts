import type { Job, JobEvent } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import type { JobWithEvents } from '../persistence/job.repository.js';
import { toJobDetailDto, toJobListItemDto } from './dto.js';

const now = new Date('2026-05-19T12:00:00.000Z');

describe('API DTOs', () => {
  it('serializes job list items with ISO dates and JSON arrays', () => {
    const dto = toJobListItemDto(buildJob());

    expect(dto.discoveredAt).toBe('2026-05-19T12:00:00.000Z');
    expect(dto.lastSeenAt).toBe('2026-05-19T12:00:00.000Z');
    expect(dto.notifiedAt).toBeNull();
    expect(dto.matchReasons).toEqual(['TypeScript', 'Node.js']);
    expect(dto.riskFlags).toEqual(['closed-flow']);
  });

  it('serializes job details with chronological events', () => {
    const event = buildEvent();
    const dto = toJobDetailDto({ ...buildJob(), events: [event] } as JobWithEvents);

    expect(dto.description).toBe('Build APIs.');
    expect(dto.events).toEqual([
      {
        id: 'event_1',
        jobId: 'job_1',
        eventType: 'discovered',
        metadata: { source: 'Himalayas' },
        createdAt: '2026-05-19T12:00:00.000Z'
      }
    ]);
  });
});

function buildJob(): Job {
  return {
    id: 'job_1',
    source: 'Himalayas',
    sourceId: 'himalayas',
    collector: 'himalayas',
    discoveredVia: 'himalayas',
    sourceUrl: 'https://himalayas.app/jobs/1',
    canonicalUrl: 'https://himalayas.app/jobs/1',
    title: 'Backend Engineer',
    normalizedTitle: 'backend engineer',
    companyName: 'ExampleCo',
    location: 'Remote LATAM',
    remoteType: 'remote',
    salaryMin: 5000,
    salaryMax: 7000,
    currency: 'USD',
    seniority: 'Senior',
    description: 'Build APIs.',
    requirements: 'TypeScript and Node.js.',
    stackTags: ['TypeScript', 'Node.js'],
    postedAt: null,
    discoveredAt: now,
    lastSeenAt: now,
    score: 88,
    sourceTrustScore: 95,
    status: 'new',
    contentHash: 'hash',
    notifiedAt: null,
    matchReasons: ['TypeScript', 'Node.js'],
    riskFlags: ['closed-flow'],
    recommendedAction: 'Apply.',
    createdAt: now,
    updatedAt: now
  };
}

function buildEvent(): JobEvent {
  return {
    id: 'event_1',
    jobId: 'job_1',
    eventType: 'discovered',
    metadata: { source: 'Himalayas' },
    createdAt: now
  };
}
