## 1. Telegram Health Bot

- [x] 1.1 Define env configuration for the bot (internal API base URL, internal auth behavior, authorized chat allowlist).
- [x] 1.2 Add a new CLI entrypoint for the Telegram command bot and wire it into `package.json` scripts for dev/build/start.
- [x] 1.3 Implement `/health` command handling with allowlist enforcement and safe response formatting.
- [x] 1.4 Implement internal API call to `GET /health` including `X-Internal-Api-Secret` when required.
- [x] 1.5 Add tests for authorization behavior and response safety (no secrets/URLs/error bodies).

## 2. File-Backed Pino Logging

- [x] 2.1 Update `src/logger/logger.ts` to support optional file-backed logging under `/app/logs` while preserving redaction.
- [x] 2.2 Enable shared logging for the Fastify API process so request/error logs use the shared logger configuration.
- [x] 2.3 Add Docker Compose volume mounts `./logs:/app/logs` for relevant services (API, worker, and bot if added).
- [x] 2.4 Add `/logs/` to `.gitignore`.
- [x] 2.5 Add a minimal verification step (run API + worker + bot locally in dev mode and confirm logs are emitted and secrets are redacted).
