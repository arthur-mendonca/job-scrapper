## MODIFIED Requirements

### Requirement: Scoring uses structured geo/location restrictions
When structured geo/location restriction signals are available on a normalized job, scoring SHALL use them for risk flags and penalties.

#### Scenario: Structured US-only restriction exists
- **WHEN** a normalized job includes a structured US-only restriction signal
- **THEN** scoring adds an explicit `us-only` risk flag and applies the corresponding penalty

#### Scenario: Structured restrictions are absent
- **WHEN** a normalized job has no structured restriction signals
- **THEN** scoring MAY use text-based heuristics to detect restrictions as a fallback
