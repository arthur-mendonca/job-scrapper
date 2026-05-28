# openapi-contract-sync Specification

## Purpose
TBD - created by archiving change sync-openapi-to-frontend-pr. Update Purpose after archive.
## Requirements
### Requirement: Backend publishes OpenAPI updates to frontend
The backend repository SHALL provide CI automation that generates the backend OpenAPI artifact and proposes the updated artifact to the frontend repository through a pull request.

#### Scenario: Backend main receives contract-relevant change
- **WHEN** a contract-relevant change is pushed to the backend `main` branch
- **THEN** the CI workflow generates `openapi.json`, copies it to the configured frontend path, pushes a frontend branch, and opens a pull request against the configured frontend base branch

#### Scenario: Workflow is run manually
- **WHEN** an operator dispatches the OpenAPI sync workflow manually
- **THEN** the workflow performs the same generation, copy, branch, commit, push, and pull request process

### Requirement: Frontend sync configuration
The backend repository SHALL keep frontend repository, frontend target branch, and frontend OpenAPI destination path configurable through GitHub Actions variables rather than hard-coded local repository values.

#### Scenario: Frontend repository is configured
- **WHEN** the OpenAPI sync workflow runs with the required frontend variables and token secret configured
- **THEN** it checks out the configured frontend repository and writes the generated contract to the configured destination path

#### Scenario: Frontend configuration is missing
- **WHEN** the OpenAPI sync workflow runs without required frontend configuration
- **THEN** the workflow fails before attempting to push changes to the frontend repository

### Requirement: No empty frontend pull requests
The backend repository SHALL avoid opening a frontend pull request when the generated OpenAPI artifact does not change the configured frontend contract file.

#### Scenario: Generated contract matches frontend copy
- **WHEN** the generated `openapi.json` is copied into the frontend checkout and produces no Git diff
- **THEN** the workflow exits successfully without committing, pushing, or opening a pull request

### Requirement: Cross-repository credentials are isolated
The backend repository SHALL use an explicit frontend synchronization token secret for cross-repository writes rather than relying on the backend repository `GITHUB_TOKEN`.

#### Scenario: Frontend repository is private
- **WHEN** the workflow checks out or pushes to the frontend repository
- **THEN** it authenticates with the configured frontend synchronization token secret

