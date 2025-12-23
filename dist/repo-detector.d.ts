import { RepoConfig } from './types';
/**
 * Build repository configuration from inputs
 */
export declare function detectRepository(repository?: string, platform?: string, owner?: string, repo?: string, baseUrl?: string, token?: string): RepoConfig;
