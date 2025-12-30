import { RepoConfig } from './types';
/**
 * Resolve "latest" tag name
 * Strategy: Try semver first (using fast name-only fetch for GitHub), then fallback to date
 */
export declare function resolveLatestTag(config: RepoConfig): Promise<string>;
