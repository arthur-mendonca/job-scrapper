## Context

The API server is implemented with Fastify and currently validates request data by parsing `request.query`, `request.params`, or `request.body` inside handlers with Zod schemas. This protects runtime behavior, but the route contract is not attached to Fastify route definitions, so no OpenAPI document can be generated for frontend tooling.

The frontend will use Orval to generate typed API clients and hooks. For Orval to be useful, the backend must produce stable OpenAPI JSON with accurate operation IDs, request schemas, response schemas, and tags. The frontend will not call a public `/docs` endpoint; the backend will generate a physical `openapi.json` file through a local script, and the frontend can read that file from the backend repository through an authenticated raw Git provider URL when needed. The existing private API model remains in place: `/api/*` routes can require `X-Internal-Api-Secret`, while `/health` stays public for internal health checks.

## Goals / Non-Goals

**Goals:**
- Generate OpenAPI from Fastify route schemas instead of maintaining a separate handwritten spec.
- Use Zod as the source of truth for route params, query strings, bodies, and response payloads.
- Register Swagger and Swagger UI before API routes so every documented route is included.
- Make the generated `openapi.json` suitable for Orval client and hook generation.
- Add a local CLI command that builds the Fastify app in memory, waits for plugins with `app.ready()`, calls `app.swagger()`, and writes `openapi.json`.
- Keep current API behavior, auth boundaries, DTO shapes, and error behavior stable unless route documentation exposes an existing shape more explicitly.

**Non-Goals:**
- Build frontend code or Orval configuration in this backend change.
- Introduce NestJS, tRPC, GraphQL, or a separate schema definition framework.
- Make the API public in production.
- Require the frontend to start or reach the backend HTTP server to fetch Swagger JSON.
- Expose `/docs` publicly for frontend code generation.
- Generate schemas directly from Prisma models as the frontend contract; API DTOs remain the contract.

## Decisions

1. Use `@fastify/swagger`, `@fastify/swagger-ui`, and `fastify-type-provider-zod`.

   Rationale: This is the native Fastify path for OpenAPI generation from route schemas while preserving Zod validation. It avoids maintaining a parallel OpenAPI file and fits the current Fastify/Zod stack.

   Alternatives considered: handwritten OpenAPI YAML, `zod-to-openapi` outside Fastify, or replacing the API framework. Handwritten specs drift too easily, external generation adds another contract layer, and replacing Fastify conflicts with the MVP architecture.

2. Register Zod validators and serializers at server bootstrap before routes.

   Rationale: `fastify-type-provider-zod` expects the validator and serializer compilers to be configured before routes with Zod schemas are registered. This keeps route definitions declarative and lets Fastify validate requests consistently.

   Alternatives considered: keep manual `schema.parse()` inside handlers and only use schemas for documentation. That preserves existing behavior but splits validation from the documented route contract.

3. Convert route modules to typed Fastify instances where schemas are added.

   Rationale: Routes need `withTypeProvider<ZodTypeProvider>()` or compatible typing so Zod schema objects type the handler input. This reduces duplication between runtime validation and TypeScript handler assumptions.

   Alternatives considered: leave route function signatures as plain `FastifyInstance`. That can work at runtime but loses type inference and makes it easier for handler code to drift from route schemas.

4. Document API DTOs through explicit Zod response schemas.

   Rationale: Orval consumes OpenAPI, not TypeScript-only DTO interfaces. Response schemas should describe the JSON returned by `toJobListItemDto`, `toJobDetailDto`, dashboard routes, event routes, source routes, settings routes, health responses, and shared error shapes.

   Alternatives considered: infer response schemas from Prisma types or DTO TypeScript types. Those do not produce OpenAPI reliably and can expose internal fields that are not part of the API contract.

5. Generate the frontend contract as a static artifact.

   Rationale: Orval does not need a live backend if the OpenAPI document is generated and committed or otherwise published as a repository artifact. A script such as `src/cli/generate-spec.ts` can call `buildServer()`, await `app.ready()`, read `(app as any).swagger()`, write `openapi.json`, close the app, and exit. This keeps frontend code generation independent from server availability and avoids exposing `/docs` publicly.

   Alternatives considered: have the frontend fetch `/docs/json` or another Swagger JSON endpoint from a running server. That couples generation to server availability and risks treating docs routes as public integration surfaces. Static generation is simpler for a private backend repository workflow.

6. Keep Swagger UI optional and non-public.

   Rationale: Swagger UI can be useful locally or internally, but it is not the frontend integration mechanism. If a `/docs` route exists, it should be treated as a local/internal diagnostic surface and not as a public production contract.

   Alternatives considered: omit Swagger UI entirely and only use `@fastify/swagger`. That is acceptable if implementation does not need interactive docs; the required contract is the generated `openapi.json`.

## Risks / Trade-offs

- OpenAPI drift from actual DTOs if response schemas are incomplete -> Keep schemas near DTO conversion code or route modules and include build/type checks after conversion.
- Zod response serialization may reject values previously returned by handlers if schemas are too strict -> Start with schemas that match current DTO outputs, including nullable fields and arrays, then tighten only with tests.
- Operation IDs that change later can cause noisy Orval output -> Assign stable operation IDs for documented routes from the beginning.
- Swagger endpoints could expose route structure if the API is accidentally published -> Do not make `/docs` the frontend integration point; prefer static `openapi.json` generation and keep any interactive docs local/internal or gated.
- Committed `openapi.json` can drift if developers forget to regenerate it -> Add a package script and document verification so route/schema changes update the artifact in the same change.
- Converting all routes in one pass may touch many files -> Keep the first implementation focused on existing API and health routes without changing persistence or business logic.

## Migration Plan

1. Install the Swagger and Zod type-provider dependencies with pnpm.
2. Configure Fastify with Zod validator and serializer compilers.
3. Register Swagger and Swagger UI before route registration.
4. Add route schemas and stable operation IDs to `/health` and `/api/*` routes.
5. Add `src/cli/generate-spec.ts` to build the app in memory, call `app.swagger()`, and write `openapi.json`.
6. Add a package script for static spec generation.
7. Build the project and verify `openapi.json` is generated without starting a long-running HTTP server.
8. If rollback is needed, remove the Swagger registrations, route schema additions, generation script, generated artifact, and dependencies; existing handlers can continue to use manual Zod parsing until the conversion is retried.

## Open Questions

- Should Swagger UI be installed and mounted for local inspection, or should the implementation only register `@fastify/swagger` for static generation?
- Should `openapi.json` be committed on every API-contract change, or generated in CI and published as a build artifact later?
