// Device-based rate limiting for officer searches
// Limit: 2 searches per device per 24 hours

import { createHash } from 'crypto';
import { db } from './db';
import { officerSearchDeviceLimits } from '@shared/schema';
import { and, gte, sql } from 'drizzle-orm';

const DAILY_SEARCH_LIMIT = 2;
const SEARCH_WINDOW_HOURS = 24;

/**
 * Generate device fingerprint from IP address, user agent, and device ID cookie
 * Uses multiple factors for more reliable device identification
 */
export function generateDeviceFingerprint(
  ipAddress: string | null, 
  userAgent: string, 
  deviceId?: string
): string {
  // Use device ID cookie as primary identifier, IP as secondary
  const data = `${deviceId || 'no-device-id'}|${ipAddress || 'no-ip'}|${userAgent || 'no-ua'}`;
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Extract or generate device ID from cookies
 * Device ID is a persistent identifier stored in a cookie
 */
export function getOrCreateDeviceId(req: any, res: any): string {
  const existingDeviceId = req.cookies?.['badblue_device_id'];
  
  if (existingDeviceId && typeof existingDeviceId === 'string' && existingDeviceId.length === 36) {
    return existingDeviceId;
  }
  
  // Generate new device ID (UUID v4 format)
  const newDeviceId = createHash('sha256')
    .update(`${Date.now()}${Math.random()}${req.headers['user-agent'] || ''}`)
    .digest('hex')
    .substring(0, 36);
  
  // Set cookie with 1 year expiration
  res.cookie('badblue_device_id', newDeviceId, {
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  
  return newDeviceId;
}

/**
 * Extract IP address from request (handles proxies and load balancers)
 * Returns null if IP cannot be reliably determined
 */
export function getClientIp(req: any): string | null {
  const ip = 
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.headers['cf-connecting-ip'] || // Cloudflare
    req.headers['x-client-ip'] || // Generic proxy
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    null;
  
  // Filter out localhost/private IPs in production  
  if (ip && (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.'))) {
    // In development, these are acceptable
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }
  }
  
  return ip;
}

/**
 * Check if device has exceeded daily officer search limit
 * Returns { allowed: boolean, remaining: number, resetTime: Date }
 * FAIL CLOSED: Returns allowed=false on database errors to prevent bypass
 */
export async function checkDeviceSearchLimit(
  ipAddress: string | null,
  userAgent: string,
  deviceId: string
): Promise<{ allowed: boolean; remaining: number; resetTime: Date; message?: string; error?: string }> {
  try {
    // Reject if we can't reliably identify the device
    if (!ipAddress && !deviceId) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + SEARCH_WINDOW_HOURS * 60 * 60 * 1000),
        message: 'Unable to verify device identity. Please enable cookies or check your network connection.',
        error: 'NO_DEVICE_ID_OR_IP'
      };
    }
    
    const fingerprint = generateDeviceFingerprint(ipAddress, userAgent, deviceId);
    
    // Calculate 24-hour window
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - SEARCH_WINDOW_HOURS);
    
    // Count searches in last 24 hours for this device
    const recentSearches = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(officerSearchDeviceLimits)
      .where(
        and(
          sql`${officerSearchDeviceLimits.deviceFingerprint} = ${fingerprint}`,
          gte(officerSearchDeviceLimits.searchedAt, windowStart)
        )
      );
    
    const searchCount = recentSearches[0]?.count || 0;
    const remaining = Math.max(0, DAILY_SEARCH_LIMIT - searchCount);
    const allowed = searchCount < DAILY_SEARCH_LIMIT;
    
    // Reset time is 24 hours from the earliest search in the window
    const earliestSearch = await db
      .select({ searchedAt: officerSearchDeviceLimits.searchedAt })
      .from(officerSearchDeviceLimits)
      .where(
        and(
          sql`${officerSearchDeviceLimits.deviceFingerprint} = ${fingerprint}`,
          gte(officerSearchDeviceLimits.searchedAt, windowStart)
        )
      )
      .orderBy(officerSearchDeviceLimits.searchedAt)
      .limit(1);
    
    const resetTime = earliestSearch[0]?.searchedAt
      ? new Date(earliestSearch[0].searchedAt.getTime() + SEARCH_WINDOW_HOURS * 60 * 60 * 1000)
      : new Date(Date.now() + SEARCH_WINDOW_HOURS * 60 * 60 * 1000);
    
    const message = allowed
      ? undefined
      : `Daily search limit reached (${DAILY_SEARCH_LIMIT} searches per 24 hours). Limit resets at ${resetTime.toLocaleString()}.`;
    
    console.log(
      `[Device Rate Limit] Fingerprint: ${fingerprint.substring(0, 12)}... | Searches: ${searchCount}/${DAILY_SEARCH_LIMIT} | Allowed: ${allowed}`
    );
    
    return { allowed, remaining, resetTime, message };
  } catch (error) {
    console.error('[Device Rate Limit] Database error checking limit - FAIL CLOSED:', error);
    // FAIL CLOSED: Block on database error to prevent bypass via DoS
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(Date.now() + SEARCH_WINDOW_HOURS * 60 * 60 * 1000),
      message: 'Rate limit system temporarily unavailable. Please try again in a few moments.',
      error: 'DATABASE_ERROR'
    };
  }
}

/**
 * Record an officer search attempt for rate limiting
 */
export async function recordDeviceSearch(
  ipAddress: string | null,
  userAgent: string,
  deviceId: string,
  officerName: string,
  userId?: string
): Promise<void> {
  try {
    const fingerprint = generateDeviceFingerprint(ipAddress, userAgent, deviceId);
    
    await db.insert(officerSearchDeviceLimits).values({
      deviceFingerprint: fingerprint,
      ipAddress: ipAddress || 'unknown',
      userAgent,
      userId,
      officerName,
    });
    
    console.log(
      `[Device Rate Limit] Recorded search for device ${fingerprint.substring(0, 12)}... | Officer: ${officerName}`
    );
  } catch (error) {
    console.error('[Device Rate Limit] Error recording search:', error);
    // Don't throw - logging the search is not critical
  }
}

/**
 * Cleanup old search records (older than 48 hours)
 * Called periodically by data cleanup system
 */
export async function cleanupOldSearchRecords(): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 48); // Keep 48 hours of history
    
    const result = await db
      .delete(officerSearchDeviceLimits)
      .where(sql`${officerSearchDeviceLimits.searchedAt} < ${cutoffDate}`)
      .returning({ id: officerSearchDeviceLimits.id });
    
    const deletedCount = result.length;
    
    if (deletedCount > 0) {
      console.log(`[Device Rate Limit] Cleaned up ${deletedCount} old search records`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('[Device Rate Limit] Error during cleanup:', error);
    return 0;
  }
}

/**
 * Get device search statistics for admin panel
 */
export async function getDeviceSearchStats(): Promise<{
  totalRecords: number;
  last24Hours: number;
  uniqueDevices24h: number;
}> {
  try {
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - 24);
    
    const [totalCount, recentCount, uniqueDevices] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(officerSearchDeviceLimits),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(officerSearchDeviceLimits)
        .where(gte(officerSearchDeviceLimits.searchedAt, windowStart)),
      db
        .select({ count: sql<number>`count(distinct ${officerSearchDeviceLimits.deviceFingerprint})::int` })
        .from(officerSearchDeviceLimits)
        .where(gte(officerSearchDeviceLimits.searchedAt, windowStart)),
    ]);
    
    return {
      totalRecords: totalCount[0]?.count || 0,
      last24Hours: recentCount[0]?.count || 0,
      uniqueDevices24h: uniqueDevices[0]?.count || 0,
    };
  } catch (error) {
    console.error('[Device Rate Limit] Error getting stats:', error);
    return { totalRecords: 0, last24Hours: 0, uniqueDevices24h: 0 };
  }
}
