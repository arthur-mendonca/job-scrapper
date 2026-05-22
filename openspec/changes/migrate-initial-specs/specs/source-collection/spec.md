## ADDED Requirements

### Requirement: Configurable source registry
The system SHALL load enabled sources from configuration and instantiate collectors through a registry rather than hardcoding all sources inside collection code.

#### Scenario: Disabled source is present
- **WHEN** the source configuration contains a source with `enabled` set to false
- **THEN** the collector registry does not run that source during a collection cycle

### Requirement: Common collector contract
Each collector SHALL implement a common job collector contract and return raw job-like items with source, URL, title, company, location, salary, description, requirements, posted date, and raw payload when available.

#### Scenario: Collector succeeds
- **WHEN** a configured collector completes successfully
- **THEN** it returns raw items without performing persistence, final scoring, or notification side effects

### Requirement: Source failures are isolated
The collection layer SHALL handle individual source failures gracefully and continue the cycle for remaining sources unless an unrecoverable system error occurs.

#### Scenario: One source fails
- **WHEN** one collector throws a request or parsing error
- **THEN** the failure is logged with source context and other enabled collectors continue running

### Requirement: SearXNG collection
The system SHALL support a SearXNG collector that queries `SEARXNG_BASE_URL` through the HTTP search API using configurable query templates.

#### Scenario: Search results are collected
- **WHEN** a SearXNG query returns results
- **THEN** the collector records them as raw job-like items without assuming every result is a valid job

### Requirement: Public ATS collection
The system SHALL support public ATS collection for Greenhouse, Lever, Ashby, and Workable using configured company career pages and public endpoints or pages only.

#### Scenario: ATS company page is configured
- **WHEN** a company has a supported public ATS page in configuration
- **THEN** the corresponding collector attempts collection without login, cookies, private API credentials, or anti-bot bypass

### Requirement: Public job board collection
The system SHALL support public job board sources such as Remote OK, We Work Remotely, Remotive, Himalayas, Get on Board, or similar accessible sources.

#### Scenario: Public endpoint is available
- **WHEN** a job board exposes a public API or RSS feed
- **THEN** the collector prefers that source over brittle HTML scraping

### Requirement: Local email alert collection
The system SHALL support collecting job alert data from local `.txt` and `.html` files in a configurable mounted input directory.

#### Scenario: Email alert file is found
- **WHEN** the email alert collector reads a supported file
- **THEN** it extracts available title, company, URL, location, description, and source information without connecting to an email account
