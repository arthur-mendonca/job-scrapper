## MODIFIED Requirements

### Requirement: Backend-first architecture with API surface
The system SHALL remain backend-first and worker-oriented while exposing backend API capabilities and a generated API contract for operational consumers such as reports, dashboards, source management, job curation, and frontend code generation.

#### Scenario: Operational UI is introduced
- **WHEN** a frontend or dashboard is added in a later change
- **THEN** it uses the backend API and persisted pipeline data rather than replacing the collection pipeline or moving business logic into the browser

#### Scenario: API client types are generated
- **WHEN** a frontend generation tool consumes the backend API contract
- **THEN** it uses the generated OpenAPI document from the backend rather than manually redefining backend route models in the frontend
