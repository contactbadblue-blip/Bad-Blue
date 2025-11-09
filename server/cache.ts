// Simple In-Memory Caching Layer
// For production with multiple servers, use Redis instead
// Optimized for 500+ concurrent users

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;

    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in cache with TTL
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // Evict oldest entry if at max size
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlSeconds * 1000),
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Delete all entries matching pattern
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  stats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const cache = new SimpleCache(1000); // Store up to 1000 cached items

/**
 * Memoize function results with caching
 * 
 * @param fn Function to memoize
 * @param keyGenerator Function to generate cache key from arguments
 * @param ttlSeconds Time to live in seconds
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttlSeconds: number = 300
): T {
  return ((...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    // Try to get from cache
    const cached = cache.get<ReturnType<T>>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = fn(...args);
    
    // Handle promises
    if (result && typeof result.then === 'function') {
      return result.then((data: any) => {
        cache.set(key, data, ttlSeconds);
        return data;
      });
    }

    // Cache synchronous result
    cache.set(key, result, ttlSeconds);
    return result;
  }) as T;
}

// Common cache key patterns
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userProfile: (userId: string) => `user_profile:${userId}`,
  petition: (petitionId: string) => `petition:${petitionId}`,
  complaint: (complaintId: string) => `complaint:${complaintId}`,
  lawsuit: (lawsuitId: string) => `lawsuit:${lawsuitId}`,
  foiaRequest: (foiaId: string) => `foia:${foiaId}`,
  statute: (state: string) => `statute:${state}`,
};
