import { beforeEach, describe, expect, it, vi } from 'vitest';

async function build() {
  vi.resetModules();
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'test';
  const { buildServer } = await import('./server.js');
  return buildServer();
}

describe('internal API auth', () => {
  beforeEach(() => {
    delete process.env.API_REQUIRE_INTERNAL_AUTH;
    delete process.env.API_INTERNAL_SECRET;
  });

  it('allows requests when disabled', async () => {
    const app = await build();
    const res = await app.inject({ method: 'GET', url: '/api/does-not-exist' });
    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('rejects /api/* without secret header when enabled', async () => {
    process.env.API_REQUIRE_INTERNAL_AUTH = 'true';
    process.env.API_INTERNAL_SECRET = 'test-secret';
    const app = await build();
    const res = await app.inject({ method: 'GET', url: '/api/does-not-exist' });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ error: { code: 'FORBIDDEN', message: 'Forbidden.' } });
    await app.close();
  });

  it('rejects /api/* with wrong secret header when enabled', async () => {
    process.env.API_REQUIRE_INTERNAL_AUTH = 'true';
    process.env.API_INTERNAL_SECRET = 'test-secret';
    const app = await build();
    const res = await app.inject({
      method: 'GET',
      url: '/api/does-not-exist',
      headers: { 'x-internal-api-secret': 'wrong' }
    });
    expect(res.statusCode).toBe(403);
    await app.close();
  });

  it('allows /api/* with correct secret header when enabled', async () => {
    process.env.API_REQUIRE_INTERNAL_AUTH = 'true';
    process.env.API_INTERNAL_SECRET = 'test-secret';
    const app = await build();
    const res = await app.inject({
      method: 'GET',
      url: '/api/does-not-exist',
      headers: { 'x-internal-api-secret': 'test-secret' }
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it('protects /health when enabled', async () => {
    process.env.API_REQUIRE_INTERNAL_AUTH = 'true';
    process.env.API_INTERNAL_SECRET = 'test-secret';
    const app = await build();
    const resNoHeader = await app.inject({ method: 'GET', url: '/health' });
    expect(resNoHeader.statusCode).toBe(403);

    const resWithHeader = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { 'x-internal-api-secret': 'test-secret' }
    });
    expect([200, 503]).toContain(resWithHeader.statusCode);
    await app.close();
  });
});
