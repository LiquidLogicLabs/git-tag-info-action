/**
 * Format parser utilities for tag_format input
 * Supports single strings, JSON arrays, and comma-separated values
 */
/**
 * Parse tag_format input into an array of format patterns
 * Supports:
 * - Single string: "X.X" → ["X.X"]
 * - JSON array string: '["*.*.*", "*.*"]' → ["*.*.*", "*.*"]
 * - Comma-separated: "*.*.*,*.*" → ["*.*.*", "*.*"]
 * - Empty/undefined → undefined (backward compatible)
 *
 * @param input - The tag_format input string
 * @returns Array of format patterns, or undefined if input is empty
 */
export declare function parseTagFormat(input: string | undefined): string[] | undefined;
