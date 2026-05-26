# telegram-health-bot Specification

## Purpose
TBD - created by archiving change ops-telegram-health-and-file-logging. Update Purpose after archive.
## Requirements
### Requirement: Telegram command bot runtime exists
The system SHALL provide a dedicated Telegram command bot runtime that can receive messages and respond to operational commands without requiring the API to be publicly exposed.

#### Scenario: Bot runtime starts
- **WHEN** the bot runtime starts with valid Telegram credentials
- **THEN** it begins receiving Telegram updates and can process supported commands

### Requirement: Authorized chat allowlist
The bot runtime SHALL respond only to messages from authorized chats and MUST NOT process operational commands from unauthorized chats.

#### Scenario: Authorized chat sends /health
- **WHEN** a `/health` message arrives from an authorized chat
- **THEN** the bot processes the command

#### Scenario: Unauthorized chat sends /health
- **WHEN** a `/health` message arrives from an unauthorized chat
- **THEN** the bot ignores or rejects the command without calling the internal API

### Requirement: Internal API health call
When handling `/health`, the bot runtime SHALL call the internal API health endpoint over the private network. The `/health` endpoint is public and the bot MUST NOT rely on `X-Internal-Api-Secret` for health checks.

#### Scenario: Health is checked
- **WHEN** `/health` is requested
- **THEN** the bot calls the internal API health endpoint without requiring an internal secret header

### Requirement: Safe health response
The `/health` response sent to Telegram SHALL be concise and MUST NOT include secrets, tokens, internal URLs, or raw error bodies.

#### Scenario: Health endpoint returns ok
- **WHEN** the internal API health endpoint reports success
- **THEN** the bot replies with a brief success summary (status, timestamp, and key component status)

#### Scenario: Health endpoint returns error
- **WHEN** the internal API health endpoint reports failure or cannot be reached
- **THEN** the bot replies with a brief failure summary without leaking sensitive diagnostic details

