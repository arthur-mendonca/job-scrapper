## ADDED Requirements

### Requirement: Dynamic search config API
The API SHALL expose private dynamic search configuration endpoints that allow trusted clients to list, create, read, update, activate, deactivate, and remove or archive user-defined SearXNG search-term sets.

#### Scenario: User creates scheduled search terms
- **WHEN** a trusted API client submits valid search terms, target engines, cadence, active state, and enrichment controls
- **THEN** the API persists a dynamic search configuration that the worker scheduler can use during future cron-driven collection runs

#### Scenario: User disables scheduled search terms
- **WHEN** a trusted API client deactivates a dynamic search configuration
- **THEN** the configuration remains visible for management but is not eligible for automated scheduler execution

### Requirement: Dynamic search config validation
The API SHALL validate dynamic search configuration requests with Zod-backed schemas before persistence, including query text, target engines, cron or interval cadence, max results, locale, target sites, required terms, excluded terms, and active state.

#### Scenario: Invalid cadence is submitted
- **WHEN** a trusted API client submits an invalid cron expression or an interval below the configured minimum
- **THEN** the API rejects the request with a validation error and does not persist the invalid configuration

#### Scenario: Max results exceeds limit
- **WHEN** a trusted API client submits a max result value above the allowed preview or scheduled-search limit
- **THEN** the API rejects or clamps the value according to the documented API contract

### Requirement: Dynamic search test endpoint
The API SHALL expose a private test-search endpoint where trusted clients can submit unsaved search terms and optional enrichment controls to preview SearXNG results.

#### Scenario: User tests unsaved search terms
- **WHEN** a trusted API client submits search terms to the test-search endpoint
- **THEN** the API enriches the terms into a dork, calls SearXNG with bounded limits, and returns preview results without creating jobs, collection runs, job events, or notifications

#### Scenario: User tests saved config terms
- **WHEN** a trusted API client requests a test search for an existing dynamic search configuration
- **THEN** the API uses the saved configuration values unless request overrides are explicitly supported and valid

### Requirement: Test-search response contract
The test-search response SHALL include the original query, generated dork, selected engines, effective locale and result limit, execution timestamp, normalized error state where applicable, and raw preview result summaries including title, URL, content snippet, engine, published date, inferred source or domain where available, and quality hints.

#### Scenario: SearXNG returns results
- **WHEN** SearXNG returns preview results for a test search
- **THEN** the API response includes enough raw result information for the frontend user to refine search terms and filters

#### Scenario: SearXNG fails
- **WHEN** SearXNG is unavailable, throttled, times out, or returns an invalid response
- **THEN** the API returns a normalized failure response that does not expose secrets or raw internal stack traces

### Requirement: Preview search has no persistence side effects
The test-search endpoint MUST NOT persist preview results as jobs, update job deduplication state, send notifications, or mark dynamic configurations as successful scheduled executions.

#### Scenario: Preview finds a valid-looking job
- **WHEN** the test-search endpoint returns a result that looks like a job
- **THEN** the result is returned only as preview data and is not persisted into the job pipeline

### Requirement: Dynamic search API uses repository boundaries
Dynamic search API route handlers SHALL use service or repository boundaries for config persistence and MUST NOT duplicate scheduler persistence logic or call unrelated pipeline internals directly.

#### Scenario: Config is updated through API
- **WHEN** a trusted API client updates a dynamic search configuration
- **THEN** route handling validates the request and delegates persistence to the dynamic search service or repository boundary

### Requirement: Dynamic search API observability
The API SHALL emit safe structured logs and metrics for config changes and test-search executions without logging secrets, excessive raw result payloads, or internal API credentials.

#### Scenario: Test search is executed
- **WHEN** a trusted client runs a test search
- **THEN** logs include safe context such as result count, engines, timing, and config ID when applicable, without exposing sensitive configuration or raw large payloads
