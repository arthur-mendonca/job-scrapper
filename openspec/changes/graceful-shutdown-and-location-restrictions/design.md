## Context

The worker runtime uses a scheduler that prevents overlapping cycles, but its shutdown handler currently stops the cron task and calls `process.exit(0)` immediately, even if a collection cycle is still running. This can interrupt persistence/notifications and conflicts with the documented graceful shutdown expectation.

Separately, the normalizer currently emits `remoteType` but does not persist structured geo/location restriction signals (for example US-only). Scoring detects some restrictions indirectly from free text, which is less explainable and harder to test.

## Goals / Non-Goals

**Goals:**

- Stop scheduling new runs on SIGINT/SIGTERM while allowing an in-flight cycle to finish at a safe completion point.
- Persist structured geo/location restriction signals extracted during normalization.
- Prefer structured restriction signals in scoring when available, keeping backward compatibility with text-based heuristics.

**Non-Goals:**

- Do not redesign the pipeline orchestration or add new scheduling systems.
- Do not attempt to infer complex immigration/work-authorization constraints beyond explicit geo/location restrictions present in the job text.
- Do not change collector behavior; extraction happens in normalization/scoring.

## Decisions

1. Move shutdown responsibility to the runtime entrypoint, not the scheduler.
   - Rationale: `process.exit()` inside scheduler prevents coordinated shutdown across DB connections and in-flight work; the CLI entrypoint already owns Prisma disconnect in one-shot modes.
   - Alternative considered: keep `process.exit()` in scheduler but add delays. Rejected because it is brittle and hard to reason about.

2. Track the in-flight cycle promise and await it during shutdown.
   - Rationale: enables “safe point” semantics without introducing a complex job queue.
   - Alternative considered: force-cancel the cycle. Rejected because cancellation would require propagating abort signals through collectors, persistence, and notifier layers.

3. Add a structured `geoRestrictions` field that flows NormalizedJob → persisted Job.
   - Rationale: makes restrictions explicit, testable, and explainable; reduces reliance on indirect text scanning.
   - Alternative considered: keep restrictions only in scoring. Rejected because persistence and reporting should be able to expose restrictions as a first-class field.

## Risks / Trade-offs

- Shutdown waiting can delay process exit. → Mitigation: implement a maximum shutdown timeout and log when a forced exit occurs.
- Adding a new persisted field requires a Prisma migration. → Mitigation: keep the field optional/defaulted and deploy via the existing `pnpm prisma:migrate` workflow.
