"use strict";
/**
 * Format parser utilities for tag_format input
 * Supports single strings, JSON arrays, and comma-separated values
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTagFormat = parseTagFormat;
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
function parseTagFormat(input) {
    if (!input || input.trim() === '') {
        return undefined;
    }
    const trimmed = input.trim();
    // Try to parse as JSON array first (handles YAML arrays converted to JSON strings)
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                // Validate all elements are strings
                const patterns = parsed
                    .map((item) => (typeof item === 'string' ? item.trim() : String(item).trim()))
                    .filter((item) => item.length > 0);
                if (patterns.length === 0) {
                    throw new Error('JSON array must contain at least one non-empty pattern');
                }
                return patterns;
            }
            throw new Error('JSON input must be an array');
        }
        catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON array format for tag_format: ${error.message}. Expected format: '["pattern1", "pattern2"]'`);
            }
            throw error;
        }
    }
    // Check if it contains commas (likely comma-separated)
    if (trimmed.includes(',')) {
        const patterns = trimmed
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
        if (patterns.length === 0) {
            throw new Error('Comma-separated tag_format must contain at least one non-empty pattern');
        }
        return patterns;
    }
    // Single string (backward compatible)
    return [trimmed];
}
//# sourceMappingURL=format-parser.js.map