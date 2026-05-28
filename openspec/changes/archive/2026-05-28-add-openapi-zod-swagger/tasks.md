## 1. Dependencies and Server Bootstrap

- [x] 1.1 Install `@fastify/swagger`, `@fastify/swagger-ui`, and `fastify-type-provider-zod` with pnpm.
- [x] 1.2 Configure Fastify with Zod validator and serializer compilers during server creation.
- [x] 1.3 Register Swagger before health and `/api` routes are registered so `app.swagger()` can generate the full document.
- [x] 1.4 Define OpenAPI metadata, tags, shared error schema behavior, and any optional local-only documentation endpoint paths.

## 2. Shared API Schemas

- [x] 2.1 Create or organize reusable Zod schemas for common API DTO fields, pagination, errors, and nullable values.
- [x] 2.2 Add response schemas matching the current dashboard, job, source, event, settings, and health DTO shapes.
- [x] 2.3 Ensure schemas describe API DTOs rather than exposing internal Prisma model shapes directly.

## 3. Route Documentation and Validation

- [x] 3.1 Convert route registration to use the Zod type provider where schemas are attached.
- [x] 3.2 Add schemas, tags, summaries, and stable operation IDs for `GET /health`.
- [x] 3.3 Add schemas, tags, summaries, and stable operation IDs for dashboard routes.
- [x] 3.4 Add schemas, tags, summaries, and stable operation IDs for job list, job detail, and job status update routes.
- [x] 3.5 Add schemas, tags, summaries, and stable operation IDs for source routes.
- [x] 3.6 Add schemas, tags, summaries, and stable operation IDs for event routes.
- [x] 3.7 Add schemas, tags, summaries, and stable operation IDs for settings routes.

## 4. Security and Compatibility

- [x] 4.1 Preserve `X-Internal-Api-Secret` enforcement for protected `/api` routes when `API_REQUIRE_INTERNAL_AUTH=true`.
- [x] 4.2 Preserve unauthenticated `/health` behavior and its existing rate limit.
- [x] 4.3 Ensure frontend generation does not depend on a public `/docs` route or a running backend HTTP server.
- [x] 4.4 If Swagger UI is mounted, keep it local/internal or config-gated rather than treating it as the frontend contract source.

## 5. Static OpenAPI Generation

- [x] 5.1 Add `src/cli/generate-spec.ts` to build the Fastify app in memory, await `app.ready()`, call `app.swagger()`, write `openapi.json`, close the app, and exit.
- [x] 5.2 Add a package script that runs the static OpenAPI generation command with the existing TypeScript runtime tooling.
- [x] 5.3 Decide whether `openapi.json` is committed immediately and document that route/schema changes must regenerate it.

## 6. Verification

- [x] 6.1 Run the TypeScript build to verify route schema typing and dependency integration.
- [x] 6.2 Run the static generation script and confirm `openapi.json` includes health and `/api` operations.
- [x] 6.3 Confirm at least one Orval-relevant route includes params/query/body and response schemas with stable operation IDs.
- [x] 6.4 Verify invalid requests still fail validation and valid requests preserve current response shapes.
