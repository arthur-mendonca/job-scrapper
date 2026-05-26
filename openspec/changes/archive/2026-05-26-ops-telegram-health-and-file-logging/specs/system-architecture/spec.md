## MODIFIED Requirements

### Requirement: Observability and operational logging
The system SHALL emit structured logs to stdout and SHALL support an optional file-backed log sink under `/app/logs` for Docker/VPS operation.

#### Scenario: Docker deployment uses file logs
- **WHEN** the operator mounts `./logs` to `/app/logs` for the running containers
- **THEN** the runtime writes structured log output to `/app/logs` in addition to stdout

#### Scenario: Logs contain secrets
- **WHEN** logs include runtime configuration or errors
- **THEN** secrets such as Telegram tokens, SMTP credentials, and internal API secrets are redacted

## ADDED Requirements

### Requirement: API request logging uses the shared logger
The API server SHALL use the shared structured logger configuration for request and error logging.

#### Scenario: API request is handled
- **WHEN** the API handles a request
- **THEN** request and error logs follow the shared structured logging rules and do not expose secrets
