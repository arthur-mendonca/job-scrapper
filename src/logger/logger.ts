import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: undefined,
  redact: {
    paths: [
      'TELEGRAM_BOT_TOKEN',
      'SMTP_PASS',
      'SMTP_USER',
      'telegramBotToken',
      'smtpPass',
      '*.password',
      '*.token'
    ],
    censor: '[redacted]'
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

export type Logger = typeof logger;
