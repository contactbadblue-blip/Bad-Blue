/**
 * Platform-agnostic configuration helper
 * Abstracts environment variables for deployment anywhere
 */

/**
 * Get the base URL for the application
 * Supports multiple platforms:
 * - Custom BASE_URL environment variable (Railway, Heroku, AWS, etc.)
 * - Platform-specific domain variables
 * - Local development fallback
 */
export function getBaseURL(): string {
  // Priority 1: Custom BASE_URL (Railway, Heroku, AWS, custom hosting)
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  // Priority 2: Railway or other platforms
  const port = process.env.PORT || 5000;
  
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  
  if (process.env.HEROKU_APP_NAME) {
    return `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;
  }
  
  // Priority 3: Local development fallback
  return `http://localhost:${port}`;
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
  if (process.env.RAILWAY_ENVIRONMENT) return "Railway";
  if (process.env.HEROKU_APP_NAME) return "Heroku";
  if (process.env.VERCEL) return "Vercel";
  if (process.env.AWS_REGION) return "AWS";
  return "Custom/Local";
}
