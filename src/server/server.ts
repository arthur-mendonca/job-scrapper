import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import { fastifyLoggerOptions, logger } from "../logger/logger.js";
import { prisma } from "../persistence/prisma.js";
import { ApiError, formatApiError } from "./errors.js";
import { registerDashboardRoutes } from "./routes/dashboard.routes.js";
import { registerEventsRoutes } from "./routes/events.routes.js";
import { registerJobsRoutes } from "./routes/jobs.routes.js";
import { registerSettingsRoutes } from "./routes/settings.routes.js";
import { registerSourcesRoutes } from "./routes/sources.routes.js";

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({ logger: fastifyLoggerOptions });

  await app.register(cors, {
    origin: parseCorsOrigin(env.API_CORS_ORIGIN),
  });

  app.addHook("onRequest", async (request) => {
    if (!env.API_REQUIRE_INTERNAL_AUTH) return;

    const path = request.url.split("?")[0] ?? "";
    const shouldProtect = path === "/api" || path.startsWith("/api/");
    if (!shouldProtect) return;

    const headerValue = request.headers["x-internal-api-secret"];
    const receivedSecret = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;

    if (!receivedSecret || receivedSecret !== env.API_INTERNAL_SECRET) {
      throw new ApiError(403, "FORBIDDEN", "Forbidden.");
    }
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      error: {
        code: "NOT_FOUND",
        message: "Route not found.",
      },
    });
  });

  app.setErrorHandler((error, _request, reply) => {
    const formatted = formatApiError(error);
    if (formatted.statusCode >= 500) {
      logger.error({ err: error }, "API request failed");
    }
    reply.status(formatted.statusCode).send(formatted.body);
  });

  await app.register(async (healthApp) => {
    await healthApp.register(rateLimit, {
      max: 30,
      timeWindow: "1 minute",
    });

    healthApp.get("/health", async (_request, reply) => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return {
          status: "ok",
          database: "ok",
          uptimeSeconds: Math.round(process.uptime()),
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        logger.error({ err: error }, "Health check failed");
        reply.status(503);
        return {
          status: "error",
          database: "unavailable",
          uptimeSeconds: Math.round(process.uptime()),
          timestamp: new Date().toISOString(),
        };
      }
    });
  });

  await app.register(registerDashboardRoutes, { prefix: "/api" });
  await app.register(registerJobsRoutes, { prefix: "/api" });
  await app.register(registerSourcesRoutes, { prefix: "/api" });
  await app.register(registerEventsRoutes, { prefix: "/api" });
  await app.register(registerSettingsRoutes, { prefix: "/api" });

  return app;
}

function parseCorsOrigin(value: string): boolean | string[] {
  if (value.trim() === "*") return true;
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
