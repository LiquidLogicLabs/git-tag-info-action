# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-01-XX

### Added
- Initial implementation
- Support for local repositories via git CLI
- Support for GitHub repositories via API
- Support for Gitea repositories via API
- Support for Bitbucket repositories via API
- Unified `repository` input that auto-detects URLs vs local paths
- Separate input mode (platform/owner/repo) for remote repositories
- "latest" tag resolution with semver-first, date fallback strategy
- Comprehensive tag information (SHA, commit SHA, type, message, verification)
- CI/CD workflows for linting, type checking, and building
- Release workflow for automated releases on semver tags
- Comprehensive documentation with usage examples

