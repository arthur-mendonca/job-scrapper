## ADDED Requirements

### Requirement: Dynamic search API contract
The generated OpenAPI document SHALL include dynamic search configuration and test-search routes with Zod-backed request and response schemas, stable operation IDs, tags, params, query strings, request bodies, success responses, validation errors, auth errors, rate-limit errors, and SearXNG failure responses.

#### Scenario: Frontend generates dynamic search client
- **WHEN** Orval consumes the generated OpenAPI document
- **THEN** it can generate typed frontend client functions for listing, creating, reading, updating, activating, deactivating, removing or archiving dynamic search configs, and running test searches

#### Scenario: Dynamic search route schema changes
- **WHEN** a dynamic search API request or response shape changes
- **THEN** the generated OpenAPI contract changes in the same backend change so frontend types stay synchronized

### Requirement: Dynamic search DTO stability
Dynamic search API responses SHALL use explicit DTO schemas rather than exposing raw Prisma model objects directly.

#### Scenario: Config response is returned
- **WHEN** the API returns a dynamic search configuration
- **THEN** the response follows the documented DTO shape and does not accidentally expose internal-only fields outside the API contract
