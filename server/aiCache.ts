/**
 * AI Artifact Caching System
 * Reduces redundant API calls by caching AI analysis results
 * Used by Worker and Sub-Agent for efficiency
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), 'data', 'ai_cache');

export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: string;
  expiresAt: string;
  taskSignature: string; // Hash of inputs that produced this result
}

export interface CacheOptions {
  ttlMinutes?: number; // Time to live in minutes (default: 60)
  taskInputs?: any;    // Inputs used to generate cache key
}

/**
 * Generate cache key from task name and inputs
 */
function generateCacheKey(taskName: string, inputs?: any): string {
  const signature = inputs ? JSON.stringify(inputs) : '';
  const hash = crypto.createHash('sha256').update(taskName + signature).digest('hex');
  return `${taskName}_${hash.substring(0, 16)}`;
}

/**
 * Get cached result if available and not expired
 */
export async function getCached<T>(
  taskName: string,
  options: CacheOptions = {}
): Promise<T | null> {
  try {
    const key = generateCacheKey(taskName, options.taskInputs);
    const filePath = path.join(CACHE_DIR, `${key}.json`);

    const content = await fs.readFile(filePath, 'utf-8');
    const entry: CacheEntry<T> = JSON.parse(content);

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(entry.expiresAt);

    if (now > expiresAt) {
      // Expired - delete cache file
      await fs.unlink(filePath).catch(() => {});
      return null;
    }

    console.log(`[AI Cache] Cache hit for ${taskName}`);
    return entry.value;
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.error('[AI Cache] Error reading cache:', error);
    }
    return null;
  }
}

/**
 * Store result in cache
 */
export async function setCached<T>(
  taskName: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });

    const key = generateCacheKey(taskName, options.taskInputs);
    const ttlMinutes = options.ttlMinutes || 60;
    const taskSignature = options.taskInputs ? JSON.stringify(options.taskInputs) : '';

    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString(),
      taskSignature,
    };

    const filePath = path.join(CACHE_DIR, `${key}.json`);
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2));

    console.log(`[AI Cache] Cached result for ${taskName} (TTL: ${ttlMinutes}min)`);
  } catch (error) {
    console.error('[AI Cache] Error writing cache:', error);
  }
}

/**
 * Invalidate cache for a specific task
 */
export async function invalidateCache(taskName: string, taskInputs?: any): Promise<void> {
  try {
    const key = generateCacheKey(taskName, taskInputs);
    const filePath = path.join(CACHE_DIR, `${key}.json`);
    await fs.unlink(filePath);
    console.log(`[AI Cache] Invalidated cache for ${taskName}`);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.error('[AI Cache] Error invalidating cache:', error);
    }
  }
}

/**
 * Clean up expired cache entries
 */
export async function cleanupExpiredCache(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const files = await fs.readdir(CACHE_DIR);
    const now = new Date();
    let cleaned = 0;

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const filePath = path.join(CACHE_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const entry: CacheEntry<any> = JSON.parse(content);

        const expiresAt = new Date(entry.expiresAt);
        if (now > expiresAt) {
          await fs.unlink(filePath);
          cleaned++;
        }
      } catch {
        // Skip invalid files
      }
    }

    if (cleaned > 0) {
      console.log(`[AI Cache] Cleaned up ${cleaned} expired cache entries`);
    }
  } catch (error) {
    console.error('[AI Cache] Error cleaning cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  expiredEntries: number;
  validEntries: number;
}> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const files = await fs.readdir(CACHE_DIR);
    const now = new Date();
    let expired = 0;
    let valid = 0;

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const filePath = path.join(CACHE_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const entry: CacheEntry<any> = JSON.parse(content);

        const expiresAt = new Date(entry.expiresAt);
        if (now > expiresAt) {
          expired++;
        } else {
          valid++;
        }
      } catch {
        // Skip invalid files
      }
    }

    return {
      totalEntries: expired + valid,
      expiredEntries: expired,
      validEntries: valid,
    };
  } catch (error) {
    console.error('[AI Cache] Error getting stats:', error);
    return { totalEntries: 0, expiredEntries: 0, validEntries: 0 };
  }
}
