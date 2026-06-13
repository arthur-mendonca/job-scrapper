## ADDED Requirements

### Requirement: Persisted dynamic search configurations
The system SHALL persist dynamic SearXNG search configurations containing user-defined query intent, target engines, execution cadence, active status, enrichment controls, result limits, execution metadata, and audit timestamps.

#### Scenario: Active dynamic config is stored
- **WHEN** a dynamic search configuration is created with query text, target engines, cadence, and `isActive` set to true
- **THEN** the configuration is available to scheduler and repository code as an eligible dynamic SearXNG source after validation

#### Scenario: Dynamic config is inactive
- **WHEN** a dynamic search configuration has `isActive` set to false
- **THEN** the scheduler does not execute that configuration

### Requirement: Dynamic search repository boundary
The system SHALL access dynamic search configurations through repository boundaries and MUST NOT require collectors, normalizers, scoring, notifiers, or scheduler helpers to call Prisma directly.

#### Scenario: Scheduler loads dynamic configs
- **WHEN** the scheduler needs active dynamic search configurations
- **THEN** it loads them through a repository or service boundary rather than direct Prisma access from collector code

### Requirement: Natural-language query enrichment into dorks
The backend SHALL transform simple user-defined search terms into constrained SearXNG query dorks before execution, preserving the original input while adding high-signal job-search operators and filters.

#### Scenario: Simple role query is enriched
- **WHEN** the user-defined query is `node react remote latam`
- **THEN** the generated SearXNG query includes the meaningful role and stack terms plus remote-job constraints, target job-board or ATS domain operators, and noise-reduction exclusions before request execution

#### Scenario: Enrichment preserves auditability
- **WHEN** a dynamic query is enriched
- **THEN** the system can inspect or report the original query text and the generated dork without treating the generated dork as job identity

### Requirement: Dork quality controls
The query enrichment behavior SHALL support target site filters, required terms, excluded terms, language or locale controls where supported, and maximum result limits to reduce noisy non-job results.

#### Scenario: Noise terms are configured
- **WHEN** a dynamic config excludes terms such as `internship`, `course`, `bootcamp`, `resume`, `template`, `onsite`, or `hybrid`
- **THEN** generated dorks include equivalent negative filters where supported by the selected SearXNG engines

#### Scenario: Target job sites are configured
- **WHEN** a dynamic config targets specific job-board or ATS domains
- **THEN** generated dorks constrain the search to those domains using search operators where supported

### Requirement: Dynamic SearXNG result provenance
Raw items collected from dynamic SearXNG configurations SHALL include source metadata that identifies SearXNG as the collector path and dynamic search as the discovery mode.

#### Scenario: Dynamic result is collected
- **WHEN** SearXNG returns a result for a dynamic configuration
- **THEN** the raw item includes provenance such as `discoveredVia = dynamic-searxng` or an equivalent explicit value plus metadata for the dynamic config and generated dork

### Requirement: Dynamic query metadata is observability only
Dynamic configuration IDs, user query text, generated dorks, and selected SearXNG engines SHALL be treated as observability metadata and MUST NOT become part of persisted job uniqueness.

#### Scenario: Same job found by two dynamic configs
- **WHEN** two different active dynamic search configurations discover the same canonical job URL
- **THEN** the pipeline treats the result as one job with rediscovery metadata rather than two unique jobs

### Requirement: Dynamic search anti-abuse constraints
Dynamic SearXNG search MUST NOT use login-based scraping, cookies, CAPTCHA solving, private search APIs, stealth browser automation, or any anti-bot bypass technique.

#### Scenario: Engine blocks or challenges requests
- **WHEN** an upstream engine behind SearXNG blocks, throttles, or challenges dynamic search traffic
- **THEN** the system backs off, records failure metadata, and does not attempt bypass behavior

### Requirement: Dynamic search execution metrics
The system SHALL record enough metrics for each dynamic search execution to evaluate query quality, failures, result counts, accepted jobs, rediscoveries, and throttling signals.

#### Scenario: Dynamic config finishes execution
- **WHEN** a dynamic search configuration completes a scheduled run
- **THEN** execution metadata or collection run metrics record result counts, accepted counts where available, failure state, and timing information associated with that config
