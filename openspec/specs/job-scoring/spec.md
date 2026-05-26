# job-scoring Specification

## Purpose
TBD - created by archiving change migrate-initial-specs. Update Purpose after archive.
## Requirements
### Requirement: Target candidate profile
The scoring system SHALL evaluate jobs against a backend-leaning full stack profile focused on TypeScript, Node.js, NestJS, React/Next.js, AWS, Docker, CI/CD, PostgreSQL, AI/LLM automation, remote international work, LATAM compatibility, USD compensation, and contract or full-time roles open to international candidates.

#### Scenario: Job matches target stack and market
- **WHEN** a job is remote LATAM-friendly and emphasizes TypeScript, Node.js, React, AWS, and PostgreSQL
- **THEN** scoring adds positive match reasons for stack and market fit

### Requirement: Score output contract
The scoring service SHALL return a score from 0 to 100, match reasons, risk flags, and a recommended action for each normalized job.

#### Scenario: Job is scored
- **WHEN** a normalized job is passed to the scoring service
- **THEN** the result includes numeric score, explicit reasons, explicit risks, and one recommended action

### Requirement: Positive scoring signals
The scoring system SHALL add value for target technologies, backend-leaning full stack language, remote compatibility, LATAM/Americas/worldwide availability, USD or clear compensation, contract/B2B compatibility, clear company identity, and realistic requirements.

#### Scenario: Strong positive signals exist
- **WHEN** a job contains multiple target technologies and clear remote LATAM compatibility
- **THEN** the score increases and the reasons explain those signals

### Requirement: Negative scoring signals
The scoring system SHALL penalize or flag 7+ years requirements, staff/principal-only roles, onsite or hybrid roles, US-only restrictions, vague companies, unpaid or long test projects, primary Python/Java/.NET/PHP stacks, unclear compensation combined with other risk signals, generic descriptions, unclear location restrictions, and unrealistic requirements.

#### Scenario: Job is US-only and principal-level
- **WHEN** a job is remote US-only and explicitly principal-level
- **THEN** the score is heavily penalized and risk flags identify location and seniority mismatch

### Requirement: Source trust adjustment
The scoring system SHALL keep source trust separate from technical fit and adjust final ranking based on configured source trust score.

#### Scenario: Indirect low-trust source finds a good-looking job
- **WHEN** a technically strong job comes from a low-trust indirect source
- **THEN** the final result records the technical match while applying the configured source trust penalty or risk signal

### Requirement: Recommended action vocabulary
The scoring service SHALL recommend actions using explicit user-facing guidance such as applying through the company website, applying and contacting a recruiter, saving for manual review, ignoring unless compensation is confirmed, or ignoring due to location or seniority mismatch.

#### Scenario: Job has high fit and recruiter signal
- **WHEN** a job has high score and recruiter information is available
- **THEN** the recommended action tells the user to apply and contact the recruiter if appropriate

### Requirement: Scoring uses structured geo/location restrictions
When structured geo/location restriction signals are available on a normalized job, scoring SHALL use them for risk flags and penalties.

#### Scenario: Structured US-only restriction exists
- **WHEN** a normalized job includes a structured US-only restriction signal
- **THEN** scoring adds an explicit `us-only` risk flag and applies the corresponding penalty

#### Scenario: Structured restrictions are absent
- **WHEN** a normalized job has no structured restriction signals
- **THEN** scoring MAY use text-based heuristics to detect restrictions as a fallback

