## Why

SearXNG collection currently depends on predefined backend query templates, which means new search intents require code or configuration changes before the scheduler can discover matching remote jobs. Dynamic SearXNG search will let user-defined search intents become first-class scheduled collection inputs while preserving the pipeline's anti-abuse, normalization, deduplication, and persistence boundaries.

## What Changes

- Add a persistent dynamic search configuration model for user-defined search terms, target SearXNG engines, cadence, active/inactive state, execution metadata, and quality controls.
- Extend the SearXNG collection flow so active dynamic search configurations are loaded by the scheduler and converted into executable SearXNG queries.
- Require query enrichment that transforms simple natural-language inputs into constrained search operators and job-board-oriented dorks before calling SearXNG.
- Add strict dynamic-search cadence controls, overlap prevention, per-query rate limits, and artificial jitter to reduce IP blocking and CAPTCHA pressure from engines behind SearXNG.
- Update persisted job provenance so jobs discovered by dynamic SearXNG terms are explicitly distinguishable from traditional HTML scraping, public job board collectors, ATS collectors, email alerts, and predefined SearXNG collectors.
- Tighten deduplication requirements so job uniqueness is based on canonical job URL or normalized title/company identity and never on the dynamic query that discovered the job.

## Capabilities

### New Capabilities

- `dynamic-searxng-search`: Covers persisted user-defined SearXNG search configurations, dork enrichment, dynamic result collection, provenance, cadence controls, and operational safeguards.

### Modified Capabilities

- `source-collection`: SearXNG collection must support dynamic user-defined terms in addition to predefined templates.
- `scheduler-runtime`: Scheduler behavior must include per-config cadence, rate limiting, jitter, and overlap prevention for dynamic SearXNG search.
- `job-persistence`: Persisted job records must explicitly distinguish dynamic SearXNG discoveries from other collection sources, and persistence must support dynamic search configuration records.
- `job-deduplication`: Duplicate matching must ignore the dynamic query that caused discovery and use canonical job identity only.

## Impact

- Prisma schema and future migration planning for a `DynamicSearchConfig` model or equivalent, plus a job provenance field/value such as `discoveredVia = "dynamic-searxng"` or an equivalent explicit enum-backed representation.
- Repository layer additions for dynamic search configuration CRUD, active config loading, execution metadata updates, and provenance-aware job persistence.
- SearXNG collector and query-building modules for natural-language query enrichment, dork templates, engine selection, and safe request construction.
- Scheduler and worker orchestration for active dynamic configs, cadence eligibility, randomized delays, concurrency limits, and operational logging.
- Deduplication service tests and behavior updates to ensure dynamic query IDs, labels, or terms never form part of job uniqueness.
- Operational docs for safe use, cadence recommendations, query-quality tuning, and anti-abuse constraints.
