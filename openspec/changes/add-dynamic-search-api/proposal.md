## Why

Dynamic SearXNG search is currently scheduler-facing: saved configs can be executed by the worker, but a frontend user cannot create, edit, test, or refine search terms through the backend API. This change makes dynamic search manageable from an operational interface while preserving the private API, anti-abuse, dork enrichment, and scheduler safeguards already specified for dynamic SearXNG.

## What Changes

- Add private API endpoints for listing, creating, reading, updating, activating, deactivating, and deleting or archiving dynamic SearXNG search configurations.
- Add a private test-search endpoint where the user submits search terms and optional target engines/sites/filters, receives the enriched dork, and sees raw SearXNG preview results without persisting jobs or triggering notifications.
- Add API support for creating saved search-term sets that the worker scheduler will use during future cron-driven collection runs.
- Require all dynamic search API requests to use Zod-backed validation and generated OpenAPI operation IDs suitable for frontend client generation.
- Require dynamic search API routes to respect internal API authentication, request throttling, max result limits, anti-abuse constraints, and safe logging.
- Update operational dashboard expectations so a frontend can manage saved search sets and run test searches for refinement.
- This change specifies API/frontend-facing behavior only; it does not replace the existing worker scheduler or deduplication pipeline.

## Capabilities

### New Capabilities

- `dynamic-search-api`: Covers private API management of dynamic SearXNG search configs, ad hoc test searches, frontend-ready response contracts, validation, throttling, and safe preview behavior.

### Modified Capabilities

- `api-openapi-contract`: Dynamic search management and test-search routes must be documented in the generated OpenAPI contract with stable operation IDs and Zod schemas.
- `api-security`: Dynamic search API routes must be protected by the internal API security model and rate-limited where they can trigger SearXNG requests.
- `operational-dashboard`: The dashboard must allow users to manage dynamic search-term sets and run test searches to refine results.

## Impact

- Fastify route module for dynamic search config CRUD and test-search actions.
- Zod schemas and OpenAPI response contracts for dynamic search configs, enriched queries, raw preview results, execution metadata, validation errors, and rate-limit errors.
- Repository/service usage for dynamic config persistence without direct Prisma access from route handlers where existing boundaries prefer services/repositories.
- SearXNG preview service that reuses dynamic query enrichment and public SearXNG HTTP API behavior without persisting jobs, scoring jobs, or notifying users.
- API protection and throttling configuration for endpoints that can create SearXNG traffic.
- Future frontend client generation and UI flows for saved search management and test-result refinement.
