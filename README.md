# Shared GitHub Actions Workflows

This repository hosts reusable workflows and composite actions that standardize CI, docs, releases, and branch hygiene across projects. Below are the workflows you can call from other repositories, plus examples of how they are wired into `ref-subscriber-ts` and `ref-subscriber-py`.

## Quick Integration Examples

**TypeScript project (main CI + release) and branch sync**
```yaml
name: On Merge Main
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  id-token: write
  pages: write
  contents: write
  issues: write
  pull-requests: write

jobs:
  on_main_merge:
    name: Run On Merge Main Workflow
    uses: p2arthur/algokit-shared-config-forked/.github/workflows/on-merge-main.yml@main
    with:
      project_type: typescript
    secrets:
      BOT_ID: ${{ secrets.BOT_ID }}
      BOT_SK: ${{ secrets.BOT_SK }}
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

name: On Merge Release
on:
  workflow_dispatch:

permissions:
  id-token: write
  pages: write
  contents: write
  issues: write
  pull-requests: write

jobs:
  on_merge_release:
    name: Run On Merge Release Workflow
    uses: p2arthur/algokit-shared-config-forked/.github/workflows/on-merge-release.yml@main
    secrets:
      BOT_ID: ${{ secrets.BOT_ID }}
      BOT_SK: ${{ secrets.BOT_SK }}
```

**Python project**: call the same `on-merge-main.yml` but set `project_type: python` and omit `NPM_TOKEN` if you do not publish to npm.

## Reusable Workflows

### `.github/workflows/on-merge-main.yml` — On Merge to Main
- **Purpose:** End-to-end CI + semantic release when changes land on `main`. Chooses the right CI path for TypeScript or Python.
- **Inputs:** `project_type` (`typescript` or `python`).
- **Secrets:** `BOT_ID`, `BOT_SK` (GitHub App creds for release), `GH_TOKEN` (for build artifact workflows), `NPM_TOKEN` (only needed for npm installs/publishing).
- **What it does:**
  - Routes to language-specific CI (`ci-typescript.yml` or `ci-python.yml`).
  - If all CI jobs succeed, generates a bot token and runs the `release-package` composite action for semantic-release (npm or Poetry).

### `.github/workflows/on-merge-release.yml` — Prod Publish / Branch Sync
- **Purpose:** Keeps `release` and `main` in sync after promoting to production.
- **Secrets:** `BOT_ID`, `BOT_SK` (GitHub App used for pushing).
- **What it does:** Generates an installation token, checks out with that token, fast-forwards `release` to `main` (or merges if needed), then merges `release` back to `main` to capture tags/metadata.

### `.github/workflows/ci-typescript.yml` — CI TypeScript
- **Purpose:** Standard Node.js CI with build and docs for TS projects.
- **Secrets:** `NPM_TOKEN`, `GH_TOKEN`.
- **What it does:**
  - Runs composite `node-ci` (install, lint, typecheck, test, build).
  - Calls `node-build-zip.yml` to build and upload an artifact (configurable via inputs if reused directly).
  - Builds and publishes docs through `build-and-publish-docs.yml` with `project_type: typescript`.

### `.github/workflows/ci-python.yml` — CI Python
- **Purpose:** Poetry-driven Python CI with packaging and docs.
- **Secrets:** Inherited (no required secrets by default).
- **What it does:**
  - Installs Poetry, sets up Python 3.12, installs deps, and runs `pytest`.
  - Builds the package and uploads the `dist/` artifact.
  - Builds and publishes Sphinx docs via `build-and-publish-docs.yml` with `project_type: python`.

### `.github/workflows/node-build-zip.yml` — Generic Node Build + Zip
- **Purpose:** Reusable Node build + artifact packaging, optionally with static-site env substitution.
- **Inputs:** `node-version` (default `20.x`), `working-directory`, `build-path` (`dist`), `artifact-name`, `static-site` (bool), `static-site-env-prefix` (`VITE`), `pre-run-script`, `sample-env-path` (`.env.sample`).
- **Secrets:** `NPM_TOKEN`, `GH_TOKEN`.
- **What it does:** Checks out with `GH_TOKEN`, sets up Node + auth, optionally rewrites static-site env placeholders, runs `run-build` composite (npm ci/rebuild/prepare/build), then uploads the build folder as an artifact.

### `.github/workflows/build-and-publish-docs.yml` — Build, Check and Publish Docs
- **Purpose:** Language-agnostic docs pipeline.
- **Inputs:** `project_type` (`typescript` or `python`).
- **What it does:** Checks out code, builds docs via the matching composite action (`generate-typescript-docs` or `generate-python-docs`), uploads the docs artifact, then deploys it to GitHub Pages using `publish-docs`.

### `.github/workflows/release-package.yml` — Release Package
- **Purpose:** Minimal wrapper to run the `release-package` composite action directly.
- **Inputs:** `project_type`.
- **Secrets:** `BOT_TOKEN` (required), `NPM_TOKEN` (optional for npm publish).
- **What it does:** Checks out with full history, then invokes the composite release action to run semantic-release (npm or Poetry).

### `.github/workflows/on-pull-request.yml` — On Pull Request
- **Purpose:** Lightweight Node CI for PR validation.
- **Secrets:** `NPM_TOKEN`.
- **What it does:** Checks out and runs the `node-ci` composite action in the repo root.

### `.github/workflows/check-docs.yml` — Publish - Reusable
- **Purpose:** Verifies generated docs match the committed state.
- **What it does:** Checks out, installs npm deps, runs `npm run generate:code-docs`, and stages changes to surface diffs in subsequent steps.

## Composite Actions (used by the workflows)
- `generate-bot-token`: Creates an installation token from a GitHub App (`BOT_ID`/`BOT_SK`).
- `node-ci`: Node setup + install + lint/typecheck/test/build.
- `setup-node-auth`: Node setup with npm auth for private registries.
- `run-build`: npm ci (ignore scripts) + rebuild + prepare + build.
- `archive-artifact`: Uploads build outputs as artifacts.
- `generate-typescript-docs` / `generate-python-docs`: Build docs with TypeDoc or Sphinx.
- `publish-docs`: Uploads docs artifact and deploys to GitHub Pages.
- `release-package`: Runs semantic-release (npm or Poetry) and optionally publishes to PyPI.

## Required Secrets Overview
- `BOT_ID` / `BOT_SK`: GitHub App credentials used to generate a bot token for releases and branch sync.
- `GH_TOKEN`: Token with repo scope for checkouts/builds that need package access (used by Node builds).
- `NPM_TOKEN`: Needed for npm installs/publishing in TypeScript flows.
- `GITHUB_TOKEN`: Default token; can be passed through as `GH_TOKEN` if you grant the workflow required permissions.
- `PYPI_TOKEN` (optional): Only needed when publishing Python packages via semantic-release + Poetry.
