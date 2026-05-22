## MODIFIED Requirements

### Requirement: Job status lifecycle
The system SHALL define a single authoritative job status vocabulary and persist job status using only the allowed values.

#### Scenario: Allowed status is written
- **WHEN** a user-controlled status is written for a job
- **THEN** the persisted job status is one of `new`, `saved`, `discarded`, `applied`, `ignored`, `interviewing`, `offer`, or `ghosted`

#### Scenario: System-controlled status is set
- **WHEN** the pipeline marks a job as `rejected` or `notified`
- **THEN** the persisted job status reflects that system-controlled state

### Requirement: User-controlled vs system-controlled statuses
The API SHALL allow users to update only user-controlled statuses and MUST NOT allow API consumers to set system-controlled statuses directly.

#### Scenario: API attempts to set rejected
- **WHEN** an API consumer attempts to set a job status to `rejected`
- **THEN** the request is rejected without modifying the job

#### Scenario: API attempts to set notified
- **WHEN** an API consumer attempts to set a job status to `notified`
- **THEN** the request is rejected without modifying the job

### Requirement: Status change events
When a job status changes, the system SHALL record an event in job history so operational tooling can audit workflow progress.

#### Scenario: Status changes via API
- **WHEN** a job status changes via the API
- **THEN** a JobEvent records the previous and new status values
