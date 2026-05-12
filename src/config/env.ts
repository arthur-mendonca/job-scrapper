import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  TELEGRAM_BOT_TOKEN: z.string().default(''),
  TELEGRAM_CHAT_ID: z.string().default(''),
  NOTIFICATION_SCORE_THRESHOLD: z.coerce.number().int().min(0).max(100).default(75),
  COLLECT_CRON: z.string().min(1).default('0 */6 * * 1-5'),
  SEARXNG_BASE_URL: z.string().url().default('http://searxng:8080'),
  EMAIL_NOTIFICATIONS_ENABLED: z
    .string()
    .default('false')
    .transform((value) => value.toLowerCase() === 'true'),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.coerce.number().int().positive().optional()
  ),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default(''),
  EMAIL_TO: z.string().default(''),
  LOG_LEVEL: z.string().default('info'),
  INPUT_EMAIL_ALERTS_DIR: z.string().min(1).default('/app/input/email-alerts'),
  SOURCES_CONFIG_PATH: z.string().min(1).default('config/sources.example.json')
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
