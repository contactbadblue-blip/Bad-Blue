// Device-based rate limiting for officer searches
// Limit: 2 searches per device per 24 hours

import { createHash } from 'crypto';
import { db } from './db';
import { officerSearchDeviceLimits } from '@shared/schema';
import { and, gte, sql } from 'drizzle-orm';

const DAILY_SEARCH_LIMIT = 2;
const SEARCH_WINDOW_HOURS = 24;

/**
 * Generate device fingerprint from IP address and user agent
 */
export function generateDeviceFingerprint(ipAddress: string, userAgent: string): string {
  const data = `${ipAddress}|${userAgent}`;
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Extract IP address from request (handles proxies and load balancers)
 */
export function getClientIp(req: any): string {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Check if device has exceeded daily officer search limit
 * Returns { allowed: boolean, remaining: number, resetTime: Date }
 */
export async function checkDeviceSearchLimit(
  ipAddress: string,
  userAgent: string
): Promise<{ allowed: boolean; remaining: number; resetTime: Date; message?: string }> {
  try {
    const fingerprint = generateDeviceFingerprint(ipAddress, userAgent);
    
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
    console.error('[Device Rate Limit] Error checking limit:', error);
    // Allow on error to avoid blocking legitimate users
    return {
      allowed: true,
      remaining: DAILY_SEARCH_LIMIT,
      resetTime: new Date(Date.now() + SEARCH_WINDOW_HOURS * 60 * 60 * 1000),
    };
  }
}

/**
 * Record an officer search attempt for rate limiting
 */
export async function recordDeviceSearch(
  ipAddress: string,
  userAgent: string,
  officerName: string,
  userId?: string
): Promise<void> {
  try {
    const fingerprint = generateDeviceFingerprint(ipAddress, userAgent);
    
    await db.insert(officerSearchDeviceLimits).values({
      deviceFingerprint: fingerprint,
      ipAddress,
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
