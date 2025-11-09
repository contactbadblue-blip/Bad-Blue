/**
 * Intelligent Rate Limit Tracker for AI Services
 * Monitors API usage and predicts when to switch providers proactively
 */

interface RateLimitState {
  requestCount: number;
  errorCount: number;
  consecutiveErrors: number;
  lastResetTime: number;
  lastErrorTime: number | null;
  isNearLimit: boolean;
}

class RateLimitTracker {
  private geminiState: RateLimitState = {
    requestCount: 0,
    errorCount: 0,
    consecutiveErrors: 0,
    lastResetTime: Date.now(),
    lastErrorTime: null,
    isNearLimit: false,
  };

  // Rate limit thresholds
  private readonly RESET_INTERVAL = 60000; // 1 minute
  private readonly MAX_REQUESTS_PER_MINUTE = 45; // More conservative (was 50)
  private readonly NEAR_LIMIT_THRESHOLD = 0.90; // 90% of limit - switch to Groq
  private readonly CONSECUTIVE_ERROR_THRESHOLD = 2; // More sensitive (was 3)
  private lastResetCheckTime = 0;
  private readonly RESET_CHECK_INTERVAL = 5000; // Check every 5 seconds if we can switch back to Gemini

  /**
   * Check if we should use Groq instead of Gemini proactively
   * Automatically switches back to Gemini after rate limit reset
   */
  shouldUseGroq(): boolean {
    this.resetIfNeeded();
    this.checkForGeminiReactivation();
    
    // Use Groq if we've had consecutive errors
    if (this.geminiState.consecutiveErrors >= this.CONSECUTIVE_ERROR_THRESHOLD) {
      console.log('[Rate Limit] Using Groq due to consecutive Gemini errors');
      return true;
    }

    // Use Groq if we're near the rate limit (90% threshold)
    if (this.geminiState.isNearLimit) {
      console.log('[Rate Limit] Using Groq - Gemini near 90% rate limit');
      return true;
    }

    // Use Groq if last error was recent (within 2 minutes)
    if (this.geminiState.lastErrorTime && 
        Date.now() - this.geminiState.lastErrorTime < 120000) { // 2 minutes
      console.log('[Rate Limit] Using Groq - recent Gemini error');
      return true;
    }

    return false;
  }

  /**
   * Automatically check if we can switch back to Gemini
   * Called every 5 seconds to monitor rate limit reset
   */
  private checkForGeminiReactivation(): void {
    const now = Date.now();
    
    // Only check every 5 seconds
    if (now - this.lastResetCheckTime < this.RESET_CHECK_INTERVAL) {
      return;
    }
    
    this.lastResetCheckTime = now;
    
    // If we were using Groq due to rate limits, check if Gemini is ready
    if (this.geminiState.isNearLimit || this.geminiState.consecutiveErrors > 0) {
      // Check if enough time has passed since last reset
      const timeSinceReset = now - this.geminiState.lastResetTime;
      
      // If a full minute has passed, we can try Gemini again
      if (timeSinceReset >= this.RESET_INTERVAL) {
        console.log('[Rate Limit] Gemini rate limit should be reset - reactivating Gemini');
        this.geminiState.isNearLimit = false;
        this.geminiState.consecutiveErrors = 0;
        this.geminiState.requestCount = 0;
        this.geminiState.lastResetTime = now;
      }
    }
  }

  /**
   * Record a successful Gemini request
   */
  recordSuccess(): void {
    this.resetIfNeeded();
    this.geminiState.requestCount++;
    this.geminiState.consecutiveErrors = 0;
    this.updateNearLimitStatus();
  }

  /**
   * Record a failed Gemini request
   */
  recordError(error: any): void {
    this.resetIfNeeded();
    this.geminiState.errorCount++;
    this.geminiState.consecutiveErrors++;
    this.geminiState.lastErrorTime = Date.now();

    // Check if it's a rate limit error
    const isRateLimitError = 
      error?.message?.includes('quota') ||
      error?.message?.includes('rate limit') ||
      error?.message?.includes('429') ||
      error?.status === 429;

    if (isRateLimitError) {
      this.geminiState.isNearLimit = true;
      console.log('[Rate Limit] Gemini rate limit detected - switching to Groq');
    }

    this.updateNearLimitStatus();
  }

  /**
   * Get current rate limit statistics
   */
  getStats() {
    this.resetIfNeeded();
    return {
      requests: this.geminiState.requestCount,
      errors: this.geminiState.errorCount,
      consecutiveErrors: this.geminiState.consecutiveErrors,
      isNearLimit: this.geminiState.isNearLimit,
      utilizationPercent: (this.geminiState.requestCount / this.MAX_REQUESTS_PER_MINUTE) * 100,
    };
  }

  /**
   * Reset counters if interval has passed
   */
  private resetIfNeeded(): void {
    const now = Date.now();
    if (now - this.geminiState.lastResetTime >= this.RESET_INTERVAL) {
      this.geminiState.requestCount = 0;
      this.geminiState.errorCount = 0;
      this.geminiState.lastResetTime = now;
      
      // Don't reset consecutive errors or isNearLimit immediately
      // Give more buffer time for rate limits to clear
      if (now - (this.geminiState.lastErrorTime || 0) > 300000) { // 5 minutes (was 2)
        this.geminiState.consecutiveErrors = 0;
        this.geminiState.isNearLimit = false;
      }
    }
  }

  /**
   * Update near-limit status based on request count
   */
  private updateNearLimitStatus(): void {
    const utilization = this.geminiState.requestCount / this.MAX_REQUESTS_PER_MINUTE;
    this.geminiState.isNearLimit = utilization >= this.NEAR_LIMIT_THRESHOLD;
  }

  /**
   * Manually reset rate limit status (for admin/testing)
   */
  reset(): void {
    this.geminiState = {
      requestCount: 0,
      errorCount: 0,
      consecutiveErrors: 0,
      lastResetTime: Date.now(),
      lastErrorTime: null,
      isNearLimit: false,
    };
    console.log('[Rate Limit] Tracker reset');
  }
}

// Singleton instance
export const rateLimitTracker = new RateLimitTracker();
