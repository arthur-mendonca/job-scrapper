import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from '../../config/env.js';
import { settingsResponseSchema } from '../api-schemas.js';

export async function registerSettingsRoutes(app: FastifyInstance): Promise<void> {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    '/settings',
    {
      schema: {
        operationId: 'getSettings',
        tags: ['Settings'],
        summary: 'Get runtime settings',
        description: 'Returns current runtime configuration settings.',
        response: {
          200: settingsResponseSchema,
        },
      },
    },
    async () => ({
      notificationScoreThreshold: env.NOTIFICATION_SCORE_THRESHOLD,
      collectCron: env.COLLECT_CRON,
      searxngBaseUrl: env.SEARXNG_BASE_URL,
      apiCorsOrigin: env.API_CORS_ORIGIN
    })
  );
}
