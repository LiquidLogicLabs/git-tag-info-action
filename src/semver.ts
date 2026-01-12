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
export function parseSemver(tagName: string): SemverParts | null {
  // Remove 'v' prefix if present
  const cleaned = tagName.replace(/^v/i, '');

  // Match semver pattern: major.minor.patch[-prerelease][+build]
  const semverRegex =
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;
  const match = cleaned.match(semverRegex);

  if (!match) {
    return null;
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
    build: match[5],
  };
}

/**
 * Check if tag name follows semantic versioning
 */
export function isSemver(tagName: string): boolean {
  return parseSemver(tagName) !== null;
}

/**
 * Compare two semantic version tags
 * Returns: -1 if tag1 < tag2, 0 if tag1 === tag2, 1 if tag1 > tag2
 */
export function compareSemver(tag1: string, tag2: string): number {
  const semver1 = parseSemver(tag1);
  const semver2 = parseSemver(tag2);

  // If either is not semver, they're equal for comparison purposes
  if (!semver1 || !semver2) {
    return 0;
  }

  // Compare major version
  if (semver1.major !== semver2.major) {
    return semver1.major > semver2.major ? 1 : -1;
  }

  // Compare minor version
  if (semver1.minor !== semver2.minor) {
    return semver1.minor > semver2.minor ? 1 : -1;
  }

  // Compare patch version
  if (semver1.patch !== semver2.patch) {
    return semver1.patch > semver2.patch ? 1 : -1;
  }

  // Compare prerelease versions
  if (semver1.prerelease && semver2.prerelease) {
    // Both have prerelease, compare lexicographically
    if (semver1.prerelease < semver2.prerelease) return -1;
    if (semver1.prerelease > semver2.prerelease) return 1;
    return 0;
  }

  // Version without prerelease is greater than version with prerelease
  if (semver1.prerelease && !semver2.prerelease) {
    return -1;
  }
  if (!semver1.prerelease && semver2.prerelease) {
    return 1;
  }

  // Versions are equal
  return 0;
}

/**
 * Sort tags by semantic version (highest first)
 */
export function sortTagsBySemver(tags: string[]): string[] {
  return [...tags].sort((a, b) => {
    const comparison = compareSemver(b, a); // Reverse for descending order
    if (comparison !== 0) {
      return comparison;
    }
    // If semver comparison is equal, maintain original order
    return 0;
  });
}

