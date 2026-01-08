# Shared Config Improvements for algokit-subscriber-ts

This repo packages the reusable workflows and composite actions that address the gaps we found in `algokit-subscriber-ts`’s CI/CD and docs pipeline. The goal is to replace ad-hoc workflow wiring with a single source of truth that projects can pin to tags or SHAs when they consume it.

## Key issues from the original repo
- Workflows depended on `makerxstudio/shared-config` at `@main` with most actions pinned only to tags, increasing supply-chain drift risk.
- Node 22.x was hardcoded in CI while `package.json` only required `>=18`, leaving local and CI versions out of sync.
- Docs were generated but not automatically published anywhere.
- Production promotion relied on a manual `prod_release` workflow to push `main` → `release` → `main`.
- CI logic was duplicated per repo (PR checks, build artifacts, release hooks), making changes hard to propagate.

## How the shared-config repo fixes or improves these gaps
- **Self-hosted reusable workflows**: All CI, release, and docs jobs now live here (`.github/workflows/*.yml`), so downstream repos can depend on a single maintained source instead of external upstreams. Consumers can pin to a tag or SHA to avoid floating on `main`.
- **Standard CI entrypoints**: `on-merge-main.yml` orchestrates language-specific CI (`ci-typescript.yml`/`ci-python.yml`) and release in one place, removing per-repo duplication and keeping lint/test/build parity.
- **Consistent Node baseline**: Node is set to LTS 20 across Node jobs (e.g., `.github/workflows/ci-typescript.yml`, `.github/actions/node-ci/action.yml`), avoiding the 22.x vs engine mismatch seen previously.
- **Automated docs build + publish**: `build-and-publish-docs.yml` builds TypeDoc or Sphinx docs and deploys them via `publish-docs` and `devportal-publish-docs` composites, closing the “generated but not hosted” gap.
- **Branch sync automation**: `on-merge-release.yml` fast-forwards `release` from `main` and merges back, eliminating the manual prod promotion step.
- **Reusable build artifacts**: `node-build-zip.yml` and `archive-artifact` standardize packaging of build outputs (with optional static-site env substitution), so downstream repos don’t need bespoke artifact steps.
- **One-click release runner**: `release-package.yml` wraps the `release-package` composite to run semantic-release with bot credentials, making the release path consistent across TypeScript and Python projects.

## Recommended adoption steps for algokit-subscriber-ts
1) Replace current workflow calls to `makerxstudio/shared-config` with calls to these workflows (pin to a tag/commit from this repo).
2) Align Node in local tooling (`.nvmrc`) to the 20.x LTS used here for parity with CI.
3) Enable the docs publish workflow to host generated docs automatically instead of only checking them in.
