## MODIFIED Requirements

### Requirement: Telegram health command
The system SHALL support a Telegram `/health` command where an authorized bot process calls the API health endpoint over the internal network and returns a concise health summary.

#### Scenario: Authorized chat sends health command
- **WHEN** a message `/health` arrives from an authorized chat allowlist
- **THEN** the bot calls `GET /health` on the internal API base URL
- **AND THEN** the bot includes `X-Internal-Api-Secret` when internal authentication is enabled
- **AND THEN** the bot returns a concise summary without secrets or raw error bodies

### Requirement: Unauthorized Telegram commands
The Telegram command process SHALL ignore or reject commands from chats that do not match the configured allowlist.

#### Scenario: Unauthorized chat sends health command
- **WHEN** a `/health` message arrives from an unauthorized chat
- **THEN** the bot does not call the internal API
- **AND THEN** the bot does not reveal sensitive operational details
