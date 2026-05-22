## Context

The repository already contains a TypeScript/Node.js job intelligence pipeline with collectors, normalization, scoring, deduplication, Prisma persistence, notifications, a scheduler, a Fastify API, Docker deployment files, and tests. The business and architectural intent is documented mainly in `agents/AGENTS-job-intelligence-pipeline.md`, `agents/DOCUMENTACAO_PROJETO.md`, `agents/PLANO_PROTECAO_API.md`, `agents/PLANO_HEALTH_TELEGRAM.md`, `agents/promtp-job-scarapper.txt`, and `agents/to-do.md`.

The OpenSpec workspace has no base specs yet, so this change creates initial capability specs from those source documents. The work is a documentation/specification migration, not a runtime implementation change.

## Goals / Non-Goals

**Goals:**

- Convert existing project rules into testable OpenSpec requirements.
- Preserve the core backend-only MVP contract for collection, normalization, scoring, persistence, notification, scheduling, and deployment.
- Capture existing API/private-network decisions and Telegram healthcheck behavior as separate security requirements.
- Capture clearly marked post-MVP requirements for dashboard, AI review, profile data, CV generation, and CRM so future changes can refine them without losing the original context.
- Keep each capability small enough to be archived and evolved independently.

**Non-Goals:**

- Do not change application code, migrations, Docker configuration, or environment files as part of this migration.
- Do not claim that post-MVP operational UI, AI workflow, CV generation, or CRM behavior is already implemented.
- Do not introduce a frontend requirement into the original backend-only MVP contract.
- Do not loosen anti-abuse constraints around LinkedIn, authenticated scraping, cookies, CAPTCHA, or stealth automation.

## Decisions

1. Split specs by domain capability instead of mirroring source files.
   - Rationale: the `agents/` files mix product intent, current implementation notes, security plans, and future evolution. Capability-oriented specs are easier to validate and modify.
   - Alternative considered: create one `initial-system` spec. Rejected because it would become too broad and difficult to archive safely.

2. Use only `ADDED Requirements`.
   - Rationale: `openspec/specs/` is empty, so there are no existing requirement blocks to modify.
   - Alternative considered: create modified deltas against implied existing behavior. Rejected because OpenSpec archive semantics require existing base requirements.

3. Separate core pipeline capabilities from post-MVP workflow capabilities.
   - Rationale: the backend-only MVP explicitly excludes a frontend, while `agents/to-do.md` describes later operational UI and AI/CV evolution. Separate capabilities avoid turning future ideas into current MVP obligations.
   - Alternative considered: omit future evolution from initial specs. Rejected because the user asked to extract requirements from all `agents/` files.

4. Treat security and healthcheck as their own capability.
   - Rationale: API exposure, internal secrets, SvelteKit server-side calls, and Telegram `/health` flows cut across API, deployment, and bot behavior.
   - Alternative considered: place these under `system-architecture`. Rejected because security requirements need clearer acceptance criteria.

## Risks / Trade-offs

- Broad initial coverage may include requirements that describe future intent rather than current behavior. → Mitigation: keep post-MVP dashboard and AI/CV/CRM specs in separate capabilities and phrase scenarios around intended behavior.
- Some source documents describe implementation details observed in code. → Mitigation: specs state externally testable behavior and module boundaries, while design captures migration rationale.
- Capability names chosen now become future archive structure. → Mitigation: use stable domain names aligned to the existing project modules and source documentation.
- The migration may miss subtle details from the implementation that are not in `agents/`. → Mitigation: this change is based on the requested `agents/` corpus and can be refined by later OpenSpec changes.
