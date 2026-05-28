## MODIFIED Requirements

### Requirement: Static frontend contract consumption
The frontend SHALL consume the backend OpenAPI contract from a generated `openapi.json` artifact rather than from a public Swagger UI or `/docs` route, and backend CI SHALL be able to publish updated contract artifacts to the frontend repository through reviewable pull requests.

#### Scenario: Frontend reads private repository artifact
- **WHEN** the frontend generation pipeline needs the API contract
- **THEN** it can read the generated `openapi.json` from the backend repository or from the synchronized frontend repository copy, using a Git provider access token if the repository is private

#### Scenario: Public docs route is unavailable
- **WHEN** frontend code generation runs outside the backend process
- **THEN** it does not require a public `/docs` route or a long-running backend HTTP server to retrieve the OpenAPI document

#### Scenario: Backend CI publishes contract update
- **WHEN** a backend change updates the generated OpenAPI artifact after merging to `main`
- **THEN** backend CI proposes the updated `openapi.json` to the frontend repository through a pull request instead of modifying the frontend main branch directly
