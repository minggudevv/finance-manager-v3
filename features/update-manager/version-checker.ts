// Version Checker Utility
// Provides version comparison and validation utilities

/**
 * Compare two version strings
 * @param v1 First version string (e.g. "1.2.3")
 * @param v2 Second version string (e.g. "1.2.4")
 * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  
  return 0;
}

/**
 * Check if version v1 is greater than version v2
 * @param v1 First version string
 * @param v2 Second version string
 * @returns True if v1 > v2
 */
export function isVersionGreater(v1: string, v2: string): boolean {
  return compareVersions(v1, v2) > 0;
}

/**
 * Check if version v1 is greater than or equal to version v2
 * @param v1 First version string
 * @param v2 Second version string
 * @returns True if v1 >= v2
 */
export function isVersionGreaterOrEqual(v1: string, v2: string): boolean {
  return compareVersions(v1, v2) >= 0;
}

/**
 * Check if version v1 is less than version v2
 * @param v1 First version string
 * @param v2 Second version string
 * @returns True if v1 < v2
 */
export function isVersionLess(v1: string, v2: string): boolean {
  return compareVersions(v1, v2) < 0;
}

/**
 * Check if version v1 is less than or equal to version v2
 * @param v1 First version string
 * @param v2 Second version string
 * @returns True if v1 <= v2
 */
export function isVersionLessOrEqual(v1: string, v2: string): boolean {
  return compareVersions(v1, v2) <= 0;
}

/**
 * Check if a version follows semantic versioning format (X.Y.Z)
 * @param version Version string to validate
 * @returns True if version follows semantic versioning format
 */
export function isValidSemVer(version: string): boolean {
  const semVerRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)?$/;
  return semVerRegex.test(version);
}

/**
 * Parse version string into components
 * @param version Version string to parse
 * @returns Object with major, minor, patch components
 */
export function parseVersion(version: string): { major: number; minor: number; patch: number } | null {
  if (!isValidSemVer(version)) {
    return null;
  }
  
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

/**
 * Get the next major version
 * @param version Current version string
 * @returns Next major version string
 */
export function getNextMajorVersion(version: string): string {
  const parsed = parseVersion(version);
  if (!parsed) return version;
  
  return `${parsed.major + 1}.0.0`;
}

/**
 * Get the next minor version
 * @param version Current version string
 * @returns Next minor version string
 */
export function getNextMinorVersion(version: string): string {
  const parsed = parseVersion(version);
  if (!parsed) return version;
  
  return `${parsed.major}.${parsed.minor + 1}.0`;
}

/**
 * Get the next patch version
 * @param version Current version string
 * @returns Next patch version string
 */
export function getNextPatchVersion(version: string): string {
  const parsed = parseVersion(version);
  if (!parsed) return version;
  
  return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
}