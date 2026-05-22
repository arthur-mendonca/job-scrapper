import fs from "node:fs";
import path from "node:path";
import pino from "pino";
import { env } from "../config/env.js";

const streams: Array<{ stream: pino.DestinationStream }> = [
  { stream: pino.destination(1) },
];

const logDir = env.LOG_DIR.trim();
if (logDir) {
  fs.mkdirSync(logDir, { recursive: true });
  streams.push({
    stream: pino.destination({
      dest: path.join(logDir, "app.log"),
      mkdir: true,
      sync: false,
    }),
  });
}

const loggerOptions: pino.LoggerOptions = {
  level: env.LOG_LEVEL,
  base: undefined,
  redact: {
    paths: [
      "API_INTERNAL_SECRET",
      "TELEGRAM_BOT_TOKEN",
      "SMTP_PASS",
      "SMTP_USER",
      "req.headers",
      "telegramBotToken",
      "smtpPass",
      "*.password",
      "*.token",
    ],
    censor: "[redacted]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

export const logStream = pino.multistream(streams);

export const logger = pino(loggerOptions, logStream);

export const fastifyLoggerOptions = {
  ...loggerOptions,
  stream: logStream,
};

export type Logger = typeof logger;
