# Dynamic SearXNG Search

Dynamic SearXNG search allows user-defined search configurations to become scheduled pipeline inputs alongside predefined query templates. Each configuration defines a search intent that is enriched into constrained dork queries before being sent to SearXNG.

## Overview

```
DynamicSearchConfig (DB)
        │
        ▼
Scheduler cadence check
        │
        ▼
Query enrichment → dork generation
        │
        ▼
SearXNG HTTP API request
        │
        ▼
RawJobItem(discoveredVia="dynamic-searxng")
        │
        ▼
Normalize → deduplicate → score → persist → notify
```

## Safe Defaults

| Setting | Default | Env Variable |
|---------|---------|-------------|
| Enabled | `true` | `DYNAMIC_SEARCH_ENABLED` |
| Minimum interval | 60 minutes | `DYNAMIC_SEARCH_MIN_INTERVAL_MINUTES` |
| Max configs per cycle | 5 | `DYNAMIC_SEARCH_MAX_PER_CYCLE` |
| Max concurrent | 2 | `DYNAMIC_SEARCH_MAX_CONCURRENT` |
| Jitter range | 0–30 seconds | `DYNAMIC_SEARCH_JITTER_MAX_MS` |
| Rate limit between requests | 3 seconds | `DYNAMIC_SEARCH_RATE_LIMIT_MS` |
| Default result limit | 30 | Config `maxResults` field |
| Default engines | google, bing, duckduckgo | Config `targetEngines` field |

## Creating Dynamic Search Configs

Dynamic search configs are managed through Prisma Studio or seed scripts. Each config requires:

```typescript
{
  label: "Node.js LATAM Remote",           // Human-readable label
  queryText: "node react remote latam",     // User search intent
  normalizedQueryText: "node react remote latam",
  targetEngines: ["google", "bing"],        // SearXNG engines
  intervalMinutes: 360,                     // Run every 6 hours
  isActive: true,
  
  // Optional enrichment controls
  targetSites: ["greenhouse.io", "lever.co"],
  excludedTerms: ["internship", "senior"],
  requiredTerms: ["TypeScript"],
  locale: "en-US",
  maxResults: 30
}
```

## Query Enrichment

User-defined search terms are transformed into constrained SearXNG dorks. The enrichment is deterministic and inspectable.

### Examples

**Simple role query:**
```
Input:  "node react developer"
Output: "node react developer (remote OR LATAM OR Americas OR worldwide) (intitle:jobs OR intitle:careers) -internship -course -bootcamp -resume -template -onsite -hybrid"
```

**With target sites:**
```
Input:  "typescript backend" + targetSites: ["greenhouse.io", "lever.co"]
Output: "typescript backend (remote OR LATAM OR Americas OR worldwide) (site:greenhouse.io OR site:lever.co) (intitle:jobs OR intitle:careers) -internship -course -bootcamp -resume -template -onsite -hybrid"
```

**With custom exclusions:**
```
Input:  "fullstack engineer" + excludedTerms: ["senior", "lead", "principal"]
Output: "fullstack engineer (remote OR LATAM OR Americas OR worldwide) (intitle:jobs OR intitle:careers) -senior -lead -principal"
```

### Enrichment Rules

1. **Preserve original terms** — role, stack, location terms from `queryText` are kept as-is
2. **Remote-work terms** — added automatically if none present: `remote`, `LATAM`, `Americas`, `worldwide`
3. **Site operators** — `site:domain.com` for each entry in `targetSites`
4. **Title/URL hints** — `intitle:jobs`, `intitle:careers` to target job pages
5. **Negative filters** — `-term` for each excluded term (defaults: internship, course, bootcamp, resume, template, onsite, hybrid)
6. **Required terms** — quoted terms that must appear in results

## Operational Behavior

### Cadence and Scheduling

- Configs are evaluated after each main collection cycle
- Only configs where `nextRunAt <= now` (or `nextRunAt` is null) are eligible
- Per-cycle cap limits how many configs run per cycle
- Randomized jitter prevents predictable request patterns

### Throttling and Backoff

When failures occur:
1. `failureCount` is incremented
2. `lastError` is recorded
3. `nextRunAt` is pushed forward with exponential backoff: `interval × 2^failureCount` (capped at 24 hours)
4. HTTP 429, "too many requests", and CAPTCHA-like errors trigger the same backoff

On success, `failureCount` resets to 0 and `nextRunAt` is computed normally.

### Invalid Configs

- Configs with `intervalMinutes` below the minimum are skipped
- Configs with `isActive: false` are never loaded
- Overlap prevention skips configs that are already running

### Disabling Dynamic Search

Set `DYNAMIC_SEARCH_ENABLED=false` to disable all dynamic search execution. Existing configs and jobs remain valid.

## Provenance

Jobs discovered through dynamic search carry explicit provenance:
- `discoveredVia: "dynamic-searxng"` on persisted job records
- Raw item metadata includes `configId`, `originalQuery`, `generatedDork`, `targetEngines`, and `engine`
- Deduplication ignores all dynamic metadata — uniqueness is based on canonical URL, normalized title+company, or content hash

## Anti-Abuse

Dynamic SearXNG search:
- Uses only the public SearXNG HTTP search API
- Does NOT use login, cookies, CAPTCHA bypass, private APIs, or stealth automation
- Enforces minimum intervals, jitter, concurrency limits, and backoff
- Backs off on throttling signals rather than retrying
