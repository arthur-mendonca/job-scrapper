## ADDED Requirements

### Requirement: Generated OpenAPI document
The backend SHALL generate an OpenAPI document from Fastify route definitions and Zod schemas rather than requiring a separately maintained handwritten OpenAPI specification.

#### Scenario: OpenAPI JSON is generated statically
- **WHEN** an internal developer or automation runs the OpenAPI generation script
- **THEN** the script builds the Fastify app in memory and writes an `openapi.json` file describing the registered health and API routes

#### Scenario: Route schemas are registered
- **WHEN** API routes are registered
- **THEN** their request params, query strings, request bodies, response bodies, tags, and operation IDs are included in the generated OpenAPI document where applicable

### Requirement: Zod-backed route contracts
API route validation and documentation SHALL use Zod-backed schemas through Fastify's Zod type provider so the documented contract and runtime validation share the same schema source where practical.

#### Scenario: Request query is validated
- **WHEN** a documented route receives query parameters
- **THEN** Fastify validates the query against the route's Zod schema before route business logic runs

#### Scenario: Request body is validated
- **WHEN** a documented route receives a JSON body
- **THEN** Fastify validates the body against the route's Zod schema before route business logic runs

### Requirement: Orval-compatible operations
The generated OpenAPI document SHALL provide stable operation IDs and response schemas that are suitable for Orval client and hook generation.

#### Scenario: Frontend generates API hooks
- **WHEN** Orval consumes the backend OpenAPI document
- **THEN** it can derive typed functions or hooks for each documented route without requiring manually written frontend model definitions

#### Scenario: Route response changes
- **WHEN** a documented API response shape changes in the backend
- **THEN** the OpenAPI response schema is updated in the same change so generated frontend types reflect the backend contract

### Requirement: Static frontend contract consumption
The frontend SHALL consume the backend OpenAPI contract from a generated `openapi.json` artifact rather than from a public Swagger UI or `/docs` route.

#### Scenario: Frontend reads private repository artifact
- **WHEN** the frontend generation pipeline needs the API contract
- **THEN** it can read the generated `openapi.json` from the backend repository, using a Git provider access token if the repository is private

#### Scenario: Public docs route is unavailable
- **WHEN** frontend code generation runs outside the backend process
- **THEN** it does not require a public `/docs` route or a long-running backend HTTP server to retrieve the OpenAPI document

### Requirement: Private API security compatibility
The OpenAPI and Swagger integration SHALL preserve the existing private API security model, including internal authentication for protected `/api` routes when enabled and public access for `/health`.

#### Scenario: Protected API route is called without internal secret
- **WHEN** `API_REQUIRE_INTERNAL_AUTH` is true and a client calls a protected `/api` route without `X-Internal-Api-Secret`
- **THEN** the API rejects the request before executing the documented route handler

#### Scenario: Health route is called without internal secret
- **WHEN** a client calls `GET /health` without `X-Internal-Api-Secret`
- **THEN** the API returns health status behavior without being blocked by the OpenAPI integration

#### Scenario: OpenAPI artifact is generated
- **WHEN** the local OpenAPI generation script builds the server in memory
- **THEN** it extracts the OpenAPI object without exposing a public documentation route
