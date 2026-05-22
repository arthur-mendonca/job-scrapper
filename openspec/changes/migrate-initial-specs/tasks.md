## 1. Source Corpus Review

- [ ] 1.1 Confirm that all files under `agents/` were considered as source material.
- [ ] 1.2 Confirm that backend MVP constraints from `AGENTS-job-intelligence-pipeline.md` and `promtp-job-scarapper.txt` are represented in the specs.
- [ ] 1.3 Confirm that current-state architecture and implementation notes from `DOCUMENTACAO_PROJETO.md` are represented without requiring runtime changes.
- [ ] 1.4 Confirm that API protection and Telegram healthcheck plans are represented in `api-security`.
- [ ] 1.5 Confirm that post-MVP dashboard, AI review, CV, and CRM requirements from `to-do.md` are represented as future-facing capabilities.

## 2. Spec Coverage Review

- [ ] 2.1 Review `system-architecture` for stack, module boundary, deployment, configuration, and anti-abuse requirements.
- [ ] 2.2 Review `source-collection`, `job-normalization`, `job-scoring`, and `job-deduplication` for complete pipeline behavior.
- [ ] 2.3 Review `job-persistence`, `notifications-reporting`, and `scheduler-runtime` for persistence, notification, reporting, CLI, and worker requirements.
- [ ] 2.4 Review `api-security` for internal auth, private API exposure, frontend server-side access, CORS role, and Telegram health requirements.
- [ ] 2.5 Review `operational-dashboard` and `ai-review-cv-workflow` to ensure future work is separated from the backend-only MVP contract.

## 3. Validation

- [ ] 3.1 Run `openspec status --change "migrate-initial-specs"` and confirm proposal, design, specs, and tasks are complete.
- [ ] 3.2 Verify each declared capability in `proposal.md` has a matching `specs/<capability>/spec.md`.
- [ ] 3.3 Verify every requirement uses OpenSpec scenario formatting with `#### Scenario:` and `WHEN`/`THEN` bullets.
- [ ] 3.4 Confirm the change is ready to apply or archive without modifying application source code.
