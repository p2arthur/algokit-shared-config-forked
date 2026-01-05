# DevPortal Documentation Publishing

This composite action publishes documentation to a dedicated docs branch for consumption by the Algorand Developer Portal.

## Usage

```yaml
name: Publish Documentation
on:
  release:
    types: [published]

jobs:
  publish-docs:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Publish documentation
        uses: algorandfoundation/algokit-shared-config-forked/.github/actions/devportal-publish-docs@main
        with:
          docs_path: "docs" # Optional, default: "docs"
          docs_branch: "docs-dist" # Optional, default: "docs-dist"
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input          | Required | Default       | Description                                           |
| -------------- | -------- | ------------- | ----------------------------------------------------- |
| `docs_path`    | No       | `"docs"`      | Location relative to the repo root of the docs folder |
| `docs_branch`  | No       | `"docs-dist"` | Name of the branch to publish the docs to             |
| `github_token` | Yes      | -             | GitHub token for publishing to docs branch            |

## Outputs

| Output          | Description                                                            |
| --------------- | ---------------------------------------------------------------------- |
| `docs_target`   | The version target that was published (e.g., `"latest"` or `"v1.2.3"`) |
| `update_latest` | Whether the latest folder was updated (`"true"` or `"false"`)          |

## How it Works

1. **Generate Manifest**: Creates a `manifest.json` file with metadata about the documentation build
2. **Version Detection**: Determines the target version from the event type:
   - Release events: Publishes to versioned folder (e.g., `v1.2.3`) and updates `latest/`
   - Other events: Publishes only to `latest/`
3. **Documentation Publishing**: Copies documentation to the docs branch, preserving existing versions
4. **DevPortal Sync**: The Developer Portal performs nightly checks of all configured documentation sources and automatically imports updates

## Hybrid Sync Model

This action uses a **hybrid push/pull approach**:

- **Nightly Pull (Default)**: The DevPortal automatically checks for documentation updates every night
- **Manual Trigger (Urgent)**: For time-sensitive updates, manually trigger the DevPortal's import workflow via GitHub Actions UI

**Benefits:**

- Repositories don't need special tokens or secrets beyond `GITHUB_TOKEN`
- Simple setup - just publish to your docs branch
- Direct manual trigger available when needed (no intermediary scripts)
- Centralized control of documentation imports

**For urgent updates:** Navigate to the DevPortal repository's Actions tab and manually trigger the documentation import workflow.

## Advanced Usage

### Using Outputs

```yaml
- name: Publish documentation
  id: publish
  uses: algorandfoundation/algokit-shared-config-forked/.github/actions/devportal-publish-docs@main
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}

- name: Show published version
  run: |
    echo "Published to: ${{ steps.publish.outputs.docs_target }}"
    echo "Updated latest: ${{ steps.publish.outputs.update_latest }}"
```

### Custom Docs Path

```yaml
- name: Publish documentation
  uses: algorandfoundation/algokit-shared-config-forked/.github/actions/devportal-publish-docs@main
  with:
    docs_path: "build/docs"
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Custom Branch Name

```yaml
- name: Publish documentation
  uses: algorandfoundation/algokit-shared-config-forked/.github/actions/devportal-publish-docs@main
  with:
    docs_branch: "gh-pages"
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Scripts

### generate-manifest.mjs

Generates a `manifest.json` file for documentation builds with metadata about the documentation generator and build.

**Note:** This script is used internally by the action and referenced via `${{ github.action_path }}`.

**Arguments:**

- `docs_path` - Path to the documentation folder (e.g., "docs")
- `repository` - GitHub repository in format "owner/repo"
- `commit_sha` - Git commit SHA

**Features:**

- Auto-detects documentation generator (Sphinx, TypeDoc, JSDoc)
- Extracts version information from package.json or tool CLI
- Generates ISO 8601 timestamp

**Output:**
Creates a `manifest.json` file in the docs directory:

```json
{
  "generated": "2024-01-15T10:30:00Z",
  "generator": {
    "tool": "typedoc",
    "version": "0.25.0"
  },
  "metadata": {
    "repository": "owner/repo",
    "commit": "abc123def456"
  }
}
```

## Development

These scripts use ES modules (`.mjs` extension) and require Node.js 18+.

No external dependencies are required - scripts use only Node.js built-in modules and the Fetch API (available in Node.js 18+).
