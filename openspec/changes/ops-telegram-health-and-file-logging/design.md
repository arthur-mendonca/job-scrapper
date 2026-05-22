## Context

The repository already implements a Fastify API with internal-header authentication and a `/health` endpoint, plus Telegram-based outbound notifications for high-scoring jobs. However, there is no Telegram command bot process to receive `/health` commands, and operational logging is currently oriented around stdout without a persistent on-disk sink mounted from Docker Compose.

This change adds an operational Telegram command bot process and strengthens logging so VPS deployments can persist structured logs under `/app/logs` while still emitting to stdout.

## Goals / Non-Goals

**Goals:**

- Provide a Telegram command bot runtime that accepts `/health` and returns a concise health status for the system without leaking secrets.
- Ensure the bot only responds to an authorized chat allowlist and does not invoke the API for unauthorized chats.
- Add a file-backed logging sink under `/app/logs` that works in Docker Compose via `./logs:/app/logs`, while keeping stdout logs for container observability.
- Enable consistent request/error logging for the Fastify API using the same Pino configuration used by the rest of the runtime.

**Non-Goals:**

- Do not change job collection, normalization, scoring, persistence, or notification logic.
- Do not expose the API publicly; this change does not relax internal-auth requirements.
- Do not implement advanced Telegram bot features beyond the minimal `/health` command and authorization checks.

## Decisions

1. Implement the Telegram bot as a dedicated CLI runtime.
   - Rationale: keeps responsibilities isolated from API/worker, aligns with the existing CLI entrypoint pattern in `src/cli/*`.
   - Alternative considered: embed command handling into the API process. Rejected because it couples Telegram polling/webhook concerns to API lifecycle and deployment.

2. Use Telegram long-polling via the Bot API.
   - Rationale: works behind NAT without public webhooks and fits a VPS/private network deployment where exposing webhook endpoints is undesirable.
   - Alternative considered: Telegram webhook handler behind a public endpoint. Rejected due to increased operational exposure and reverse-proxy complexity.

3. Require explicit env configuration for internal API calling from the bot.
   - Rationale: bot should not guess internal URLs; it must call a configured internal base URL (for example `http://app:3000`) and include `X-Internal-Api-Secret` when required.

4. Add an optional file logging sink alongside stdout.
   - Rationale: stdout is still useful for container logs, but file persistence is valuable for audits and longer retention on a VPS.
   - Alternative considered: stdout-only. Rejected because it does not meet the operational requirement to persist logs across container restarts when desired.

5. Use a single Pino configuration for API, worker, and bot.
   - Rationale: consistent redaction rules, consistent timestamping, and consistent log structure across processes.

## Risks / Trade-offs

- Long-polling can miss messages during downtime. → Mitigation: store and resume `update_id` in-memory during runtime and keep the process supervised with restart policies.
- Logging to file can grow unbounded. → Mitigation: document that log rotation is an operator responsibility (Docker host logrotate) and keep logs structured for downstream processing.
- Misconfiguration could cause the bot to call the API without auth. → Mitigation: enforce config validation and make the bot include `X-Internal-Api-Secret` when configured; avoid logging secrets or full error bodies.
