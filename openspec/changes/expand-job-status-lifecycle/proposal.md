## Why

The current OpenSpec describes a broader job lifecycle than the API can currently express. The API only allows writing a small subset of statuses, while the pipeline also sets internal-only statuses (for example `rejected` and `notified`). This mismatch makes downstream operational workflows and future dashboard/CRM evolution ambiguous.

## What Changes

- Define and implement a single authoritative job status vocabulary shared by persistence, API, and operational tooling.
- Expand the API status update endpoint to support additional workflow statuses while keeping pipeline-controlled statuses protected.
- Ensure JobEvent history captures status changes consistently for operational auditing.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `job-persistence`: Clarify the job status lifecycle, which statuses are user-controlled vs system-controlled, and the expected event history behavior.
- `operational-dashboard`: Align future-facing curation actions with the expanded status vocabulary (save/discard/apply/interview/offer/ghosted/ignored).

## Impact

- Updates API validation for job status updates and event recording semantics.
- May require a persistence constraint (application-level or schema-level) to prevent invalid statuses.
- May require minor dashboard metrics adjustments where status buckets are shown.
