## ADDED Requirements

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

## MODIFIED Requirements

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
