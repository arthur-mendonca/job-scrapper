## 1. GitHub Actions Workflow

- [x] 1.1 Add a backend-owned workflow that triggers on `main` pushes affecting API contract inputs and on manual dispatch.
- [x] 1.2 Configure Node and pnpm installation using the repository package manager version.
- [x] 1.3 Run dependency installation and `pnpm generate:openapi` to produce `openapi.json`.
- [x] 1.4 Checkout the configured frontend repository using the frontend synchronization PAT.
- [x] 1.5 Copy `openapi.json` to the configured frontend destination path and skip PR creation when no diff exists.
- [x] 1.6 Commit the updated contract to a SHA-scoped frontend branch and open a pull request against the configured frontend base branch.

## 2. Validation

- [x] 2.1 Validate the OpenSpec change artifacts.
- [x] 2.2 Inspect the workflow YAML for syntax, required secrets, and variable references.
