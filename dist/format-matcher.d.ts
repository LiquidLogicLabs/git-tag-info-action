/**
 * Format matching utilities for tag filtering
 */
/**
 * Check if a format string is a simple pattern (e.g., "X.X" or "X.X.X")
 * Simple patterns use X as a placeholder for numbers
 */
export declare function isSimplePattern(format: string): boolean;
/**
 * Check if a format string is a wildcard pattern (e.g., "*", "*.*", "*.*.*")
 * Wildcard patterns use * as a placeholder for any characters
 */
export declare function isWildcardPattern(format: string): boolean;
/**
 * Convert a simple pattern to a regex
 * "X.X" → /^\d+\.\d+$/
 * "X.X.X" → /^\d+\.\d+\.\d+$/
 * "vX.X.X" → /^v\d+\.\d+\.\d+$/
 */
export declare function convertSimplePatternToRegex(format: string): RegExp;
/**
 * Convert a wildcard pattern to a regex
 * "*" → /^[^.]*$/
 * "*.*" → /^[^.]*\.[^.]*$/
 * "*.*.*" → /^[^.]*\.[^.]*\.[^.]*$/
 * "v*.*.*" → /^v[^.]*\.[^.]*\.[^.]*$/
 */
export declare function convertWildcardPatternToRegex(format: string): RegExp;
/**
 * Check if a format string looks like a regex pattern
 * Regex patterns typically start with ^ or contain regex special characters
 * Note: * is not treated as regex special char here since it's used for wildcard patterns
 */
export declare function isRegexPattern(format: string): boolean;
/**
 * Match a tag name against a format pattern
 * Supports both full match and prefix match
 *
 * @param tagName - The tag name to match
 * @param format - The format pattern (simple like "X.X" or regex)
 * @returns true if tag matches the format
 */
export declare function matchTagFormat(tagName: string, format: string): boolean;
/**
 * Filter tags by format pattern
 *
 * @param tagNames - Array of tag names to filter
 * @param format - The format pattern to match against
 * @returns Array of tag names that match the format
 */
export declare function filterTagsByFormat(tagNames: string[], format: string): string[];
