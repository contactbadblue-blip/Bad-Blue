/**
 * AI Cache Repository
 * PostgreSQL-backed caching with in-memory LRU layer for performance
 * Migration-ready: Replaces filesystem data/ai_cache/*.json
 */

import { LRUCache } from 'lru-cache';
import { db } from '../db';
import { aiCacheEntries, type InsertAiCacheEntry, type AiCacheEntry } from '../../shared/schema';
import { eq, lt } from 'drizzle-orm';
import crypto from 'crypto';

const MAX_MEMORY_CACHE_SIZE = 100;
const MEMORY_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const memoryCache = new LRUCache<string, any>({
  max: MAX_MEMORY_CACHE_SIZE,
  ttl: MEMORY_CACHE_TTL_MS,
  updateAgeOnGet: true,
  updateAgeOnHas: true,
});

export interface CacheOptions {
  ttlMinutes?: number;
  taskInputs?: any;
}

function generateCacheKey(taskName: string, inputs?: any): string {
  const signature = inputs ? JSON.stringify(inputs) : '';
  const hash = crypto.createHash('sha256').update(taskName + signature).digest('hex');
  return `${taskName}_${hash.substring(0, 16)}`;
}

function generateTaskSignature(inputs?: any): string {
  return inputs ? crypto.createHash('sha256').update(JSON.stringify(inputs)).digest('hex') : '';
}

export async function getCached<T>(
  taskName: string,
  options: CacheOptions = {}
): Promise<T | null> {
  try {
    const cacheKey = generateCacheKey(taskName, options.taskInputs);

    const memoryCached = memoryCache.get(cacheKey);
    if (memoryCached !== undefined) {
      console.log(`[AI Cache] Memory cache hit for ${taskName}`);
      return memoryCached as T;
    }

    const [entry] = await db
      .select()
      .from(aiCacheEntries)
      .where(eq(aiCacheEntries.cacheKey, cacheKey))
      .limit(1);

    if (!entry) {
      return null;
    }

    const now = new Date();
    const expiresAt = new Date(entry.expiresAt);

    if (now > expiresAt) {
      await db.delete(aiCacheEntries).where(eq(aiCacheEntries.id, entry.id));
      memoryCache.delete(cacheKey);
      return null;
    }

    memoryCache.set(cacheKey, entry.value);
    console.log(`[AI Cache] Database cache hit for ${taskName}`);
    return entry.value as T;
  } catch (error: any) {
    console.error('[AI Cache] Error reading cache:', error);
    return null;
  }
}

export async function setCached<T>(
  taskName: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  try {
    const cacheKey = generateCacheKey(taskName, options.taskInputs);
    const ttlMinutes = options.ttlMinutes || 60;
    const taskSignature = generateTaskSignature(options.taskInputs);

    const newEntry: InsertAiCacheEntry = {
      cacheKey,
      taskName,
      taskSignature: taskSignature || null,
      value: value as any,
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
    };

    await db
      .insert(aiCacheEntries)
      .values(newEntry)
      .onConflictDoUpdate({
        target: aiCacheEntries.cacheKey,
        set: {
          value: newEntry.value,
          expiresAt: newEntry.expiresAt,
          taskSignature: newEntry.taskSignature,
        },
      });

    memoryCache.set(cacheKey, value);
    console.log(`[AI Cache] Cached result for ${taskName} (TTL: ${ttlMinutes}min)`);
  } catch (error) {
    console.error('[AI Cache] Error writing cache (degrading gracefully):', error);
  }
}

export async function invalidateCache(taskName: string, taskInputs?: any): Promise<void> {
  try {
    const cacheKey = generateCacheKey(taskName, taskInputs);

    await db.delete(aiCacheEntries).where(eq(aiCacheEntries.cacheKey, cacheKey));

    memoryCache.delete(cacheKey);
    console.log(`[AI Cache] Invalidated cache for ${taskName}`);
  } catch (error: any) {
    console.error('[AI Cache] Error invalidating cache:', error);
  }
}

export async function cleanupExpiredCache(): Promise<number> {
  try {
    const now = new Date();
    const result = await db.delete(aiCacheEntries).where(lt(aiCacheEntries.expiresAt, now));

    const cleaned = result.rowCount || 0;
    if (cleaned > 0) {
      console.log(`[AI Cache] Cleaned up ${cleaned} expired cache entries from database`);
    }
    return cleaned;
  } catch (error) {
    console.error('[AI Cache] Error cleaning cache:', error);
    return 0;
  }
}

export async function getCacheStats(): Promise<{
  totalEntries: number;
  memoryEntries: number;
}> {
  try {
    const allEntries = await db.select().from(aiCacheEntries);
    return {
      totalEntries: allEntries.length,
      memoryEntries: memoryCache.size,
    };
  } catch (error) {
    console.error('[AI Cache] Error getting stats:', error);
    return { totalEntries: 0, memoryEntries: 0 };
  }
}
