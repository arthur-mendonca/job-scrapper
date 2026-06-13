import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DynamicSearchConfig } from '@prisma/client';
import type { DynamicSearchRepository } from '../persistence/dynamic-search.repository.js';

// Mock external dependencies BEFORE imports
vi.mock('../config/env.js', () => ({
  env: {
    DYNAMIC_SEARCH_ENABLED: true,
    DYNAMIC_SEARCH_MIN_INTERVAL_MINUTES: 60,
    DYNAMIC_SEARCH_MAX_PER_CYCLE: 5,
    DYNAMIC_SEARCH_MAX_CONCURRENT: 2,
    DYNAMIC_SEARCH_JITTER_MAX_MS: 100, // Small jitter for fast tests
    DYNAMIC_SEARCH_RATE_LIMIT_MS: 10,
    SEARXNG_BASE_URL: 'http://localhost:8080',
    DYNAMIC_SEARCH_GLOBAL_RATE_LIMIT_WINDOW_MS: 3600000,
    DYNAMIC_SEARCH_GLOBAL_RATE_LIMIT_MAX: 100
  }
}));

const mockCollect = vi.fn().mockResolvedValue([]);

vi.mock('../collectors/dynamic-searxng.collector.js', () => ({
  DynamicSearxngCollector: vi.fn().mockImplementation(() => ({
    collect: mockCollect,
    name: 'dynamic-searxng:test'
  }))
}));

vi.mock('../dynamic-search/query-enrichment.service.js', () => ({
  enrichQuery: vi.fn().mockReturnValue({
    originalQuery: 'test query',
    dork: 'test dork',
    targetEngines: ['google']
  })
}));

vi.mock('../logger/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

vi.mock('../utils/sleep.js', () => ({
  sleep: vi.fn().mockResolvedValue(undefined)
}));

import { DynamicSearchScheduler } from './dynamic-search.scheduler.js';
import { env } from '../config/env.js';

function buildConfig(overrides: Partial<DynamicSearchConfig> = {}): DynamicSearchConfig {
  return {
    id: 'cfg-1',
    label: 'Test Config',
    queryText: 'node react remote latam',
    normalizedQueryText: 'node react remote latam',
    targetEngines: ['google', 'bing'],
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

function buildMockRepository() {
  return {
    findDueConfigs: vi.fn().mockResolvedValue([]),
    markRunStart: vi.fn().mockResolvedValue(undefined),
    markRunSuccess: vi.fn().mockResolvedValue(undefined),
    markRunFailure: vi.fn().mockResolvedValue(undefined),
    create: vi.fn(),
    update: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
    findById: vi.fn(),
    listAll: vi.fn()
  } as unknown as DynamicSearchRepository & {
    findDueConfigs: ReturnType<typeof vi.fn>;
    markRunStart: ReturnType<typeof vi.fn>;
    markRunSuccess: ReturnType<typeof vi.fn>;
    markRunFailure: ReturnType<typeof vi.fn>;
  };
}

describe('DynamicSearchScheduler', () => {
  let processRawItems: ReturnType<typeof vi.fn>;
  let mockRepository: ReturnType<typeof buildMockRepository>;
  let scheduler: DynamicSearchScheduler;

  beforeEach(() => {
    processRawItems = vi.fn().mockResolvedValue({
      normalizedJobs: 2,
      acceptedJobs: 1,
      rejectedJobs: 1,
      newJobs: 1,
      rediscoveredJobs: 0,
      highScoringJobs: 0,
      notificationsSent: 0,
      highScoringPersistedJobs: [],
      sourceMetrics: new Map()
    });
    mockRepository = buildMockRepository();
    mockCollect.mockResolvedValue([{ title: 'job1', url: 'http://a' }, { title: 'job2', url: 'http://b' }]);
    scheduler = new DynamicSearchScheduler({
      allSources: [],
      processRawItems,
      repository: mockRepository
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('skips execution when no configs are due', async () => {
    mockRepository.findDueConfigs.mockResolvedValue([]);

    await scheduler.runDueConfigs();

    expect(mockRepository.findDueConfigs).toHaveBeenCalledTimes(1);
    expect(mockRepository.markRunStart).not.toHaveBeenCalled();
  });

  it('executes due configs', async () => {
    const config = buildConfig();
    mockRepository.findDueConfigs.mockResolvedValue([config]);

    await scheduler.runDueConfigs();

    expect(mockRepository.markRunStart).toHaveBeenCalledWith(config.id, expect.any(String));
    expect(mockRepository.markRunSuccess).toHaveBeenCalledWith(config.id, config.intervalMinutes, config.cronExpression, {
      lastItemsCount: 2,
      lastAcceptedCount: 1,
      lastRejectedCount: 1,
      lastNewCount: 1,
      lastRediscoveredCount: 0
    });
  });

  it('rejects configs with invalid cron expressions', async () => {
    const config = buildConfig({ cronExpression: 'invalid-cron' });
    mockRepository.findDueConfigs.mockResolvedValue([config]);

    await scheduler.runDueConfigs();

    expect(mockRepository.markRunStart).not.toHaveBeenCalled();
  });

  it('rejects configs with interval below minimum', async () => {
    const config = buildConfig({ intervalMinutes: 15 }); // below 60min minimum
    mockRepository.findDueConfigs.mockResolvedValue([config]);

    await scheduler.runDueConfigs();

    expect(mockRepository.markRunStart).not.toHaveBeenCalled();
  });

  it('enforces per-cycle cap via repository limit', async () => {
    mockRepository.findDueConfigs.mockResolvedValue([]);

    await scheduler.runDueConfigs();

    // findDueConfigs is called with the cycle limit
    expect(mockRepository.findDueConfigs).toHaveBeenCalledWith(expect.any(Date), 5);
  });

  it('processes multiple configs sequentially within a cycle', async () => {
    const configs = Array.from({ length: 3 }, (_, i) =>
      buildConfig({ id: `cfg-${i}`, intervalMinutes: 360 })
    );
    mockRepository.findDueConfigs.mockResolvedValue(configs);

    await scheduler.runDueConfigs();

    // All 3 configs should have been processed sequentially
    expect(mockRepository.markRunStart).toHaveBeenCalledTimes(3);
    expect(mockRepository.markRunSuccess).toHaveBeenCalledTimes(3);
  });

  it('enforces global per-window rate limit', async () => {
    const originalMax = env.DYNAMIC_SEARCH_GLOBAL_RATE_LIMIT_MAX;
    env.DYNAMIC_SEARCH_GLOBAL_RATE_LIMIT_MAX = 2; // only 2 allowed globally

    // We need a fresh scheduler to reset the internal requestTimestamps array
    scheduler = new DynamicSearchScheduler({
      allSources: [],
      processRawItems,
      repository: mockRepository
    });

    const configs = Array.from({ length: 4 }, (_, i) =>
      buildConfig({ id: `cfg-${i}`, intervalMinutes: 360 })
    );
    mockRepository.findDueConfigs.mockResolvedValue(configs);

    await scheduler.runDueConfigs();

    // Only 2 should execute
    expect(mockRepository.markRunStart).toHaveBeenCalledTimes(2);

    env.DYNAMIC_SEARCH_GLOBAL_RATE_LIMIT_MAX = originalMax; // revert
  });

  it('records failure and applies backoff on error', async () => {
    const config = buildConfig({ failureCount: 2 });
    mockRepository.findDueConfigs.mockResolvedValue([config]);

    mockCollect.mockRejectedValueOnce(new Error('HTTP 429 Too Many Requests'));

    await scheduler.runDueConfigs();

    expect(mockRepository.markRunFailure).toHaveBeenCalledWith(
      config.id,
      'HTTP 429 Too Many Requests',
      config.intervalMinutes,
      config.failureCount,
      config.cronExpression
    );
  });
});
