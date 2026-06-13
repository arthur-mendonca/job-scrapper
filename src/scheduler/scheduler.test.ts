import { describe, expect, it, vi } from 'vitest';

vi.mock('../config/env.js', () => ({
  env: {
    COLLECT_CRON: '0 */6 * * 1-5'
  }
}));

vi.mock('../logger/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

import { Scheduler } from './scheduler.js';
describe('Scheduler graceful shutdown', () => {
  it('awaits an in-flight cycle within the timeout', async () => {
    vi.useFakeTimers();
    try {
      const run = vi.fn().mockImplementation(() => new Promise<void>((resolve) => setTimeout(resolve, 500)));
      const scheduler = new Scheduler({ run } as any);

      const cyclePromise = scheduler.runOnce();
      const shutdownResultPromise = scheduler.awaitInFlight(1000);

      await vi.advanceTimersByTimeAsync(500);

      await expect(shutdownResultPromise).resolves.toBe('completed');
      await cyclePromise;
      expect(run).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('returns timeout when the in-flight cycle does not finish in time', async () => {
    vi.useFakeTimers();
    try {
      const run = vi.fn().mockImplementation(() => new Promise<void>((resolve) => setTimeout(resolve, 5000)));
      const scheduler = new Scheduler({ run } as any);

      const cyclePromise = scheduler.runOnce();
      const shutdownResultPromise = scheduler.awaitInFlight(1000);

      await vi.advanceTimersByTimeAsync(1000);
      await expect(shutdownResultPromise).resolves.toBe('timeout');

      await vi.advanceTimersByTimeAsync(4000);
      await cyclePromise;
    } finally {
      vi.useRealTimers();
    }
  });
});

