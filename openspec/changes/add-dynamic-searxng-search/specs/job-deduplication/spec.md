## MODIFIED Requirements

### Requirement: Duplicate matching order
The system SHALL detect duplicate jobs using canonical URL first, normalized title plus normalized company name second, and content hash third, while completely disregarding the dynamic search configuration, user query text, generated dork, SearXNG engine, or discovery path that produced the candidate.

#### Scenario: Same job appears with tracking URL
- **WHEN** a collected job has the same canonical URL as an existing job
- **THEN** the system treats it as the existing job rather than creating a new job

#### Scenario: Same dynamic job appears from different queries
- **WHEN** two different dynamic SearXNG configurations discover the same canonical job URL or the same normalized title plus company identity
- **THEN** the deduplication service treats them as one job regardless of which query triggered each discovery

#### Scenario: Dynamic and traditional sources find the same job
- **WHEN** a dynamic SearXNG result and a traditional HTML, ATS, job board, email-alert, or predefined SearXNG collector result refer to the same canonical job URL or normalized title plus company identity
- **THEN** the deduplication service treats them as one job and records rediscovery metadata instead of creating source-specific duplicates
