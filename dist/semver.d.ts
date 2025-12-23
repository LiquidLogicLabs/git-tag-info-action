/**
 * Semantic versioning utilities
 */
export interface SemverParts {
    major: number;
    minor: number;
    patch: number;
    prerelease?: string;
    build?: string;
}
/**
 * Parse semantic version from tag name
 * Supports formats like: v1.2.3, 1.2.3, v1.2.3-alpha, 1.2.3-beta.1
 */
export declare function parseSemver(tagName: string): SemverParts | null;
/**
 * Check if tag name follows semantic versioning
 */
export declare function isSemver(tagName: string): boolean;
/**
 * Compare two semantic version tags
 * Returns: -1 if tag1 < tag2, 0 if tag1 === tag2, 1 if tag1 > tag2
 */
export declare function compareSemver(tag1: string, tag2: string): number;
/**
 * Sort tags by semantic version (highest first)
 */
export declare function sortTagsBySemver(tags: string[]): string[];
