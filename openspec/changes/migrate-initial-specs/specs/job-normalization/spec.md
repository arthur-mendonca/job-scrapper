## ADDED Requirements

### Requirement: Raw items become normalized jobs
The normalizer SHALL convert valid raw job items into normalized jobs with canonical URL, normalized title, company name, location, remote type, salary, currency, seniority, description, requirements, stack tags, posted date, and content hash.

#### Scenario: Valid raw item is normalized
- **WHEN** a raw item has at least a usable title and source URL
- **THEN** the normalizer produces a normalized job with required comparison and scoring fields populated

### Requirement: Invalid raw items are rejected safely
The normalizer SHALL reject raw items that cannot produce a usable normalized job and MUST preserve enough context for logging or diagnostics.

#### Scenario: Raw item lacks URL
- **WHEN** a raw item has no usable source URL
- **THEN** the normalizer does not emit a normalized job for that item

### Requirement: URL canonicalization
The normalizer SHALL canonicalize URLs for comparison by removing fragments and safe tracking parameters while preserving the destination identity.

#### Scenario: URL contains tracking data
- **WHEN** a source URL includes common tracking query parameters or a fragment
- **THEN** the canonical URL excludes those tracking components

### Requirement: Stack tag detection
The normalizer SHALL detect positive and lower-priority stack tags from title, description, and requirements text.

#### Scenario: Job mentions target stack
- **WHEN** a job mentions TypeScript, Node.js, NestJS, React, Next.js, AWS, Docker, CI/CD, PostgreSQL, REST APIs, AI, LLM, or automation
- **THEN** the matching stack tags are included in the normalized job

### Requirement: Remote compatibility detection
The normalizer SHALL classify remote type as `remote`, `hybrid`, `onsite`, or `unknown` and preserve location restrictions such as LATAM, Americas, worldwide, US-only, Europe-only, or country-only language when available.

#### Scenario: Job is US-only remote
- **WHEN** a job text says it is remote but limited to the United States
- **THEN** the normalized job keeps the remote classification and exposes the US-only restriction for scoring

### Requirement: Seniority detection
The normalizer SHALL detect seniority signals including Intern, Junior, Mid-level, Intermediate, Senior, Staff, Principal, and Lead from title and description.

#### Scenario: Staff role is detected
- **WHEN** a job title contains Staff or Principal language
- **THEN** the normalized job includes that seniority signal for downstream risk scoring

### Requirement: Salary extraction
The normalizer SHALL extract salary minimum, salary maximum, and currency when the source text provides a parseable compensation range.

#### Scenario: USD salary range is present
- **WHEN** a job description includes a USD salary range
- **THEN** the normalized job includes salary bounds and USD currency where parseable
