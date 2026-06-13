## MODIFIED Requirements

### Requirement: SearXNG query management
The post-MVP dashboard SHALL allow the user to create, edit, enable, disable, remove or archive, test, and evaluate predefined and dynamic SearXNG queries independently from the full scraper cycle.

#### Scenario: User tests one query
- **WHEN** the user runs a SearXNG query test
- **THEN** the system shows raw results and quality indicators such as useful jobs, duplicates, score average, and frequent domains where available

#### Scenario: User saves dynamic search terms
- **WHEN** the user defines search terms, target engines, cadence, active state, and enrichment controls in the dashboard
- **THEN** the dashboard saves them through the private dynamic search API so future worker cron runs can use them

#### Scenario: User previews dynamic search results
- **WHEN** the user runs a test search from the dashboard before saving or while editing a dynamic config
- **THEN** the dashboard shows the generated dork, raw SearXNG preview results, result domains, and quality hints without creating persisted jobs
