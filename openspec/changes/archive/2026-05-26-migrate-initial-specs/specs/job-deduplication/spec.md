## ADDED Requirements

### Requirement: Duplicate matching order
The system SHALL detect duplicate jobs using canonical URL first, normalized title plus normalized company name second, and content hash third.

#### Scenario: Same job appears with tracking URL
- **WHEN** a collected job has the same canonical URL as an existing job
- **THEN** the system treats it as the existing job rather than creating a new job

### Requirement: Rediscovery updates
When an existing job is found again, the system SHALL update rediscovery metadata such as `lastSeenAt` and `updatedAt` while preserving original discovery and notification state.

#### Scenario: Existing job is rediscovered
- **WHEN** a duplicate job is collected in a later cycle
- **THEN** the existing job is updated as rediscovered and its original `discoveredAt` and `notifiedAt` values are preserved

### Requirement: Rediscovery events
The system SHALL record a job event when a job is discovered or rediscovered where event persistence is available.

#### Scenario: New job is persisted
- **WHEN** a previously unseen job is created
- **THEN** a discovery event records that the job entered the system

### Requirement: Notification deduplication support
The deduplication behavior SHALL support notification idempotency by ensuring the same persisted job is not treated as newly notifiable on every rediscovery.

#### Scenario: Notified job reappears
- **WHEN** a job with `notifiedAt` already set is rediscovered
- **THEN** the job is not treated as a never-notified opportunity
