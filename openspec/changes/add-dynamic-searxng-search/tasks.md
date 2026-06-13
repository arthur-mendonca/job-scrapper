## 1. Data Model and Persistence

- [ ] 1.1 Add a future Prisma model for `DynamicSearchConfig` with query text, normalized query text, target engines, cadence, active state, enrichment controls, result limits, execution metadata, and audit timestamps.
- [ ] 1.2 Add or formalize explicit job discovery provenance for dynamic SearXNG, preferably through `Job.discoveredVia = "dynamic-searxng"` or an equivalent enum-backed value.
- [ ] 1.3 Add repository methods for creating, updating, activating, deactivating, listing due active configs, and updating dynamic search execution metadata.
- [ ] 1.4 Add persistence support for recording dynamic search execution metrics in collection run source metrics or job events without making query metadata part of job identity.

## 2. Query Validation and Enrichment

- [ ] 2.1 Define Zod schemas or equivalent validation for dynamic search config inputs, target engines, cadence fields, result limits, and enrichment controls.
- [ ] 2.2 Implement deterministic natural-language query normalization that preserves the original user input and derives normalized role, stack, location, market, and exclusion tokens.
- [ ] 2.3 Implement dork generation for target job boards, ATS domains, remote-work terms, title/URL hints, required terms, excluded terms, locale/language controls where supported, and maximum result limits.
- [ ] 2.4 Add tests covering representative dork enrichment cases, noise exclusions, target site constraints, invalid config rejection, and generated-query auditability.

## 3. Dynamic SearXNG Collection

- [ ] 3.1 Extend the SearXNG collection path to accept enriched dynamic search requests alongside predefined backend query templates.
- [ ] 3.2 Ensure dynamic SearXNG raw items include explicit dynamic discovery provenance and metadata for dynamic config ID, original query, generated dork, target engines, and execution context.
- [ ] 3.3 Ensure dynamic collection uses only the public SearXNG HTTP search API and does not introduce login, cookies, CAPTCHA bypass, private APIs, or stealth automation.
- [ ] 3.4 Add tests or fixtures proving SearXNG dynamic results are emitted as raw job-like items without persistence, scoring, or notification side effects inside the collector.

## 4. Scheduler Controls

- [ ] 4.1 Implement dynamic config cadence eligibility for cron expressions or intervals, including validation and a configurable minimum cadence floor.
- [ ] 4.2 Add artificial randomized jitter within configured bounds before dynamic SearXNG requests execute.
- [ ] 4.3 Add per-config and global dynamic search rate limits, including concurrency caps, per-cycle caps, and per-window caps where applicable.
- [ ] 4.4 Add overlap prevention so the same dynamic config cannot run concurrently within one worker process.
- [ ] 4.5 Add backoff and failure metadata updates for throttling, blocking, CAPTCHA-like responses, request failures, and repeated errors.
- [ ] 4.6 Add scheduler tests for due/not-due configs, invalid cadence, jitter bounds, concurrency limits, overlap prevention, and backoff behavior.

## 5. Deduplication and Provenance

- [ ] 5.1 Update deduplication tests to verify dynamic config ID, user query text, generated dork, engine, and discovery path are ignored when determining uniqueness.
- [ ] 5.2 Verify duplicate matching still uses canonical URL first, normalized title plus company second, and content hash third for dynamic and non-dynamic sources.
- [ ] 5.3 Ensure rediscovery metadata is updated when the same job is found by multiple dynamic queries or by both dynamic and traditional collectors.
- [ ] 5.4 Ensure notification idempotency still treats rediscovered dynamic jobs as existing jobs rather than newly notifiable opportunities.

## 6. Operations and Documentation

- [ ] 6.1 Document safe dynamic search defaults, including minimum cadence, jitter range, concurrency caps, result limits, and recommended target engines.
- [ ] 6.2 Document query-quality guidance with examples of simple user inputs and generated dork patterns.
- [ ] 6.3 Document operational behavior for invalid configs, disabled configs, throttling, backoff, and failure-count handling.
- [ ] 6.4 Update setup or API documentation for whichever management surface is chosen for dynamic configs, such as private API, CLI, or seed/admin script.

## 7. Verification

- [ ] 7.1 Run type checks and relevant unit tests for query enrichment, scheduler cadence, SearXNG collection, persistence repositories, and deduplication.
- [ ] 7.2 Run a controlled one-shot dynamic search against a local or approved SearXNG instance with conservative limits and verify raw items enter the normal pipeline.
- [ ] 7.3 Verify collection run metrics and logs expose dynamic search execution outcomes without logging secrets or excessive query payloads.
- [ ] 7.4 Verify existing predefined SearXNG, ATS, job board, HTML, and email-alert collectors continue to work unchanged.
