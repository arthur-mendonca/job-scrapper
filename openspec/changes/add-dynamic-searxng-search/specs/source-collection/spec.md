## MODIFIED Requirements

### Requirement: SearXNG collection
The system SHALL support a SearXNG collector that queries `SEARXNG_BASE_URL` through the HTTP search API using configurable predefined query templates and eligible dynamic user-defined search configurations.

#### Scenario: Search results are collected
- **WHEN** a SearXNG query returns results
- **THEN** the collector records them as raw job-like items without assuming every result is a valid job

#### Scenario: Dynamic search results are collected
- **WHEN** an active dynamic search configuration is eligible for execution and returns SearXNG results
- **THEN** the collector records them as raw job-like items with explicit dynamic SearXNG provenance and dynamic configuration metadata

#### Scenario: Dynamic query is enriched before collection
- **WHEN** a user-defined dynamic search term is selected for execution
- **THEN** the backend transforms it into one or more constrained dork queries before sending requests to SearXNG

#### Scenario: Dynamic collection uses public search only
- **WHEN** dynamic SearXNG collection executes
- **THEN** it uses the public SearXNG HTTP search API without login, cookies, CAPTCHA bypass, private APIs, or stealth automation
