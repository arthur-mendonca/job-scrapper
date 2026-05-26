## Why

Two documented behavioral contracts do not match the current runtime: graceful shutdown during scheduling and explicit preservation of geo/location restrictions used by scoring. Aligning implementation and specifications reduces operational surprises and improves scoring explainability.

## What Changes

- Update worker shutdown behavior so SIGINT/SIGTERM stops scheduling and allows an in-flight collection cycle to reach a safe completion point before exiting.
- Extend normalization output to extract and preserve explicit geo/location restrictions (for example US-only, Europe-only, country-only, LATAM-only) in a structured field.
- Update scoring to prefer structured restriction signals over indirect text matching.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `scheduler-runtime`: Require a graceful shutdown path that avoids abrupt process exit during an in-flight cycle.
- `job-normalization`: Require structured extraction of geo/location restriction signals for downstream scoring.
- `job-scoring`: Require scoring to incorporate structured restriction signals when available.

## Impact

- Updates scheduler behavior and possibly CLI shutdown handling.
- Updates normalized job types and persistence schema to store restriction signals.
- Adjusts scoring behavior and tests to use the structured field.
