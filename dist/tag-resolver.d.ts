import { RepoConfig } from './types';
/**
 * Resolve "latest" tag name
 * Strategy: Try semver first (using fast name-only fetch for GitHub), then fallback to date
 * If tagFormat is provided, filter tags by format before sorting
 * If tagFormat is an array, try each pattern in order as fallbacks
 */
export declare function resolveLatestTag(config: RepoConfig, tagFormat?: string | string[]): Promise<string>;
