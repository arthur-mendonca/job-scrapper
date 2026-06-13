## MODIFIED Requirements

### Requirement: Worker scheduling mode
The system SHALL provide a worker mode that keeps the process alive and schedules collection using the configured cron expression while also evaluating active dynamic SearXNG search configurations according to their own validated cadence controls.

#### Scenario: Worker starts
- **WHEN** the worker command starts with a valid cron expression
- **THEN** it schedules future collection cycles and logs scheduling state

#### Scenario: Active dynamic configs are scheduled
- **WHEN** worker mode evaluates active dynamic SearXNG configurations
- **THEN** only configurations whose cadence makes them due are selected for execution

#### Scenario: Dynamic config is not due
- **WHEN** an active dynamic SearXNG configuration has not reached its next eligible execution time
- **THEN** the scheduler skips that configuration and leaves its execution metadata unchanged except for safe observability logs

## ADDED Requirements

### Requirement: Dynamic search cadence validation
The scheduler SHALL validate dynamic search cadence values before executing a configuration and MUST reject invalid cron expressions, invalid intervals, or cadences below the configured minimum interval.

#### Scenario: Dynamic cron is invalid
- **WHEN** an active dynamic search configuration contains an invalid cron expression
- **THEN** the scheduler marks or reports the configuration as invalid and does not execute it

#### Scenario: Dynamic interval is too frequent
- **WHEN** an active dynamic search configuration requests an interval below the configured minimum
- **THEN** the scheduler refuses to execute that configuration at the unsafe cadence

### Requirement: Dynamic search jitter
The scheduler SHALL apply artificial randomized jitter before dynamic SearXNG requests so configurations do not repeatedly hit SearXNG or upstream engines at predictable times.

#### Scenario: Dynamic query is due
- **WHEN** a dynamic SearXNG configuration becomes eligible for execution
- **THEN** the scheduler delays execution by a random duration within configured jitter bounds before making the SearXNG request

### Requirement: Dynamic search rate limits
The scheduler SHALL enforce per-config and global dynamic SearXNG rate limits, including concurrency caps, per-cycle caps, and backoff after failures or throttling signals.

#### Scenario: Dynamic concurrency limit is reached
- **WHEN** the maximum number of concurrent dynamic SearXNG executions is already running
- **THEN** additional due dynamic configurations wait or are skipped according to configured scheduler policy

#### Scenario: Upstream throttling is detected
- **WHEN** SearXNG or an upstream engine returns throttling, blocking, or CAPTCHA-like failure signals
- **THEN** the scheduler applies backoff and records failure metadata instead of immediately retrying

### Requirement: Dynamic search overlap prevention
The scheduler SHALL prevent overlapping execution of the same dynamic search configuration within a worker process.

#### Scenario: Previous dynamic config run is active
- **WHEN** a dynamic configuration becomes due while a previous execution for the same configuration is still running
- **THEN** the scheduler skips or defers the new execution and logs the overlap prevention decision
