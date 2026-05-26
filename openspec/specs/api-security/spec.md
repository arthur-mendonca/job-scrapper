# api-security Specification

## Purpose
TBD - created by archiving change migrate-initial-specs. Update Purpose after archive.
## Requirements
### Requirement: Private API exposure
The API SHALL be designed so production deployment can keep it off the public internet and reachable only through private network paths used by trusted services.

#### Scenario: Production deployment is configured
- **WHEN** the API runs in the target VPS or Coolify environment
- **THEN** the frontend/server-side clients or internal bot use an internal URL rather than a public API domain

### Requirement: Internal header authentication
Protected API routes SHALL require the `X-Internal-Api-Secret` header when internal authentication is enabled.

#### Scenario: Request lacks internal secret
- **WHEN** `API_REQUIRE_INTERNAL_AUTH` is true and a protected API request omits the internal secret header
- **THEN** the API rejects the request with a generic forbidden response before executing the route handler

### Requirement: Frontend server-side API access
If an operational frontend is used, it SHALL call the API only from server-side code using private environment variables and MUST NOT expose the internal API URL or secret to browser bundles.

#### Scenario: Browser loads the frontend
- **WHEN** a user inspects browser network traffic or bundled client code
- **THEN** the internal API secret is not visible and direct browser-to-API calls are not required

### Requirement: CORS is secondary control
The system SHALL NOT treat CORS as the primary security boundary for API protection.

#### Scenario: Direct non-browser client calls API
- **WHEN** a non-browser client sends a request directly to a protected route
- **THEN** access depends on network exposure and internal authentication rather than CORS

### Requirement: Telegram health command

The system SHALL support a Telegram `/health` command where an authorized bot process calls the API health endpoint over the internal network and returns a concise health summary.

#### Scenario: Authorized chat sends health command

- **WHEN** a message `/health` arrives from an authorized chat allowlist
- **THEN** the bot calls `GET /health` on the internal API base URL
- **AND THEN** the bot returns a concise summary without secrets or raw error bodies

### Requirement: Unauthorized Telegram commands

The Telegram command process SHALL ignore or reject commands from chats that do not match the configured allowlist.

#### Scenario: Unauthorized chat sends health command

- **WHEN** a `/health` message arrives from an unauthorized chat
- **THEN** the bot does not call the internal API
- **AND THEN** the bot does not reveal sensitive operational details

### Requirement: Health route is public

The API SHALL expose `GET /health` as a public endpoint and MUST NOT require `X-Internal-Api-Secret` for health checks.

#### Scenario: Health is checked without internal secret

- **WHEN** a client calls `GET /health` without `X-Internal-Api-Secret`
- **THEN** the API responds with health status and does not return 403 due to internal auth

### Requirement: Health route is throttled

The API SHALL apply request throttling to `GET /health` to reduce abuse risk from malicious automated traffic.

#### Scenario: Health endpoint is spammed

- **WHEN** a client exceeds the configured request threshold for `GET /health`
- **THEN** the API responds with a rate-limit response (HTTP 429) without executing expensive downstream work

