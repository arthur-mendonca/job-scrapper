## MODIFIED Requirements

### Requirement: Job status actions
Operational tooling SHALL support workflow statuses beyond the MVP curation set so the user can track application progress over time.

#### Scenario: User tracks application workflow
- **WHEN** the user updates job workflow state
- **THEN** they can set `saved`, `discarded`, `applied`, `ignored`, `interviewing`, `offer`, and `ghosted` as appropriate

#### Scenario: Applied status is displayed in Portuguese
- **WHEN** operational tooling displays the `applied` status in Portuguese
- **THEN** it labels the status as "candidatado" or "candidatura enviada" rather than "aplicado"
