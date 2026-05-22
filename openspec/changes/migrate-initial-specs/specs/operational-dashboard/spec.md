## ADDED Requirements

### Requirement: Operational dashboard phase
The post-MVP system SHALL provide an operational dashboard for viewing collection activity, job volume, source quality, scores, and errors.

#### Scenario: Daily collection view is opened
- **WHEN** the user opens the dashboard
- **THEN** they can see counts for collected jobs, new jobs, rediscovered jobs, discarded duplicates, notified jobs, above-threshold jobs, source breakdowns, average score, and collector errors where data exists

### Requirement: Job curation table
The post-MVP dashboard SHALL provide a job curation table using persisted job fields including title, company, source, collector, discovered path, location, remote type, salary, seniority, stack tags, score, source trust score, status, match reasons, risk flags, recommended action, and last seen time.

#### Scenario: User filters jobs
- **WHEN** the user filters by score, source, stack, status, date, or risk
- **THEN** the table shows only matching persisted jobs

### Requirement: Job detail view
The post-MVP dashboard SHALL provide a job detail view with source links, normalized data, description, requirements, scoring explanation, risk flags, status, and event history.

#### Scenario: User inspects one job
- **WHEN** the user opens a job detail page
- **THEN** the page shows enough information to decide whether to save, discard, apply, or request AI analysis

### Requirement: Job status actions
The post-MVP dashboard SHALL support operational actions such as save, discard, mark applied, open original link, and select jobs for AI review.

#### Scenario: User marks job as discarded
- **WHEN** the user discards a job from the dashboard
- **THEN** the persisted status changes so the job no longer appears in active review lists by default

### Requirement: Source management
The post-MVP dashboard SHALL allow the user to view and manage source configuration such as enabled state, source type, access mode, base URL, source trust score, rate limit, latest execution, useful job counts, errors, and average quality.

#### Scenario: User disables noisy source
- **WHEN** the user disables a source
- **THEN** future collection cycles do not run that source

### Requirement: SearXNG query management
The post-MVP dashboard SHALL allow the user to edit, enable, disable, test, and evaluate SearXNG queries independently from the full scraper cycle.

#### Scenario: User tests one query
- **WHEN** the user runs a SearXNG query test
- **THEN** the system shows raw results and quality indicators such as useful jobs, duplicates, score average, and frequent domains where available
