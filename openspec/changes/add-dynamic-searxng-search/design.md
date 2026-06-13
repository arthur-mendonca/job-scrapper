## Context

The current SearXNG collector supports configured query templates, so search intent is owned by backend configuration. That works for a fixed MVP search profile, but it makes ad hoc exploration slow: every new role, stack, location, or market hypothesis requires a backend edit before the scheduler can discover jobs.

Dynamic SearXNG search introduces user-defined search configurations as persisted scheduler inputs. The feature must still behave like the rest of the pipeline: collectors return raw items, repositories own persistence, normalization and scoring remain downstream, and deduplication decides job identity without caring which query found the job.

The important architectural tension is that user-defined search can easily become noisy or abusive. The design therefore treats natural-language input as an intent that must be enriched into constrained search dorks, rate-limited, jittered, and measured before it is allowed to feed the same pipeline as curated collectors.

```
DynamicSearchConfig
        │
        ▼
Eligibility + cadence gate
        │
        ▼
Natural input -> dork enrichment -> SearXNG request
        │
        ▼
RawJobItem(discoveredVia=dynamic-searxng, metadata.configId)
        │
        ▼
Normalize -> deduplicate -> score -> persist -> notify/report
```

## Goals / Non-Goals

**Goals:**

- Persist dynamic user-defined SearXNG search configurations with query intent, target engines, cadence, active state, safety controls, and execution metadata.
- Convert simple user inputs into higher-quality search dorks before calling SearXNG.
- Allow the scheduler to pick up active dynamic configurations without requiring code changes.
- Distinguish dynamic SearXNG discoveries from predefined SearXNG searches, ATS collectors, job board collectors, HTML scraping, and email-alert ingestion.
- Protect the SearXNG instance and upstream search engines with cadence validation, per-config throttling, jitter, and overlap prevention.
- Ensure deduplication ignores the dynamic search configuration and query text when deciding job uniqueness.

**Non-Goals:**

- No implementation code, generated Prisma client changes, or Prisma migrations are part of this proposal.
- No authenticated scraping, cookies, CAPTCHA bypass, stealth automation, or private search-engine APIs.
- No frontend dashboard is required, though the data model should support future API/dashboard management.
- No machine-learning query generator is required for the MVP; enrichment can be deterministic and rule based.
- No replacement of predefined SearXNG query templates; dynamic search runs alongside them.

## Decisions

### Persist dynamic search configuration as a first-class model

Add a `DynamicSearchConfig` model or equivalent persisted record managed through repositories. It should include:

- `id`, `label`, `queryText`, `normalizedQueryText`
- `targetEngines` as an explicit list or JSON array accepted by SearXNG
- `cadence` fields such as `cronExpression` or `intervalMinutes`
- `isActive`
- dork/enrichment settings such as target sites, excluded terms, required remote terms, max results, and locale/language when supported
- execution metadata such as `lastRunAt`, `nextRunAt`, `lastSuccessAt`, `lastFailureAt`, `failureCount`, `lastError`, and audit timestamps

Rationale: dynamic search is operational state, not environment configuration. Persisting it allows the scheduler, API, future dashboard, and reports to share the same source of truth.

Alternative considered: store dynamic queries in a YAML file. That would be simpler, but it cannot reliably support per-query execution metadata, API edits, active/inactive toggles, or safe scheduler coordination.

### Use explicit job provenance instead of a boolean

Persist dynamic discoveries using a clear provenance value such as `discoveredVia = "dynamic-searxng"` plus source metadata that can reference the dynamic configuration ID in event metadata or raw payload metadata. If the implementation later introduces an enum, the enum must include dynamic SearXNG as a distinct value.

Rationale: a boolean such as `isDynamicSearch` answers only one question and becomes awkward as more discovery modes appear. The existing `Job.discoveredVia` field already models provenance and is indexed, so the spec should formalize it rather than create redundant state.

Alternative considered: add only `isDynamicSearch`. This is acceptable only as a compatibility bridge if the implementation cannot safely use `discoveredVia`, but the target design is explicit multi-source provenance.

### Keep query enrichment deterministic for the MVP

Dynamic input should pass through a query-enrichment service that turns natural language into one or more dorked queries. The MVP should use deterministic rules and templates:

- preserve meaningful role and stack terms
- add remote-work terms such as `remote`, `LATAM`, `Americas`, `worldwide`, `contract`, or `USD` when relevant
- target high-signal job-board and ATS domains with `site:` operators
- exclude noisy pages with negative terms such as `-internship`, `-senior` when the intent is mid-level, `-onsite`, `-hybrid`, `-course`, `-bootcamp`, `-resume`, and `-template`
- add title/URL hints such as `intitle:jobs`, `intitle:careers`, `inurl:jobs`, or `inurl:careers` where supported by selected engines

Rationale: deterministic enrichment is inspectable, testable, cheap, and safer than sending arbitrary user text directly to SearXNG.

Alternative considered: use an LLM to generate dorks. That may be useful later, but it adds cost, latency, unpredictability, and prompt-safety concerns before the underlying behavior has metrics.

### Scheduler owns cadence, jitter, and concurrency controls

The scheduler should load active dynamic configs, determine eligibility from each config's cadence and execution metadata, and enqueue eligible searches subject to strict controls:

- validate cron expressions or intervals before scheduling
- enforce a minimum interval floor
- apply randomized jitter before each query
- limit concurrent dynamic SearXNG requests
- prevent the same config from overlapping with itself
- cap requests per worker cycle and per time window
- apply backoff after failures or upstream throttling signals

Rationale: protecting SearXNG and upstream search engines is a runtime orchestration concern. A collector should not sleep unpredictably or coordinate global rate limits by itself.

Alternative considered: put all delays inside the collector. That would hide scheduling behavior, complicate graceful shutdown, and make global limits difficult to enforce.

### Deduplicate by job identity, not discovery path

Dynamic search metadata can be recorded for observability, but duplicate matching must use canonical URL first and normalized title plus normalized company second. The dynamic query text, config ID, enriched dork, and SearXNG engine must not be part of uniqueness.

Rationale: the same job can be found by many dynamic terms, a predefined SearXNG query, and a direct job-board collector. Treating query provenance as identity would create duplicates and duplicate notifications.

Alternative considered: maintain a unique key per dynamic query. That helps query analytics but harms the job database. Query analytics should live in run metrics or events, not job identity.

## Risks / Trade-offs

- User-defined queries can generate noisy results -> Mitigation: require dork enrichment, domain targeting, excluded terms, max result limits, and query-quality metrics.
- Search engines behind SearXNG may throttle or challenge the instance -> Mitigation: enforce minimum cadence, jitter, concurrency limits, per-window caps, and backoff on failure or throttling.
- Dynamic configs may grow into an unbounded scheduler workload -> Mitigation: active-config limits, per-cycle execution caps, and disabled-by-default behavior for invalid or failing configs.
- Provenance metadata could fragment reporting -> Mitigation: use a stable discovery vocabulary, with dynamic SearXNG as one explicit value.
- Natural-language enrichment may over-constrain searches and miss valid jobs -> Mitigation: preserve raw input, store generated dorks for observability, and allow target/excluded term tuning per config.
- Existing jobs discovered by dynamic search may not show dynamic provenance if they were first discovered elsewhere -> Mitigation: record rediscovery events or run metrics with dynamic config metadata while preserving the original job identity.

## Migration Plan

1. Add a future Prisma schema change for `DynamicSearchConfig` and an explicit dynamic SearXNG job provenance value. Generate a migration in the implementation change, not in this proposal.
2. Add repository methods for creating, updating, listing active configs, marking execution start/success/failure, and storing execution metadata.
3. Add query enrichment and validation before SearXNG request construction.
4. Extend scheduler orchestration to select eligible dynamic configs and execute them with jitter, caps, and overlap prevention.
5. Extend SearXNG raw item metadata so downstream stages can persist `discoveredVia = "dynamic-searxng"` and record config/run context without affecting deduplication.
6. Add focused tests for enrichment, cadence eligibility, jitter bounds, provenance, and deduplication across multiple dynamic queries.
7. Rollback by deactivating all dynamic configs and disabling the dynamic scheduler path; existing jobs remain valid because dynamic provenance is only metadata.

## Open Questions

- Should dynamic configs be managed initially through seed/admin scripts, CLI commands, or private API endpoints?
- Should both `cronExpression` and `intervalMinutes` be supported at launch, or should the MVP choose one to reduce validation complexity?
- What minimum interval and per-cycle cap should be the initial production defaults for the VPS-hosted SearXNG instance?
- Should generated dorks be persisted per run for auditability, or only logged and summarized in source metrics?
