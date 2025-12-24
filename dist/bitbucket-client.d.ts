import { TagInfo } from './types';
/**
 * Get tag information from Bitbucket API
 */
export declare function getTagInfo(tagName: string, owner: string, repo: string, token?: string, ignoreCertErrors?: boolean): Promise<TagInfo>;
/**
 * Get all tags from Bitbucket repository
 */
export declare function getAllTags(owner: string, repo: string, token?: string, ignoreCertErrors?: boolean): Promise<Array<{
    name: string;
    date: string;
}>>;
