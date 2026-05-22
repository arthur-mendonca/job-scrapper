## Why

The project already has a substantial set of business rules, architectural decisions, and operational requirements spread across planning and documentation files under `agents/`. This change migrates that knowledge into OpenSpec base specifications so future work can be evaluated against explicit system contracts instead of informal notes.

## What Changes

- Create base OpenSpec capabilities for the job intelligence pipeline domain.
- Capture the backend-only MVP constraints, data flow, collectors, normalization, scoring, deduplication, persistence, notifications, scheduling, API surface, and deployment rules.
- Capture post-MVP evolution areas already described in the source documents, including operational dashboard, AI-assisted review, source management, professional profile data, CV generation, and lightweight application CRM.
- Preserve explicit non-goals such as authenticated LinkedIn scraping, cookie/session scraping, CAPTCHA bypass, stealth browsing, NestJS for the MVP, GitHub Actions scheduling, and frontend requirements for the original backend-only MVP.
- No runtime behavior changes are required by this migration; implementation tasks are limited to creating and validating specification artifacts.

## Capabilities

### New Capabilities

- `system-architecture`: Backend pipeline architecture, module boundaries, runtime modes, logging, Docker/VPS operation, and system-wide constraints.
- `source-collection`: Configurable job source collection from SearXNG, public ATS pages, job boards, RSS/HTML sources, and local email alert files.
- `job-normalization`: Conversion of raw source items into normalized jobs, including canonical URLs, stack tags, remote compatibility, seniority, salary, and content hashes.
- `job-scoring`: Heuristic scoring, match reasons, risk flags, recommended actions, target candidate profile, and source trust adjustment.
- `job-deduplication`: Duplicate detection and rediscovery behavior based on canonical URL, normalized title/company, and content hash.
- `job-persistence`: PostgreSQL/Prisma data model and repository responsibilities for jobs, companies, recruiters, job events, and collection runs.
- `notifications-reporting`: Telegram notifications, optional email digest, report behavior, threshold rules, and notification idempotency.
- `scheduler-runtime`: One-shot collection mode, worker scheduling, cron validation, overlap prevention, graceful shutdown, and CLI command expectations.
- `api-security`: API exposure rules, internal header authentication, private network deployment, CORS role, and Telegram-mediated health checks.
- `operational-dashboard`: Post-MVP operational UI requirements for dashboards, job curation, source/query management, and status workflows.
- `ai-review-cv-workflow`: Post-MVP AI review queue, cost controls, professional profile truth base, CV generation, and lightweight application CRM.

### Modified Capabilities

- None.

## Impact

- Adds OpenSpec artifacts under `openspec/changes/migrate-initial-specs/`.
- Establishes initial specs that can later be archived into `openspec/specs/`.
- Does not require changes to TypeScript source, Prisma migrations, Docker files, or runtime configuration.
