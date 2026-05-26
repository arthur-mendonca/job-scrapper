## ADDED Requirements

### Requirement: Geo/location restriction extraction
The normalizer SHALL extract explicit geo/location restriction signals from title, location, description, and requirements and expose them in a structured field on the normalized job.

#### Scenario: US-only restriction is present
- **WHEN** a job explicitly states it is remote but limited to US-only candidates
- **THEN** the normalized job includes a structured restriction signal indicating US-only

#### Scenario: Europe-only restriction is present
- **WHEN** a job explicitly limits eligibility to Europe or EU-only candidates
- **THEN** the normalized job includes a structured restriction signal indicating Europe-only

#### Scenario: No explicit restriction is present
- **WHEN** a job does not state an explicit geo/location restriction
- **THEN** the normalized job emits an empty restriction list
