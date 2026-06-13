## Context

The previous dynamic SearXNG work made user-defined search configurations available to the worker scheduler, but configuration management remains backend-only. The frontend needs a private API surface that lets the user define search-term sets, tune enrichment controls, enable or disable scheduled searches, and run preview searches against SearXNG before saving or refining terms.

This change adds the API and contract layer around the existing dynamic search model and enrichment behavior. It must preserve the current architecture: route handlers validate requests, call service/repository boundaries, use the public SearXNG HTTP API, and never bypass the collection pipeline for persisted jobs.

```
Frontend server action
        │
        ▼
Private API route + X-Internal-Api-Secret
        │
        ├── Config CRUD ──▶ DynamicSearchRepository ──▶ DynamicSearchConfig
        │
        └── Test search ─▶ Enrichment ─▶ SearXNG HTTP API ─▶ Raw preview response

Worker cron later reads saved active DynamicSearchConfig records and runs the normal pipeline.
```

## Goals / Non-Goals

**Goals:**

- Provide frontend-ready private API routes for dynamic search configuration CRUD.
- Allow the user to define search-term sets that active worker cron runs can consume later.
- Provide a test-search endpoint that accepts unsaved terms and returns enriched dork details plus SearXNG raw preview results.
- Reuse dynamic query enrichment and SearXNG safety controls from the scheduler-facing feature.
- Document all routes through Zod-backed OpenAPI schemas with stable operation IDs for generated frontend clients.
- Protect all dynamic search API routes with internal API authentication when enabled and apply throttling to SearXNG-triggering preview routes.

**Non-Goals:**

- No public browser-to-backend API exposure; frontend calls remain server-side through the private API.
- No login-based scraping, cookies, CAPTCHA solving, private search APIs, or stealth automation.
- No immediate job persistence, scoring, deduplication, or notification from the test-search endpoint.
- No replacement of the worker scheduler; saved active configs are still executed by scheduled backend work.
- No implementation code is included in this documentation change.

## Decisions

### Add private dynamic search config CRUD routes

Expose routes under a private API namespace, for example `/api/dynamic-search/configs`, for listing, creating, reading, updating, activating, deactivating, and deleting or archiving dynamic search configs.

Rationale: the frontend needs normal resource operations to build a reliable management UI, and saved configs must remain the source of truth for scheduler execution.

Alternative considered: write configs directly through Prisma Studio or seed scripts. That remains useful for operations, but it is not suitable for a frontend workflow.

### Add a separate test-search route

Expose a route such as `POST /api/dynamic-search/test` that accepts query terms and optional engines/sites/filters, enriches the query, calls SearXNG with bounded limits, and returns preview results.

Rationale: test searches are exploratory and should be safe. Keeping them separate from config CRUD avoids accidental persistence of jobs and makes throttling easier to reason about.

Alternative considered: make `POST /configs/:id/run` the only test path. That is useful as a later addition, but the user also needs to test unsaved terms before creating a config.

### Return preview results, not persisted jobs

The preview response should include the original query, generated dork, selected engines, effective limits, raw SearXNG result fields, inferred source/domain hints where available, and quality hints such as duplicate-looking URLs or missing title/URL markers. It must not create `Job`, `CollectionRun`, or notification records.

Rationale: query refinement should be low-risk and reversible. The scheduler pipeline remains responsible for production discovery.

Alternative considered: run the full pipeline in dry-run mode. That could provide richer scoring later, but it is heavier and risks mixing exploratory searches with production collection metrics.

### Keep API schemas as the frontend contract

Dynamic search routes must use shared Zod schemas for request and response bodies and stable operation IDs in the generated OpenAPI document.

Rationale: the frontend should generate typed clients and not hand-maintain DTOs. The backend remains the source of truth.

Alternative considered: document endpoints manually. That would drift quickly from runtime validation and weaken the generated-client flow already established by the project.

### Apply explicit throttling and safe logging to preview search

The test-search route should enforce max result limits, request throttling, timeout/error handling, and safe logs that avoid dumping excessive raw payloads or secrets. It should respect the same anti-abuse constraints as scheduled dynamic search.

Rationale: preview search is user-triggered and can create direct SearXNG traffic. It needs stronger API-level protection than passive config reads.

Alternative considered: rely only on global Fastify throttling. General throttling helps, but SearXNG-triggering routes need endpoint-specific caps and response behavior.

## Risks / Trade-offs

- Preview searches can be abused or accidentally spammed -> Mitigation: require internal auth, endpoint throttling, max results, timeouts, and no retry loops.
- Frontend users may expect preview results to be saved as jobs -> Mitigation: clearly separate preview response from scheduled collection, and expose save/update actions for configs instead.
- Route DTOs can drift from `DynamicSearchConfig` persistence fields -> Mitigation: use Zod schemas and response mappers rather than returning raw Prisma objects directly.
- Preview result quality may differ from later scheduled runs -> Mitigation: return generated dork, engines, effective limit, and timestamp so users can see exactly what was tested.
- SearXNG failures can produce noisy frontend errors -> Mitigation: return normalized error responses that hide internals while preserving actionable status such as unavailable, throttled, or invalid query.

## Migration Plan

1. Add dynamic search API schemas and route registration under the existing Fastify API server.
2. Add service/repository methods needed by API route handlers without giving route handlers direct Prisma responsibilities beyond existing local patterns.
3. Add the test-search service that reuses enrichment and SearXNG HTTP request behavior with strict limits and no persistence side effects.
4. Add OpenAPI operation IDs and generated-contract tests for all new routes.
5. Add route tests for auth, validation, config CRUD, preview behavior, throttling, and failure responses.
6. Update operational docs for frontend usage, server-side API access, and safe query refinement.
7. Roll back by unregistering dynamic search API routes; existing saved configs and scheduler behavior remain valid.

## Open Questions

- Should deletion hard-delete configs or use an archived/inactive state to preserve execution history?
- Should preview test searches support saved config IDs as well as unsaved request bodies in the first version?
- Should preview quality indicators include lightweight normalization/scoring hints, or remain raw SearXNG-only for MVP?
