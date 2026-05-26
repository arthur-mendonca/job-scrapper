## Why

The OpenSpec migration currently describes two operational behaviors that are not implemented in the Node.js runtime: a Telegram `/health` command bot flow and file-oriented Pino logging for VPS/Docker operation. This change makes the running system match the documented operational/security contracts.

## What Changes

- Add a Telegram command bot runtime that listens for `/health` and returns a concise health summary after calling the internal API health endpoint with internal authentication.
- Extend logging so the application can write structured logs to `/app/logs` in addition to stdout, with a Docker Compose volume mount for persistence.
- Keep secrets safe by ensuring no tokens or internal secrets are emitted in logs or bot replies.

## Capabilities

### New Capabilities

- `telegram-health-bot`: Telegram command bot process that authorizes the chat, calls the internal health endpoint, and returns a safe health summary.

### Modified Capabilities

- `api-security`: Clarify and harden the `/health` command behavior, authorization, and secret handling as an operational security contract.
- `system-architecture`: Require an operational log output strategy compatible with Docker/VPS (stdout + optional file sink under `/app/logs`).

## Impact

- Adds a new CLI entrypoint/process for the Telegram command bot.
- Updates Docker Compose to mount `./logs` to `/app/logs` for persistence.
- Updates logging configuration and server startup integration to ensure consistent structured logs across API, worker, and bot runtimes.
