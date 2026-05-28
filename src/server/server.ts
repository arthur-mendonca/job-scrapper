import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { type FastifyInstance } from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { env } from "../config/env.js";
import { fastifyLoggerOptions, logger } from "../logger/logger.js";
import { prisma } from "../persistence/prisma.js";
import { healthResponseSchema } from "./api-schemas.js";
import { ApiError, formatApiError } from "./errors.js";
import { registerDashboardRoutes } from "./routes/dashboard.routes.js";
import { registerEventsRoutes } from "./routes/events.routes.js";
import { registerJobsRoutes } from "./routes/jobs.routes.js";
import { registerSettingsRoutes } from "./routes/settings.routes.js";
import { registerSourcesRoutes } from "./routes/sources.routes.js";

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({ logger: fastifyLoggerOptions });

  // Configure Zod validator and serializer compilers
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, {
    origin: parseCorsOrigin(env.API_CORS_ORIGIN),
  });

  // Register Swagger before routes so app.swagger() generates the full document
  await app.register(swagger, {
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "Job Intelligence Pipeline API",
        description:
          "Internal API for job collection pipeline management, dashboard metrics, source configuration, and event tracking.",
        version: "0.1.0",
      },
      tags: [
        { name: "Health", description: "Service health checks" },
        { name: "Dashboard", description: "Aggregated dashboard metrics" },
        { name: "Jobs", description: "Job listing, detail, and status management" },
        { name: "Sources", description: "Job source configuration and statistics" },
        { name: "Events", description: "Job lifecycle event log" },
        { name: "Settings", description: "Runtime configuration settings" },
      ],
    },
    transform: jsonSchemaTransform,
  });

  // Swagger UI for local/internal inspection only — not the frontend contract source
  await app.register(swaggerUi, {
    routePrefix: "/docs",
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

    const typedHealthApp = healthApp.withTypeProvider<ZodTypeProvider>();

    typedHealthApp.get(
      "/health",
      {
        schema: {
          operationId: "getHealth",
          tags: ["Health"],
          summary: "Check service health",
          description: "Returns the current health status of the API and database connection.",
          response: {
            200: healthResponseSchema,
            503: healthResponseSchema,
          },
        },
      },
      async (_request, reply) => {
        try {
          await prisma.$queryRaw`SELECT 1`;
          return {
            status: "ok" as const,
            database: "ok" as const,
            uptimeSeconds: Math.round(process.uptime()),
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          logger.error({ err: error }, "Health check failed");
          reply.status(503);
          return {
            status: "error" as const,
            database: "unavailable" as const,
            uptimeSeconds: Math.round(process.uptime()),
            timestamp: new Date().toISOString(),
          };
        }
      }
    );
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
