/**
 * Platform-agnostic configuration helper
 * Abstracts Replit-specific environment variables for deployment anywhere
 */

/**
 * Get the base URL for the application
 * Supports multiple platforms:
 * - Custom BASE_URL environment variable (Railway, Heroku, etc.)
 * - Replit REPLIT_DOMAINS
 * - Local development fallback
 */
export function getBaseURL(): string {
  // Priority 1: Custom BASE_URL (Railway.com, Heroku, custom hosting)
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  // Priority 2: Replit REPLIT_DOMAINS (backwards compatibility)
  if (process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(",");
    return `https://${domains[0]}`;
  }

  // Priority 3: Local development fallback
  const port = process.env.PORT || 5000;
  return `http://localhost:${port}`;
}

/**
 * Check if running on Replit platform
 */
export function isReplitPlatform(): boolean {
  return Boolean(process.env.REPL_ID && process.env.REPLIT_DOMAINS);
}

/**
 * Check if object storage is available
 */
export function isObjectStorageAvailable(): boolean {
  return Boolean(
    process.env.PRIVATE_OBJECT_DIR &&
    process.env.PUBLIC_OBJECT_SEARCH_PATHS
  );
}

/**
 * Get platform name for logging
 */
export function getPlatformName(): string {
  if (isReplitPlatform()) return "Replit";
  if (process.env.RAILWAY_ENVIRONMENT) return "Railway";
  if (process.env.HEROKU_APP_NAME) return "Heroku";
  if (process.env.VERCEL) return "Vercel";
  return "Custom/Local";
}
