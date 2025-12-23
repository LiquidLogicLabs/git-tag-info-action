import * as core from '@actions/core';
import { RepoConfig, Platform } from './types';
import { getAllTags as getLocalTags } from './git-client';
import { getAllTags as getGithubTags } from './github-client';
import { getAllTags as getGiteaTags } from './gitea-client';
import { getAllTags as getBitbucketTags } from './bitbucket-client';
import { isSemver, sortTagsBySemver, compareSemver } from './semver';

/**
 * Get all tags from repository based on configuration
 */
async function getAllTagsFromRepo(config: RepoConfig): Promise<
  Array<{ name: string; date: string }>
> {
  if (config.type === 'local') {
    if (!config.path) {
      throw new Error('Local repository path is required');
    }
    const tags = getLocalTags(config.path);
    // For local tags, we don't have dates easily available, so return empty dates
    return tags.map((name) => ({ name, date: '' }));
  }

  if (config.type === 'remote') {
    if (!config.platform || !config.owner || !config.repo) {
      throw new Error('Remote repository configuration is incomplete');
    }

    switch (config.platform) {
      case Platform.GITHUB:
        return await getGithubTags(config.owner, config.repo, config.token);
      case Platform.GITEA:
        if (!config.baseUrl) {
          throw new Error('Gitea base URL is required');
        }
        return await getGiteaTags(
          config.owner,
          config.repo,
          config.baseUrl,
          config.token
        );
      case Platform.BITBUCKET:
        return await getBitbucketTags(config.owner, config.repo, config.token);
      default:
        throw new Error(`Unsupported platform: ${config.platform}`);
    }
  }

  throw new Error('Invalid repository configuration');
}

/**
 * Resolve "latest" tag name
 * Strategy: Try semver first, then fallback to date
 */
export async function resolveLatestTag(
  config: RepoConfig
): Promise<string> {
  core.info('Resolving latest tag...');

  const allTags = await getAllTagsFromRepo(config);

  if (allTags.length === 0) {
    throw new Error('No tags found in repository');
  }

  // Filter semver tags
  const semverTags = allTags.filter((tag) => isSemver(tag.name));

  if (semverTags.length > 0) {
    core.info(`Found ${semverTags.length} semver tags, using semver comparison`);
    // Sort by semver (highest first)
    const sorted = sortTagsBySemver(semverTags.map((t) => t.name));
    const latest = sorted[0];
    core.info(`Latest semver tag: ${latest}`);
    return latest;
  }

  // Fallback to date-based sorting
  core.info('No semver tags found, falling back to date-based sorting');
  const tagsWithDates = allTags.filter((tag) => tag.date);

  if (tagsWithDates.length > 0) {
    // Sort by date (most recent first)
    const sorted = tagsWithDates.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // Descending order
    });
    const latest = sorted[0].name;
    core.info(`Latest tag by date: ${latest}`);
    return latest;
  }

  // If no dates available, return the last tag alphabetically (fallback)
  core.warning('No date information available, using alphabetical order');
  const sorted = allTags.map((t) => t.name).sort();
  return sorted[sorted.length - 1];
}

