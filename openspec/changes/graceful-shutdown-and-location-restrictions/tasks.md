## 1. Graceful Shutdown

- [ ] 1.1 Refactor the scheduler shutdown flow so it stops scheduling without calling `process.exit()` directly.
- [ ] 1.2 Track an in-flight collection cycle promise and await it during SIGINT/SIGTERM shutdown with a maximum timeout.
- [ ] 1.3 Add a focused test or verification harness to ensure shutdown does not interrupt an in-flight cycle in the common case.

## 2. Structured Geo/Location Restrictions

- [ ] 2.1 Extend normalized job types to include a structured geo/location restriction list.
- [ ] 2.2 Implement restriction extraction in the normalizer for explicit signals (US-only, Europe-only, country-only, LATAM-only).
- [ ] 2.3 Persist the restriction list on the Job model (Prisma schema + migration) and wire it through repositories.
- [ ] 2.4 Update scoring to prefer structured restrictions for risk flags/penalties and keep a text-based fallback.
- [ ] 2.5 Add/update unit tests for restriction extraction and scoring behavior.
