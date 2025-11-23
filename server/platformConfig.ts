/**
 * Platform-agnostic configuration helper
 * Abstracts environment variables for deployment anywhere
 */

/**
 * Determine if running on Railway platform
 */
export function isRailwayPlatform(): boolean {
  return !!(
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_PUBLIC_DOMAIN
  );
}

/**
 * Get the appropriate base URL based on the platform
 */
export function getBaseURL(): string {
  // Use custom BASE_URL if set (for any platform)
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  // Railway deployment
  if (isRailwayPlatform()) {
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }
  }

  // Default to localhost for development
  return 'http://localhost:5000';
}

/**
 * Determine if object storage is available
 * This is used for graceful degradation when object storage isn't configured
 * Note: Object storage requires Google Cloud Storage credentials
 */
export function isObjectStorageAvailable(): boolean {
  return !!(
    process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    process.env.PRIVATE_OBJECT_DIR
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