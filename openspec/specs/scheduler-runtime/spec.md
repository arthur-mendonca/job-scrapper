# scheduler-runtime Specification

## Purpose
TBD - created by archiving change migrate-initial-specs. Update Purpose after archive.
## Requirements
### Requirement: One-shot collection mode
The system SHALL provide a one-shot collection mode that runs one complete cycle and exits cleanly.

#### Scenario: One-shot collect is executed
- **WHEN** the user runs the collect command
- **THEN** the system collects from configured sources, normalizes, deduplicates, scores, persists, notifies eligible jobs, logs the cycle, and exits

### Requirement: Worker scheduling mode
The system SHALL provide a worker mode that keeps the process alive and schedules collection using the configured cron expression.

#### Scenario: Worker starts
- **WHEN** the worker command starts with a valid cron expression
- **THEN** it schedules future collection cycles and logs scheduling state

### Requirement: Cron validation
The scheduler SHALL validate `COLLECT_CRON` at startup and fail or report configuration errors before silently running with an invalid schedule.

#### Scenario: Cron expression is invalid
- **WHEN** worker mode starts with an invalid cron expression
- **THEN** the scheduler rejects the configuration and logs a clear error

### Requirement: Overlap prevention
The scheduler SHALL prevent overlapping collection cycles within a single worker process.

#### Scenario: Previous cycle is still running
- **WHEN** the next scheduled time arrives before the previous cycle ends
- **THEN** the scheduler skips the new run and logs a warning

### Requirement: Graceful shutdown
The worker SHALL handle SIGINT and SIGTERM gracefully by stopping future scheduling and allowing any in-flight collection cycle to finish at a safe completion point before exiting.

#### Scenario: Termination signal is received during idle
- **WHEN** the worker receives SIGINT or SIGTERM while no cycle is running
- **THEN** it stops scheduling and exits cleanly

#### Scenario: Termination signal is received during a running cycle
- **WHEN** the worker receives SIGINT or SIGTERM while a cycle is running
- **THEN** it stops scheduling new cycles
- **AND THEN** it waits for the in-flight cycle to finish or reach a configured shutdown timeout before exiting

### Requirement: Runtime commands
The project SHALL expose documented runtime commands for development, build, worker start, one-shot collection, report generation, SearXNG query testing, Prisma migration deploy, and Prisma client generation.

#### Scenario: Commands are documented
- **WHEN** a user reads setup documentation
- **THEN** they can identify how to run `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm collect`, `pnpm report`, `pnpm test:query`, `pnpm prisma:migrate`, and `pnpm prisma:generate`

