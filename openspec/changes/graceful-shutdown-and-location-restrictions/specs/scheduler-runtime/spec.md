## MODIFIED Requirements

### Requirement: Graceful shutdown
The worker SHALL handle SIGINT and SIGTERM gracefully by stopping future scheduling and allowing any in-flight collection cycle to finish at a safe completion point before exiting.

#### Scenario: Termination signal is received during idle
- **WHEN** the worker receives SIGINT or SIGTERM while no cycle is running
- **THEN** it stops scheduling and exits cleanly

#### Scenario: Termination signal is received during a running cycle
- **WHEN** the worker receives SIGINT or SIGTERM while a cycle is running
- **THEN** it stops scheduling new cycles
- **AND THEN** it waits for the in-flight cycle to finish or reach a configured shutdown timeout before exiting
