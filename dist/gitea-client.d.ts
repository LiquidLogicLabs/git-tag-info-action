import { TagInfo } from './types';
/**
 * Get tag information from Gitea API
 */
export declare function getTagInfo(tagName: string, owner: string, repo: string, baseUrl: string, token?: string, ignoreCertErrors?: boolean): Promise<TagInfo>;
/**
 * Get all tags from Gitea repository
 */
export declare function getAllTags(owner: string, repo: string, baseUrl: string, token?: string, ignoreCertErrors?: boolean): Promise<Array<{
    name: string;
    date: string;
}>>;
