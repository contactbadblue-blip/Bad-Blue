/**
 * AI Artifact Caching System
 * MIGRATED: Now uses PostgreSQL-backed repository with in-memory LRU cache
 * Maintains backward compatibility with existing API
 */

import * as cacheRepo from './repositories/aiCacheRepository';

export interface CacheOptions {
  ttlMinutes?: number;
  taskInputs?: any;
}

export const getCached = cacheRepo.getCached;
export const setCached = cacheRepo.setCached;
export const invalidateCache = cacheRepo.invalidateCache;
export const cleanupExpiredCache = cacheRepo.cleanupExpiredCache;
export const getCacheStats = cacheRepo.getCacheStats;
