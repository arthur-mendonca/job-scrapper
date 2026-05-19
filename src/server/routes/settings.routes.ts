import type { FastifyInstance } from 'fastify';
import { env } from '../../config/env.js';

export async function registerSettingsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/settings', async () => ({
    notificationScoreThreshold: env.NOTIFICATION_SCORE_THRESHOLD,
    collectCron: env.COLLECT_CRON,
    searxngBaseUrl: env.SEARXNG_BASE_URL,
    apiCorsOrigin: env.API_CORS_ORIGIN
  }));
}
