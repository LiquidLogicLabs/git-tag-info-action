# Action Test Workflows

This directory contains comprehensive test workflows for the `git-tag-info-action`. These workflows are designed to run in CI environments (GitHub Actions, Gitea Actions, etc.).

## Test Workflows

- **local-repo-test.yml** - Tests local repository tag retrieval
- **github-url-test.yml** - Tests GitHub repository using URL format
- **github-separate-inputs-test.yml** - Tests GitHub repository using separate inputs
- **latest-tag-test.yml** - Tests latest tag resolution
- **tag-format-test.yml** - Tests tag format filtering
- **error-handling-test.yml** - Tests error handling scenarios
- **comprehensive-test.yml** - Comprehensive output validation tests

## Running Tests in CI

All test workflows are automatically executed when the main `test.yml` workflow is called (from CI or release workflows). Each test workflow runs as a separate job in parallel.

The test workflows are called from `.github/workflows/test.yml`:

```yaml
jobs:
  test-local-repo:
    uses: ./.github/workflows/action-tests/local-repo-test.yml
  
  test-github-url:
    uses: ./.github/workflows/action-tests/github-url-test.yml
  
  # ... other test jobs
```

## Requirements

- **For CI**: No special requirements - works in standard GitHub/Gitea Actions runners
- All tests use `uses: ./` to call the action, which works correctly in real CI environments

