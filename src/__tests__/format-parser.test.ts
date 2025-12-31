import { parseTagFormat } from '../format-parser';

describe('format-parser', () => {
  describe('parseTagFormat', () => {
    describe('backward compatibility - single string', () => {
      it('should parse single string pattern', () => {
        expect(parseTagFormat('X.X')).toEqual(['X.X']);
        expect(parseTagFormat('*.*')).toEqual(['*.*']);
        expect(parseTagFormat('X.X.X')).toEqual(['X.X.X']);
      });

      it('should trim whitespace from single string', () => {
        expect(parseTagFormat('  X.X  ')).toEqual(['X.X']);
        expect(parseTagFormat('\t*.*\n')).toEqual(['*.*']);
      });
    });

    describe('empty/undefined input', () => {
      it('should return undefined for empty string', () => {
        expect(parseTagFormat('')).toBeUndefined();
        expect(parseTagFormat('   ')).toBeUndefined();
        expect(parseTagFormat('\t\n')).toBeUndefined();
      });

      it('should return undefined for undefined input', () => {
        expect(parseTagFormat(undefined)).toBeUndefined();
      });
    });

    describe('JSON array string format', () => {
      it('should parse JSON array with single pattern', () => {
        expect(parseTagFormat('["X.X"]')).toEqual(['X.X']);
        expect(parseTagFormat('["*.*.*"]')).toEqual(['*.*.*']);
      });

      it('should parse JSON array with multiple patterns', () => {
        expect(parseTagFormat('["*.*.*", "*.*"]')).toEqual(['*.*.*', '*.*']);
        expect(parseTagFormat('["X.X.X", "X.X", "*.*"]')).toEqual(['X.X.X', 'X.X', '*.*']);
      });

      it('should trim whitespace from JSON array elements', () => {
        expect(parseTagFormat('["  X.X  ", "  *.*  "]')).toEqual(['X.X', '*.*']);
      });

      it('should handle JSON array with v-prefixed patterns', () => {
        expect(parseTagFormat('["v*.*.*", "v*.*"]')).toEqual(['v*.*.*', 'v*.*']);
      });

      it('should filter out empty patterns from JSON array', () => {
        expect(parseTagFormat('["X.X", "", "X.X.X"]')).toEqual(['X.X', 'X.X.X']);
        expect(parseTagFormat('["X.X", "   ", "X.X.X"]')).toEqual(['X.X', 'X.X.X']);
      });

      it('should throw error for empty JSON array', () => {
        expect(() => parseTagFormat('[]')).toThrow('JSON array must contain at least one non-empty pattern');
        expect(() => parseTagFormat('["", "   "]')).toThrow('JSON array must contain at least one non-empty pattern');
      });

      it('should throw error for invalid JSON', () => {
        // Invalid JSON array syntax (unquoted string) - should throw
        expect(() => parseTagFormat('[X.X]')).toThrow('Invalid JSON array format');
        // Valid JSON array with object - gets converted to string representation
        // This is acceptable behavior (non-string elements converted to strings)
        const result = parseTagFormat('[{"pattern": "X.X"}]');
        expect(result).toEqual(['[object Object]']); // Object converted to string
      });

      it('should handle JSON array with non-string elements', () => {
        // Non-string elements are converted to strings
        expect(parseTagFormat('[123, "X.X"]')).toEqual(['123', 'X.X']);
      });
    });

    describe('comma-separated format', () => {
      it('should parse comma-separated patterns', () => {
        expect(parseTagFormat('*.*.*,*.*')).toEqual(['*.*.*', '*.*']);
        expect(parseTagFormat('X.X.X,X.X,*.*')).toEqual(['X.X.X', 'X.X', '*.*']);
      });

      it('should trim whitespace from comma-separated values', () => {
        expect(parseTagFormat('  *.*.*  ,  *.*  ')).toEqual(['*.*.*', '*.*']);
        expect(parseTagFormat('X.X.X, X.X, *.*')).toEqual(['X.X.X', 'X.X', '*.*']);
      });

      it('should filter out empty patterns from comma-separated values', () => {
        expect(parseTagFormat('X.X,,X.X.X')).toEqual(['X.X', 'X.X.X']);
        expect(parseTagFormat('X.X,   ,X.X.X')).toEqual(['X.X', 'X.X.X']);
      });

      it('should throw error for comma-separated with all empty patterns', () => {
        expect(() => parseTagFormat(',,')).toThrow('Comma-separated tag_format must contain at least one non-empty pattern');
        expect(() => parseTagFormat('   ,   ')).toThrow('Comma-separated tag_format must contain at least one non-empty pattern');
      });

      it('should handle single comma-separated value', () => {
        expect(parseTagFormat('X.X,')).toEqual(['X.X']);
        expect(parseTagFormat(',X.X')).toEqual(['X.X']);
      });
    });

    describe('edge cases', () => {
      it('should handle patterns with commas in them (not treated as separator)', () => {
        // If it starts with [, it's treated as JSON, not comma-separated
        expect(parseTagFormat('["pattern,with,commas"]')).toEqual(['pattern,with,commas']);
      });

      it('should handle complex patterns', () => {
        // In JSON strings, backslashes need to be escaped: \\ becomes \
        expect(parseTagFormat('["^v\\\\d+\\\\.\\\\d+$", "X.X"]')).toEqual(['^v\\d+\\.\\d+$', 'X.X']);
        // Comma-separated doesn't need escaping
        expect(parseTagFormat('^v\\d+\\.\\d+$,X.X')).toEqual(['^v\\d+\\.\\d+$', 'X.X']);
      });

      it('should prioritize JSON array over comma-separated', () => {
        // If it looks like JSON array (starts with [), parse as JSON
        expect(parseTagFormat('["*.*.*", "*.*"]')).toEqual(['*.*.*', '*.*']);
        // Even if it has commas, if it's valid JSON array, use JSON parsing
        expect(parseTagFormat('["a,b", "c,d"]')).toEqual(['a,b', 'c,d']);
      });
    });

    describe('real-world examples', () => {
      it('should parse example from use case (3-segment fallback to 2-segment)', () => {
        expect(parseTagFormat('["*.*.*", "*.*"]')).toEqual(['*.*.*', '*.*']);
        expect(parseTagFormat('*.*.*,*.*')).toEqual(['*.*.*', '*.*']);
      });

      it('should parse numeric pattern fallbacks', () => {
        expect(parseTagFormat('["X.X.X", "X.X"]')).toEqual(['X.X.X', 'X.X']);
        expect(parseTagFormat('X.X.X,X.X')).toEqual(['X.X.X', 'X.X']);
      });

      it('should parse mixed pattern types', () => {
        expect(parseTagFormat('["X.X.X", "X.X", "*.*"]')).toEqual(['X.X.X', 'X.X', '*.*']);
        expect(parseTagFormat('X.X.X,X.X,*.*')).toEqual(['X.X.X', 'X.X', '*.*']);
      });
    });
  });
});

