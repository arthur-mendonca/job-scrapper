## 1. API Schemas and DTOs

- [ ] 1.1 Define Zod request schemas for dynamic search config create, update, activation, deactivation, deletion/archive, list filters, and test-search requests.
- [ ] 1.2 Define explicit response DTO schemas for dynamic search configs, execution metadata, validation errors, test-search previews, SearXNG failures, and rate-limit responses.
- [ ] 1.3 Add response mappers so API routes return DTOs rather than raw Prisma model objects.
- [ ] 1.4 Add schema tests for valid configs, invalid cron expressions, too-small intervals, result-limit bounds, target engines, target sites, required terms, and excluded terms.

## 2. Dynamic Search Services

- [ ] 2.1 Add a dynamic search API service that wraps repository operations for list, create, read, update, activate, deactivate, and delete/archive behavior.
- [ ] 2.2 Add a test-search service that accepts unsaved terms or a saved config ID, reuses query enrichment, calls SearXNG through the public HTTP API, and returns preview-only results.
- [ ] 2.3 Ensure test-search service enforces max result limits, timeout handling, safe failure mapping, and anti-abuse constraints.
- [ ] 2.4 Ensure test-search service does not create jobs, collection runs, job events, notifications, or scheduler success/failure records.

## 3. API Routes

- [ ] 3.1 Register private dynamic search config routes under an API namespace such as `/api/dynamic-search/configs`.
- [ ] 3.2 Implement routes for listing, creating, reading, updating, activating, deactivating, and deleting or archiving dynamic search configurations.
- [ ] 3.3 Implement a private `POST /api/dynamic-search/test` route for previewing unsaved or saved dynamic search terms.
- [ ] 3.4 Add route-level handling for validation errors, not-found responses, SearXNG unavailable/throttled responses, and API rate-limit responses.

## 4. Security and Rate Limiting

- [ ] 4.1 Ensure all dynamic search API routes are protected by the existing internal API authentication behavior when enabled.
- [ ] 4.2 Add endpoint-specific throttling for test-search requests before any SearXNG call is made.
- [ ] 4.3 Enforce request max result limits and reject unsupported bypass fields such as cookies, credentials, CAPTCHA solving, private APIs, or direct target scraping controls.
- [ ] 4.4 Add safe structured logs for config changes and test-search executions without dumping secrets or excessive raw SearXNG payloads.

## 5. OpenAPI Contract

- [ ] 5.1 Add stable operation IDs and tags for all dynamic search API routes.
- [ ] 5.2 Ensure generated OpenAPI includes request bodies, params, query strings, success responses, validation errors, auth errors, rate-limit errors, and SearXNG failure responses.
- [ ] 5.3 Add or update OpenAPI generation tests so frontend client generation can consume the dynamic search routes.
- [ ] 5.4 Regenerate or verify the static OpenAPI artifact according to the repo's contract workflow.

## 6. Tests

- [ ] 6.1 Add route tests for dynamic config CRUD, activation/deactivation, deletion/archive behavior, validation failures, and not-found cases.
- [ ] 6.2 Add route tests proving protected dynamic search routes reject unauthenticated requests when internal auth is enabled.
- [ ] 6.3 Add test-search tests for unsaved terms, saved config ID, generated dork response, preview result shape, SearXNG failures, and no persistence side effects.
- [ ] 6.4 Add throttling tests proving excessive test-search requests return HTTP 429 without calling SearXNG.

## 7. Documentation

- [ ] 7.1 Document frontend-facing dynamic search workflows: create saved search-term sets, enable them for cron-driven searches, and run preview searches for refinement.
- [ ] 7.2 Document private server-side frontend access requirements, including internal API URL and `X-Internal-Api-Secret` handling.
- [ ] 7.3 Document preview-search limitations: raw results only, no job persistence, no notifications, bounded result counts, and anti-abuse constraints.
- [ ] 7.4 Update dynamic search operational docs with example request and response payloads.

## 8. Verification

- [ ] 8.1 Run focused unit and route tests for dynamic search API behavior.
- [ ] 8.2 Run OpenAPI generation and verify dynamic search operations appear with stable operation IDs.
- [ ] 8.3 Run `pnpm build` and the relevant test suite before marking the change complete.
