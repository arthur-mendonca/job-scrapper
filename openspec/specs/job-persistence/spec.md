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
The system SHALL define a single authoritative job status vocabulary and persist job status using only the allowed values.

#### Scenario: Allowed status is written
- **WHEN** a user-controlled status is written for a job
- **THEN** the persisted job status is one of `new`, `saved`, `discarded`, `applied`, `ignored`, `interviewing`, `offer`, or `ghosted`

#### Scenario: Applied status is interpreted
- **WHEN** a job status is `applied`
- **THEN** the system treats it as meaning the user submitted a candidacy/application for the job, not as the Portuguese wording "aplicado"

#### Scenario: System-controlled status is set
- **WHEN** the pipeline marks a job as `rejected` or `notified`
- **THEN** the persisted job status reflects that system-controlled state

### Requirement: User-controlled vs system-controlled statuses
The API SHALL allow users to update only user-controlled statuses and MUST NOT allow API consumers to set system-controlled statuses directly.

#### Scenario: API attempts to set rejected
- **WHEN** an API consumer attempts to set a job status to `rejected`
- **THEN** the request is rejected without modifying the job

#### Scenario: API attempts to set notified
- **WHEN** an API consumer attempts to set a job status to `notified`
- **THEN** the request is rejected without modifying the job

### Requirement: Status change events
When a job status changes, the system SHALL record an event in job history so operational tooling can audit workflow progress.

#### Scenario: Status changes via API
- **WHEN** a job status changes via the API
- **THEN** a JobEvent records the previous and new status values

