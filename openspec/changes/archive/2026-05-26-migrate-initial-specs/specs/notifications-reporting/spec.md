## ADDED Requirements

### Requirement: Telegram high-score notifications
The system SHALL send Telegram notifications for jobs whose score is greater than or equal to `NOTIFICATION_SCORE_THRESHOLD` when Telegram credentials are configured.

#### Scenario: High-scoring job is found
- **WHEN** a new job scores at or above the notification threshold
- **THEN** the notification service attempts to send a Telegram message for that job

### Requirement: Notification idempotency
The system SHALL NOT notify the same persisted job more than once and SHALL mark a job as notified only after successful notification.

#### Scenario: Telegram send succeeds
- **WHEN** a job notification is delivered successfully
- **THEN** the job's notification timestamp or notified status is persisted

### Requirement: Mobile-readable message format
Telegram messages SHALL include score, title, company, location, source, salary when available, match reasons, risk flags, recommended action, and link in a compact mobile-readable format.

#### Scenario: Job has long text fields
- **WHEN** a high-scoring job has long descriptions or requirements
- **THEN** the notification omits or truncates long text so the message remains readable

### Requirement: Per-run summary
The system SHALL provide a per-run summary notification or report containing collection counts, new and rediscovered jobs, high-scoring jobs, notification counts, and failures when supported by runtime configuration.

#### Scenario: Collection cycle ends
- **WHEN** a cycle completes
- **THEN** the system can report the main outcome counts and collector failure count

### Requirement: Optional email digest
The system SHALL support optional email notifications or digest behavior only when `EMAIL_NOTIFICATIONS_ENABLED` is true and SMTP configuration is complete.

#### Scenario: Email is disabled
- **WHEN** email notifications are disabled
- **THEN** the system does not attempt SMTP delivery

### Requirement: Report command
The system SHALL provide a report mode that summarizes recent and high-scoring jobs without running a full collection cycle.

#### Scenario: User runs report command
- **WHEN** the report command executes
- **THEN** it emits a structured summary of relevant persisted job data
