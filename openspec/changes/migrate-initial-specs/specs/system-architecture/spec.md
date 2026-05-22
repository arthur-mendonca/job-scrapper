## ADDED Requirements

### Requirement: Backend-only MVP
The system SHALL define the initial MVP as a backend-only TypeScript/Node.js job intelligence pipeline for personal use.

#### Scenario: MVP scope is evaluated
- **WHEN** MVP requirements are reviewed
- **THEN** the system contract excludes a frontend, NestJS, GitHub Actions scheduling, authenticated scraping, cookie-based scraping, CAPTCHA bypass, and stealth browser automation

### Requirement: Required technology stack
The system SHALL use TypeScript, Node.js, pnpm, Prisma ORM, PostgreSQL, Zod, Cheerio, Docker Compose, node-cron or equivalent container-safe scheduling, and structured logging with Pino or Winston unless explicitly changed by a later spec.

#### Scenario: Stack compliance is checked
- **WHEN** a new implementation task selects core dependencies
- **THEN** the selected dependencies match the required stack or the change explicitly documents and approves the deviation

### Requirement: Modular pipeline architecture
The system SHALL keep collection, normalization, scoring, deduplication, persistence, notification, scheduling, API, logging, and configuration in separate modules with explicit boundaries.

#### Scenario: Collector implementation is reviewed
- **WHEN** a collector returns source data
- **THEN** it does not write to the database, send notifications, or calculate final job scores

### Requirement: Typed configuration boundary
The system SHALL parse and validate environment variables through a typed configuration module and MUST NOT read `process.env` directly outside that module.

#### Scenario: Runtime configuration is loaded
- **WHEN** the application starts
- **THEN** required environment values are validated before pipeline, worker, API, or notification behavior depends on them

### Requirement: Public-source and anti-abuse constraints
The system SHALL only collect from public or configured sources and MUST NOT use credentials, session cookies, private APIs, CAPTCHA bypass, or anti-bot evasion.

#### Scenario: LinkedIn-related discovery is configured
- **WHEN** LinkedIn-related content is included as a source
- **THEN** it is limited to public search results, search-engine-indexed pages, manually provided public URLs, or exported alert email files

### Requirement: VPS Docker operation
The system SHALL be operable on a VPS through Docker Compose with an app worker container, PostgreSQL persistence, optional SearXNG support, restart policy, mounted email-alert input, and production-oriented logs.

#### Scenario: Deployment contract is checked
- **WHEN** the application is deployed through Docker Compose
- **THEN** PostgreSQL data persists in a named volume and the app can run without requiring an interactive shell
