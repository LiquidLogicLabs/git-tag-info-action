# Get Tag Info Action

[![CI](https://github.com/your-org/git-tag-info-action/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/git-tag-info-action/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

Get tag information from local and remote repositories (GitHub, Gitea, Bitbucket). Supports both URL and separate input formats, with "latest" tag resolution using semver-first logic.

## Features

- **Multi-platform support**: Works with GitHub, Gitea, and Bitbucket
- **Local repositories**: Query tags from local git repositories
- **Remote repositories**: Query tags via API from remote repositories
- **Flexible input**: Support both URL format and separate inputs
- **Latest tag resolution**: Automatically resolve "latest" tag using semver-first, date fallback strategy
- **Comprehensive tag info**: Get tag SHA, commit SHA, tag type, message, and verification status

## Usage

### Basic Usage - Local Repository

```yaml
- name: Get tag info
  id: tag-info
  uses: your-org/git-tag-info-action@v1
  with:
    tag_name: v1.0.0
    repository: ./my-repo
```

### GitHub Repository (URL)

```yaml
- name: Get tag info
  id: tag-info
  uses: your-org/git-tag-info-action@v1
  with:
    tag_name: v1.0.0
    repository: https://github.com/owner/repo
    token: ${{ secrets.GITHUB_TOKEN }}
```

### GitHub Repository (Separate Inputs)

```yaml
- name: Get tag info
  id: tag-info
  uses: your-org/git-tag-info-action@v1
  with:
    tag_name: v1.0.0
    platform: github
    owner: owner
    repo: repo
    token: ${{ secrets.GITHUB_TOKEN }}
```

### Gitea Repository

```yaml
- name: Get tag info
  id: tag-info
  uses: your-org/git-tag-info-action@v1
  with:
    tag_name: v1.0.0
    repository: https://gitea.example.com/owner/repo
    base_url: https://gitea.example.com
    token: ${{ secrets.GITEA_TOKEN }}
```

### Bitbucket Repository

```yaml
- name: Get tag info
  id: tag-info
  uses: your-org/git-tag-info-action@v1
  with:
    tag_name: v1.0.0
    repository: https://bitbucket.org/owner/repo
    token: ${{ secrets.BITBUCKET_TOKEN }}
```

### Get Latest Tag

```yaml
- name: Get latest tag
  id: tag-info
  uses: your-org/git-tag-info-action@v1
  with:
    tag_name: latest
    repository: https://github.com/owner/repo
    token: ${{ secrets.GITHUB_TOKEN }}

- name: Use latest tag
  run: echo "Latest tag is ${{ steps.tag-info.outputs.tag_name }}"
```

### Using Outputs

```yaml
- name: Get tag info
  id: tag-info
  uses: your-org/git-tag-info-action@v1
  with:
    tag_name: v1.0.0
    repository: https://github.com/owner/repo

- name: Check if tag exists
  if: steps.tag-info.outputs.exists == 'true'
  run: echo "Tag exists!"

- name: Display tag info
  run: |
    echo "Tag: ${{ steps.tag-info.outputs.tag_name }}"
    echo "SHA: ${{ steps.tag-info.outputs.tag_sha }}"
    echo "Commit: ${{ steps.tag-info.outputs.commit_sha }}"
    echo "Type: ${{ steps.tag-info.outputs.tag_type }}"
```

## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `tag_name` | Tag name or "latest" to get the most recent tag | Yes | - |
| `repository` | Repository URL or local path. Auto-detects: URLs (http://, https://, git@) → Remote repository, Paths → Local repository. Examples: `https://github.com/owner/repo`, `./my-repo`, `/path/to/repo` | No | - |
| `platform` | Platform type (github/gitea/bitbucket) for separate input mode | No | - |
| `owner` | Repository owner (for separate input mode) | No | - |
| `repo` | Repository name (for separate input mode) | No | - |
| `base_url` | Custom base URL for self-hosted instances (e.g., https://gitea.example.com) | No | - |
| `token` | Authentication token (works for all platforms) | No | - |

## Outputs

| Name | Description |
|------|-------------|
| `exists` | Boolean indicating if tag exists |
| `tag_name` | Tag name |
| `tag_sha` | Tag SHA |
| `tag_type` | Tag type (commit/annotated) |
| `commit_sha` | Commit SHA |
| `tag_message` | Tag message |
| `verified` | Whether tag is verified (if applicable) |

## Latest Tag Resolution

When `tag_name` is set to `"latest"`, the action uses the following strategy:

1. **Semver First**: If semantic version tags exist (e.g., v1.2.3, 1.0.0), it selects the highest version
2. **Date Fallback**: If no semver tags exist, it selects the most recent tag by creation date
3. **Alphabetical Fallback**: If no date information is available, it uses alphabetical order

## Repository Detection

The action automatically detects repository type based on the `repository` input:

- **URLs** (starting with `http://`, `https://`, or `git@`) → Treated as remote repository
- **Paths** (anything else) → Treated as local repository path

Examples:
- `https://github.com/owner/repo` → Remote (GitHub)
- `./my-repo` → Local
- `/absolute/path/to/repo` → Local
- `git@github.com:owner/repo.git` → Remote (GitHub)

## Authentication

For remote repositories, you may need to provide an authentication token:

- **GitHub**: Use `GITHUB_TOKEN` or a Personal Access Token
- **Gitea**: Use a Gitea access token
- **Bitbucket**: Use an App Password or access token

The token is automatically masked in logs for security.

## Security Considerations

- Tokens are automatically masked in action logs
- All API calls use HTTPS
- Repository URLs are validated before use
- No credentials are stored or cached

## License

MIT

## Credits

This action is inspired by [ovsds/get-tag-info-action](https://github.com/marketplace/actions/get-tag-info) and extends it with support for multiple platforms and local repositories.

