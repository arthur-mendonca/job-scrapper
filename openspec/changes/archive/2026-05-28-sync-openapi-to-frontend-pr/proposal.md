## Why

The backend already owns and generates the OpenAPI contract, but the frontend still needs a reliable reviewable path to receive contract updates. Automating a pull request from the backend repository to the frontend repository makes API changes visible to the frontend team before they are merged into the frontend main branch.

## What Changes

- Add a GitHub Actions workflow that runs after relevant changes are merged to `main`.
- Generate `openapi.json` with the existing backend static OpenAPI generation script.
- Checkout the frontend repository using a write-capable Personal Access Token secret.
- Copy the generated `openapi.json` into the configured frontend contract path.
- Create a frontend branch, commit the updated contract only when it changes, and open a pull request automatically.
- Document the required repository variables and secrets in the workflow comments.

## Capabilities

### New Capabilities
- `openapi-contract-sync`: Backend-owned automation that publishes generated OpenAPI contract updates to the frontend repository through reviewable pull requests.

### Modified Capabilities
- `api-openapi-contract`: The generated static OpenAPI artifact must be distributable to the frontend through backend CI automation, not only generated locally.

## Impact

- Adds a GitHub Actions workflow under `.github/workflows/`.
- Uses the existing `pnpm generate:openapi` script and generated `openapi.json`.
- Requires frontend repository configuration through GitHub Actions variables and a PAT secret with write access to the frontend repository.
- Does not change runtime API behavior, application code, or the OpenAPI schema generation implementation.
