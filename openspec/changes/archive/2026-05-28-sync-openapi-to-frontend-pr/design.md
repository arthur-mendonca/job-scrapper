## Context

The backend already generates `openapi.json` from Fastify route definitions and Zod schemas with `pnpm generate:openapi`. The frontend needs a controlled way to receive that generated contract without polling the backend repository manually or consuming a public Swagger endpoint.

The synchronization crosses repository boundaries, so it requires GitHub Actions credentials and must leave frontend maintainers in control through pull request review.

## Goals / Non-Goals

**Goals:**
- Generate the backend OpenAPI artifact in CI after contract-relevant changes land on `main`.
- Push the generated `openapi.json` to a branch in the frontend repository.
- Open a pull request in the frontend repository with a clear title and body.
- Avoid creating empty pull requests when the generated contract has not changed.
- Keep frontend repository name, target branch, and destination path configurable through Actions variables.

**Non-Goals:**
- Do not build frontend code generation in the backend repository.
- Do not merge the frontend pull request automatically.
- Do not expose the backend API or Swagger UI publicly.
- Do not change runtime API behavior or existing OpenAPI generation code.

## Decisions

1. Use a backend-owned GitHub Actions workflow triggered on pushes to `main`.

   This matches the ownership model: backend contract changes originate in the backend repository. The workflow uses `paths` filters for API, Prisma, package, lockfile, and workflow changes so it does not run on unrelated documentation updates. A `workflow_dispatch` trigger is included for manual repair or replay.

2. Use repository variables for frontend repository configuration.

   The workflow reads `FRONTEND_REPOSITORY`, `FRONTEND_BASE_BRANCH`, and `FRONTEND_OPENAPI_PATH` from GitHub Actions variables. This avoids hard-coding a local placeholder in the workflow while still making required setup explicit.

3. Use a PAT secret for frontend checkout and pull request creation.

   `GITHUB_TOKEN` is scoped to the backend repository and cannot reliably create branches and PRs in a separate private frontend repository. The workflow therefore uses `FRONTEND_SYNC_PAT`, which must have write access to the frontend repository and permission to create pull requests.

4. Commit only when the copied contract changes.

   The workflow checks `git status --porcelain` after copying `openapi.json`. If there is no diff, it exits before creating a branch, commit, push, or pull request.

5. Use GitHub CLI for the pull request.

   GitHub-hosted Ubuntu runners include `gh`, and using it avoids adding a third-party action dependency for cross-repository PR creation. The PAT is passed through `GH_TOKEN`.

## Risks / Trade-offs

- Misconfigured frontend variables or missing PAT -> The workflow fails early before checkout or PR creation; setup comments name the required values.
- PAT has broader access than `GITHUB_TOKEN` -> Use a fine-grained PAT limited to the frontend repository with contents write and pull request write permissions.
- Multiple backend merges can create overlapping frontend PRs -> Branch names include the backend commit SHA to avoid collisions; frontend maintainers can close superseded PRs.
- Generated contract is nondeterministic -> The no-change check becomes unreliable; keep `pnpm generate:openapi` deterministic and review contract diffs.

## Migration Plan

1. Add the GitHub Actions workflow to the backend repository.
2. Configure backend repository variables: `FRONTEND_REPOSITORY`, `FRONTEND_BASE_BRANCH`, and `FRONTEND_OPENAPI_PATH`.
3. Configure backend repository secret: `FRONTEND_SYNC_PAT`.
4. Run the workflow manually once with `workflow_dispatch` to confirm repository access and destination path.
5. Roll back by disabling or removing the workflow; no runtime service migration is required.
