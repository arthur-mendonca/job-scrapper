## MODIFIED Requirements

### Requirement: Job model fields
The persisted job record SHALL include source metadata, URLs, normalized identity, location, remote type, salary, currency, seniority, description, requirements, stack tags, posted/discovered/last-seen timestamps, score, source trust score, status, content hash, notification timestamp, match reasons, risk flags, recommended action, audit timestamps, and explicit discovery provenance that distinguishes dynamic SearXNG search from predefined SearXNG searches, HTML scraping, ATS collection, job board collection, and email-alert ingestion.

#### Scenario: Job detail is displayed or reported
- **WHEN** downstream code reads a persisted job
- **THEN** the record contains enough data to explain source, fit, risk, status, original link, and discovery mode

#### Scenario: Dynamic SearXNG job is persisted
- **WHEN** a job candidate discovered through a dynamic SearXNG configuration is persisted
- **THEN** the persisted job records an explicit dynamic SearXNG discovery value such as `discoveredVia = dynamic-searxng` or an equivalent enum value

### Requirement: Supporting models
The system SHALL support company, recruiter, job event, collection run, and dynamic search configuration records for source metadata, recruiter tracking, event history, execution metrics, and scheduled user-defined SearXNG search management.

#### Scenario: Collection cycle completes
- **WHEN** a collection cycle finishes
- **THEN** collection run metrics can record counts for raw items, normalized jobs, accepted/rejected jobs, new jobs, rediscovered jobs, high-scoring jobs, notifications, failures, source metrics, and errors

#### Scenario: Dynamic search config is managed
- **WHEN** user-defined SearXNG search terms are stored for scheduled execution
- **THEN** the persistence layer stores them in a dynamic search configuration model with query text, target engines, cadence, active state, execution metadata, and audit timestamps

## ADDED Requirements

### Requirement: Dynamic search configuration persistence
The persistence layer SHALL provide a `DynamicSearchConfig` model or equivalent persisted representation for user-defined SearXNG query intent, target engines, cadence, active status, enrichment controls, execution metadata, and audit timestamps.

#### Scenario: Dynamic search config is created
- **WHEN** a dynamic search configuration is persisted
- **THEN** it stores the user-defined query, target SearXNG engines, cadence, active state, result limits or quality controls, and creation/update timestamps

#### Scenario: Dynamic search execution metadata changes
- **WHEN** a dynamic search configuration starts, succeeds, fails, or backs off
- **THEN** the persistence layer can update last-run, success, failure, next-run, error, and failure-count metadata for that configuration

### Requirement: Dynamic search provenance indexing
The persistence model SHALL support efficient filtering or reporting of jobs by dynamic SearXNG discovery provenance.

#### Scenario: Dynamic jobs are queried
- **WHEN** reports or operational views request jobs discovered through dynamic SearXNG search
- **THEN** the persistence layer can filter by the explicit dynamic discovery value without scanning only unstructured metadata
