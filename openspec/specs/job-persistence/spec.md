# job-persistence Specification

## Purpose
TBD - created by archiving change migrate-initial-specs. Update Purpose after archive.
## Requirements
### Requirement: PostgreSQL persistence with Prisma
The system SHALL persist jobs, companies, recruiters, job events, and collection runs in PostgreSQL through Prisma.

#### Scenario: Application stores job data
- **WHEN** a normalized and scored job is accepted by the pipeline
- **THEN** it is persisted through repository code backed by Prisma and PostgreSQL

### Requirement: Repository boundaries
The system SHALL keep database operations in repository modules and MUST NOT require collectors, normalizers, scoring, or notifier modules to call Prisma directly.

#### Scenario: Collector needs existing job data
- **WHEN** duplicate detection is needed
- **THEN** the pipeline or repository layer performs the lookup rather than the collector

### Requirement: Job model fields
The persisted job record SHALL include source metadata, URLs, normalized identity, location, remote type, salary, currency, seniority, description, requirements, stack tags, posted/discovered/last-seen timestamps, score, source trust score, status, content hash, notification timestamp, match reasons, risk flags, recommended action, and audit timestamps.

#### Scenario: Job detail is displayed or reported
- **WHEN** downstream code reads a persisted job
- **THEN** the record contains enough data to explain source, fit, risk, status, and original link

### Requirement: Supporting models
The system SHALL support company, recruiter, job event, and collection run records for source metadata, recruiter tracking, event history, and execution metrics.

#### Scenario: Collection cycle completes
- **WHEN** a collection cycle finishes
- **THEN** collection run metrics can record counts for raw items, normalized jobs, accepted/rejected jobs, new jobs, rediscovered jobs, high-scoring jobs, notifications, failures, source metrics, and errors

### Requirement: Operational indexes
The data model SHALL provide indexes or equivalent query support for deduplication, filtering by company/title/status/score/source trust/notification/last-seen, and event or run history.

#### Scenario: Recent high-scoring jobs are queried
- **WHEN** the report, API, or dashboard asks for recent high-scoring jobs
- **THEN** the persistence layer can query by score and recency without scanning only unstructured payloads

### Requirement: Job status lifecycle
The system SHALL support job statuses such as `new`, `notified`, `saved`, `applied`, `ignored`, `rejected`, `interviewing`, `offer`, and `ghosted`.

#### Scenario: User marks a job as applied
- **WHEN** a job status changes to `applied`
- **THEN** the persisted job reflects the new lifecycle state for reports and future workflows

