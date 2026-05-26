# system-architecture Specification

## Purpose
TBD - created by archiving change migrate-initial-specs. Update Purpose after archive.
## Requirements
### Requirement: Product mission and system boundary
The system SHALL be a personal job intelligence backend that turns dispersed job sources into a single deduplicated, scored, persisted, and actionable job database.

#### Scenario: Product scope is reviewed
- **WHEN** a change proposes new system behavior
- **THEN** it preserves the core mission of reducing manual job search effort through collection, normalization, deduplication, scoring, persistence, and notification

### Requirement: Backend-first architecture with API surface
The system SHALL remain backend-first and worker-oriented while exposing backend API capabilities for operational consumers such as reports, dashboards, source management, and job curation.

#### Scenario: Operational UI is introduced
- **WHEN** a frontend or dashboard is added in a later change
- **THEN** it uses the backend API and persisted pipeline data rather than replacing the collection pipeline or moving business logic into the browser

### Requirement: MVP non-goals and anti-abuse constraints
The system MUST NOT include NestJS for the MVP, GitHub Actions scheduling, authenticated LinkedIn scraping, cookie-based scraping, private job-board APIs, CAPTCHA bypass, stealth browsing, LinkedIn login automation, or scraping strategies requiring user credentials or anti-bot evasion.

#### Scenario: New source strategy is proposed
- **WHEN** a source requires login, cookies, private API access, CAPTCHA bypass, or stealth automation
- **THEN** the strategy is rejected for the MVP architecture

### Requirement: Required technology baseline
The system SHALL use TypeScript, Node.js, pnpm, Prisma ORM, PostgreSQL, Zod, Cheerio, Docker Compose, node-cron or equivalent container-safe scheduling, and structured logging with Pino or Winston unless a later spec explicitly changes the baseline.

#### Scenario: Core dependency is selected
- **WHEN** a change introduces or replaces core runtime, persistence, scheduling, validation, parsing, or logging dependencies
- **THEN** the selected dependency aligns with the baseline or the change explicitly documents the approved deviation

### Requirement: Pipeline stage architecture
The system SHALL organize the job intelligence flow as configured sources, collectors, raw job items, normalization, normalized jobs, deduplication plus scoring, PostgreSQL/Prisma persistence, and notifications or reports.

#### Scenario: Collection cycle executes
- **WHEN** a collection cycle runs
- **THEN** source data flows through collection, normalization, deduplication, scoring, persistence, and notification/reporting in that order

### Requirement: Module responsibility boundaries
The system SHALL keep responsibilities separated across config, collectors, normalizer, scoring, deduplication, persistence, pipeline orchestration, notifier, scheduler, CLI, API/server, logger, and utility modules.

#### Scenario: Collector implementation is reviewed
- **WHEN** a collector returns source data
- **THEN** it does not write to the database, send notifications, decide final scores, or update job lifecycle status

#### Scenario: Persistence behavior is reviewed
- **WHEN** a module needs to create, update, query, or mark persisted entities
- **THEN** it uses repository boundaries rather than direct Prisma access from collectors, normalizers, scoring, or notifier code

### Requirement: Source configuration architecture
The system SHALL load source definitions from configuration, validate them with Zod, filter disabled sources, and instantiate enabled collectors through the collector registry.

#### Scenario: Configured source is disabled
- **WHEN** `SOURCES_CONFIG_PATH` points to a source configuration containing a disabled source
- **THEN** that source is not instantiated for the collection cycle

### Requirement: Runtime entrypoints
The system SHALL support separate executable entrypoints for scheduled worker operation, one-shot collection, API serving, report generation, SearXNG query testing, and operational bootstrap where those entrypoints are implemented.

#### Scenario: Operator chooses runtime mode
- **WHEN** the operator runs the relevant package script
- **THEN** the selected entrypoint performs only its intended role without requiring an unrelated runtime mode to be active

### Requirement: Typed environment boundary
The system SHALL centralize environment parsing in the typed config module, validate required values before dependent behavior runs, and MUST NOT read `process.env` directly across the codebase outside that config boundary.

#### Scenario: Runtime configuration is loaded
- **WHEN** the worker, API, notifier, or pipeline starts
- **THEN** configuration values are validated before they are used by runtime behavior

### Requirement: Source failure isolation
The system SHALL treat collector failures as source-scoped failures and continue the collection cycle for other enabled sources unless an unrecoverable system error occurs.

#### Scenario: One collector fails
- **WHEN** one collector fails during a collection cycle
- **THEN** the failure is logged with source context and the remaining collectors continue where possible

### Requirement: Observability and operational logging
The system SHALL emit structured logs to stdout and SHALL support an optional file-backed log sink under `/app/logs` for Docker/VPS operation.

#### Scenario: Docker deployment uses file logs
- **WHEN** the operator mounts `./logs` to `/app/logs` for the running containers
- **THEN** the runtime writes structured log output to `/app/logs` in addition to stdout

#### Scenario: Logs contain secrets
- **WHEN** logs include runtime configuration or errors
- **THEN** secrets such as Telegram tokens, SMTP credentials, and internal API secrets are redacted

### Requirement: Historical operation model
The system SHALL persist enough history to distinguish newly discovered opportunities from rediscovered jobs and to summarize collection runs over time.

#### Scenario: Existing job is found again
- **WHEN** a previously persisted job appears in a later source result
- **THEN** the architecture supports updating rediscovery metadata and recording an event or run metric without treating it as a brand-new opportunity

### Requirement: Docker and VPS deployment topology
The system SHALL be operable on a VPS through Docker Compose with an app service, PostgreSQL service, optional SearXNG service or external SearXNG URL, persistent PostgreSQL volume, mounted email-alert input directory, restart policy, and production-oriented logs.

#### Scenario: Docker deployment starts
- **WHEN** Docker Compose starts the system
- **THEN** the app can run in its configured mode, PostgreSQL data persists across restarts, and email alert input files can be mounted into the app container

### Requirement: Private API deployment compatibility
The system architecture SHALL support keeping the API off the public internet in production while allowing trusted internal services, such as a SvelteKit server or Telegram command bot, to call it over the private network.

#### Scenario: Private deployment is configured
- **WHEN** the system is deployed behind a frontend or internal bot
- **THEN** browser clients do not need direct access to the API service and trusted server-side components can call the API by internal URL

### Requirement: Evolution path preserves pipeline core
Post-MVP capabilities such as an operational dashboard, AI review queue, source/query management, professional profile data, CV generation, and lightweight CRM SHALL build on persisted jobs, events, scores, statuses, and source metrics rather than bypassing the pipeline.

#### Scenario: AI review is added
- **WHEN** AI-assisted triage is introduced
- **THEN** it operates after collection, normalization, deduplication, and heuristic scoring rather than replacing those stages

### Requirement: API request logging uses the shared logger
The API server SHALL use the shared structured logger configuration for request and error logging.

#### Scenario: API request is handled
- **WHEN** the API handles a request
- **THEN** request and error logs follow the shared structured logging rules and do not expose secrets

