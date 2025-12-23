import { TagInfo } from './types';
/**
 * Get tag information from GitHub API
 */
export declare function getTagInfo(tagName: string, owner: string, repo: string, token?: string): Promise<TagInfo>;
/**
 * Get all tags from GitHub repository
 */
export declare function getAllTags(owner: string, repo: string, token?: string): Promise<Array<{
    name: string;
    date: string;
}>>;
