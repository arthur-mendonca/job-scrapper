## 1. Status Vocabulary

- [ ] 1.1 Define a single status vocabulary module and classify user-controlled vs system-controlled statuses.
- [ ] 1.2 Add validation to reject unknown statuses at API boundaries while preserving read compatibility for existing data.

## 2. API and Persistence Alignment

- [ ] 2.1 Expand the job status update endpoint to accept user-controlled statuses (`ignored`, `interviewing`, `offer`, `ghosted`) and reject system-controlled statuses.
- [ ] 2.2 Ensure status changes always create a JobEvent with previous and new values.
- [ ] 2.3 Add/adjust tests for the status update endpoint to cover the expanded vocabulary and system-controlled rejection cases.
