## Context

Today the job lifecycle is stored as a free-form string in persistence and is partially controlled by different parts of the system:

- The pipeline sets internal statuses such as `rejected` and `notified`.
- The API exposes a status update endpoint but only permits a small set of writable statuses (`new`, `saved`, `discarded`, `applied`).
- OpenSpec documentation lists a broader lifecycle (for example `interviewing`, `offer`, `ghosted`, `ignored`), which reflects intended operational workflows but is not currently achievable via the API.

This change makes the status lifecycle explicit and consistent across persistence, API validation, and event history.

## Goals / Non-Goals

**Goals:**

- Define an authoritative status vocabulary and classify which statuses are user-controlled versus system-controlled.
- Expand the API to accept the user-controlled statuses required for operational workflows and post-MVP evolution.
- Ensure status changes are reflected in JobEvent history consistently.

**Non-Goals:**

- Do not change core pipeline business logic beyond status vocabulary alignment.
- Do not build a frontend dashboard UI as part of this change.
- Do not introduce new external dependencies.

## Decisions

1. Keep the persistence field as `String` but enforce a vocabulary in code.
   - Rationale: avoids a Prisma migration while still preventing invalid states from being created by the API.
   - Alternative considered: migrate to a Prisma enum. Rejected for now to keep the change lightweight, but can be revisited later.

2. Split statuses into two classes: user-controlled and system-controlled.
   - User-controlled: `new`, `saved`, `discarded`, `applied`, `ignored`, `interviewing`, `offer`, `ghosted`.
   - System-controlled: `notified`, `rejected`.
   - Semantics note: `applied` is a persisted technical status meaning "application submitted" or "candidate has applied to the job"; Portuguese UI/copy MUST use wording such as "candidatado" or "candidatura enviada", not "aplicado".
   - Rationale: the pipeline must be able to mark jobs as rejected/notified without API consumers overriding those meanings.

3. Preserve JobEvent as the audit log of status transitions.
   - Rationale: it already exists and is exposed through the API; it becomes the single history for operational tracking.

## Risks / Trade-offs

- Expanding writable statuses increases API surface area. → Mitigation: keep strict validation and only allow user-controlled statuses.
- Existing data may contain unexpected status strings. → Mitigation: treat unknown statuses as read-only legacy values and avoid breaking list views; add a diagnostic/reporting task if needed.
