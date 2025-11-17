/**
 * AI Token Governor Module - Database-Integrated Version
 * Enforces strict 15% limit for autonomous functions on Groq
 * Implements Gemini-first for users, Groq-only for autonomous
 * 
 * FULLY INTEGRATED WITH DATABASE - No JSON file storage
 * Thread-safe for concurrent requests
 */

import * as tokenMetrics from './repositories/tokenMetricsRepository';
import { rateLimitTracker } from './rateLimitTracker';

/**
 * Task classification for AI operations
 */
export enum TaskPriority {
  CRITICAL_USER = 100,      // User-facing features (LegalAI, Officer Search)
  HIGH_USER = 80,           // User secondary features (document generation)
  MEDIUM_BACKGROUND = 50,   // Worker critical monitoring
  LOW_BACKGROUND = 30,      // Worker diagnostics
  LOWEST_MAINTENANCE = 10,  // Sub-Agent improvement cycles
}

export enum TaskComplexity {
  LIGHTWEIGHT = 'lightweight',     // Simple checks, status updates
  MODERATE = 'moderate',           // Standard analysis
  COMPREHENSIVE = 'comprehensive', // Deep investigation, multiple passes
}

export enum AIProvider {
  GEMINI = 'gemini',
  GROQ = 'groq',
}

export enum UsageContext {
  USER = 'user',           // User-initiated actions
  AUTONOMOUS = 'autonomous' // Autonomous worker/sub-agent actions
}

/**
 * Task classification metadata
 */
export interface AITaskMetadata {
  taskName: string;
  priority: TaskPriority;
  complexity: TaskComplexity;
  isUserFacing: boolean;
  expectedTokens?: number;
  allowDeferral: boolean; // Can this task be deferred if quotas are tight?
  context: UsageContext;  // Track if this is user or autonomous
}

/**
 * Token budget allocated for a task
 */
export interface TokenBudget {
  provider: AIProvider;
  maxTokens: number;
  verbosityLevel: 'concise' | 'standard' | 'detailed';
  shouldProceed: boolean;
  deferralReason?: string;
}

interface QuotaStatus {
  gemini: { 
    used: number; 
    limit: number; 
    percentUsed: number;
    userUsed: number;
    autonomousUsed: number; // Should be 0 - autonomous shouldn't use Gemini
  };
  groq: { 
    used: number; 
    limit: number; 
    percentUsed: number;
    userUsed: number;
    autonomousUsed: number;
    autonomousLimit: number; // 15% of daily limit
    autonomousPercentUsed: number;
  };
}

class AITokenGovernorEnhanced {
  private static instance: AITokenGovernorEnhanced;
  private readonly AUTONOMOUS_GROQ_LIMIT_PERCENT = 35; // 35% for autonomous - increased to give workers/sub-agents more resources while still prioritizing user AI needs
  private readonly GROQ_DAILY_TOKEN_LIMIT = 100000;
  private readonly GEMINI_DAILY_REQUEST_LIMIT = 50;

  private constructor() {
    // No file loading - database is the source of truth
  }

  static getInstance(): AITokenGovernorEnhanced {
    if (!this.instance) {
      this.instance = new AITokenGovernorEnhanced();
    }
    return this.instance;
  }

  /**
   * Check if autonomous functions can use Groq (15% limit)
   * Uses database for thread-safe concurrent access
   */
  public async canAutonomousUseGroq(): Promise<boolean> {
    try {
      // Get autonomous usage from database for today
      const autonomousUsage = await tokenMetrics.getTodayUsageBySource('groq', 'worker');
      const autonomousLimit = Math.floor((this.GROQ_DAILY_TOKEN_LIMIT * this.AUTONOMOUS_GROQ_LIMIT_PERCENT) / 100);
      
      const canUse = autonomousUsage.tokens < autonomousLimit;
      
      if (!canUse) {
        console.log(`[AI Governor] ⛔ Autonomous Groq limit reached: ${autonomousUsage.tokens}/${autonomousLimit} tokens (${this.AUTONOMOUS_GROQ_LIMIT_PERCENT}% of daily limit)`);
        console.log(`[AI Governor] Autonomous functions will resume after daily reset at midnight UTC`);
      }
      
      return canUse;
    } catch (error) {
      console.error('[AI Governor] Error checking autonomous Groq limit:', error);
      return false; // Fail safe - don't allow if we can't check
    }
  }

  /**
   * Get quota status including autonomous tracking
   * All data from database - no file reads
   */
  public async getQuotaStatus(): Promise<QuotaStatus> {
    try {
      // Get all usage data from database
      const [
        geminiTotal,
        groqTotal,
        geminiUser,
        groqUser,
        groqAutonomous
      ] = await Promise.all([
        tokenMetrics.getTodayUsage('gemini'),
        tokenMetrics.getTodayUsage('groq'),
        tokenMetrics.getTodayUsageBySource('gemini', 'user'),
        tokenMetrics.getTodayUsageBySource('groq', 'user'),
        tokenMetrics.getTodayUsageBySource('groq', 'worker')
      ]);

      const autonomousLimit = Math.floor((this.GROQ_DAILY_TOKEN_LIMIT * this.AUTONOMOUS_GROQ_LIMIT_PERCENT) / 100);

      return {
        gemini: {
          used: geminiTotal.requests,
          limit: this.GEMINI_DAILY_REQUEST_LIMIT,
          percentUsed: (geminiTotal.requests / this.GEMINI_DAILY_REQUEST_LIMIT) * 100,
          userUsed: geminiUser.requests,
          autonomousUsed: 0 // Autonomous should never use Gemini
        },
        groq: {
          used: groqTotal.tokens,
          limit: this.GROQ_DAILY_TOKEN_LIMIT,
          percentUsed: (groqTotal.tokens / this.GROQ_DAILY_TOKEN_LIMIT) * 100,
          userUsed: groqUser.tokens,
          autonomousUsed: groqAutonomous.tokens,
          autonomousLimit: autonomousLimit,
          autonomousPercentUsed: (groqAutonomous.tokens / autonomousLimit) * 100
        }
      };
    } catch (error) {
      console.error('[AI Governor] Error getting quota status:', error);
      // Return conservative defaults on error
      return {
        gemini: {
          used: 0,
          limit: this.GEMINI_DAILY_REQUEST_LIMIT,
          percentUsed: 0,
          userUsed: 0,
          autonomousUsed: 0
        },
        groq: {
          used: 0,
          limit: this.GROQ_DAILY_TOKEN_LIMIT,
          percentUsed: 0,
          userUsed: 0,
          autonomousUsed: 0,
          autonomousLimit: Math.floor((this.GROQ_DAILY_TOKEN_LIMIT * this.AUTONOMOUS_GROQ_LIMIT_PERCENT) / 100),
          autonomousPercentUsed: 0
        }
      };
    }
  }

  /**
   * Select provider based on new rules:
   * - Autonomous: Groq ONLY (if under 15% limit)
   * - User: Gemini FIRST, Groq as backup
   * Also checks rateLimitTracker for rate limit status
   */
  private async selectProvider(task: AITaskMetadata, quotaStatus: QuotaStatus): Promise<AIProvider | null> {
    // RULE 1: Autonomous functions MUST use Groq (if under 15% limit)
    if (task.context === UsageContext.AUTONOMOUS) {
      const canUseGroq = await this.canAutonomousUseGroq();
      return canUseGroq ? AIProvider.GROQ : null; // Defer if over limit
    }

    // RULE 2: User functions use Gemini FIRST, Groq as backup
    const geminiExhausted = quotaStatus.gemini.percentUsed >= 95;
    const groqUserQuotaAvailable = quotaStatus.groq.percentUsed < 95;

    // Check rate limit status from rateLimitTracker
    const shouldUseGroqForRateLimit = rateLimitTracker.shouldUseGroq();

    // If rate limited on Gemini, use Groq
    if (shouldUseGroqForRateLimit && groqUserQuotaAvailable) {
      console.log('[AI Governor] Gemini rate limited, using Groq for user request');
      return AIProvider.GROQ;
    }

    // Try Gemini first for user requests
    if (!geminiExhausted && !shouldUseGroqForRateLimit) {
      return AIProvider.GEMINI;
    }

    // Fall back to Groq for user requests if Gemini exhausted
    if (groqUserQuotaAvailable) {
      console.log('[AI Governor] Gemini exhausted, falling back to Groq for user request');
      return AIProvider.GROQ;
    }

    // Both exhausted for user requests
    return null;
  }

  /**
   * Get budget for a task with new autonomous limits
   */
  public async getBudgetForTask(task: AITaskMetadata): Promise<TokenBudget> {
    try {
      const quotaStatus = await this.getQuotaStatus();
      
      // Check autonomous limit first
      if (task.context === UsageContext.AUTONOMOUS) {
        const canUseGroq = await this.canAutonomousUseGroq();
        if (!canUseGroq) {
          const nextReset = this.getNextResetTime();
          return {
            provider: AIProvider.GROQ,
            maxTokens: 0,
            verbosityLevel: 'concise',
            shouldProceed: false,
            deferralReason: `Autonomous Groq limit (15%) reached. Will resume at ${nextReset.toISOString()}`
          };
        }
      }

      const provider = await this.selectProvider(task, quotaStatus);
      
      if (!provider) {
        return {
          provider: AIProvider.GEMINI,
          maxTokens: 0,
          verbosityLevel: 'concise',
          shouldProceed: false,
          deferralReason: 'API quotas exhausted'
        };
      }

      // Calculate max tokens based on complexity and remaining quota
      const maxTokens = this.calculateMaxTokens(task, provider, quotaStatus);
      const verbosity = this.determineVerbosity(maxTokens, task.priority);

      return {
        provider,
        maxTokens,
        verbosityLevel: verbosity,
        shouldProceed: true
      };
    } catch (error) {
      console.error('[AI Governor] Error getting budget:', error);
      // Default to conservative settings on error
      return {
        provider: AIProvider.GEMINI,
        maxTokens: 1000,
        verbosityLevel: 'concise',
        shouldProceed: true
      };
    }
  }

  private calculateMaxTokens(
    task: AITaskMetadata,
    provider: AIProvider,
    quotaStatus: QuotaStatus
  ): number {
    const complexityBudgets = {
      [TaskComplexity.LIGHTWEIGHT]: 500,
      [TaskComplexity.MODERATE]: 2000,
      [TaskComplexity.COMPREHENSIVE]: 8000,
    };

    let baseTokens = task.expectedTokens || complexityBudgets[task.complexity];

    // Reduce tokens if running low on quota
    if (provider === AIProvider.GROQ) {
      if (task.context === UsageContext.AUTONOMOUS) {
        // For autonomous, check against 15% limit
        const percentRemaining = 100 - quotaStatus.groq.autonomousPercentUsed;
        if (percentRemaining < 20) {
          baseTokens = Math.floor(baseTokens * 0.5); // Use less when close to limit
        }
      } else {
        // For users, check against total limit
        const percentRemaining = 100 - quotaStatus.groq.percentUsed;
        if (percentRemaining < 10) {
          baseTokens = Math.floor(baseTokens * 0.6);
        }
      }
    }

    return baseTokens;
  }

  private determineVerbosity(maxTokens: number, priority: TaskPriority): 'concise' | 'standard' | 'detailed' {
    if (priority >= TaskPriority.HIGH_USER) {
      return maxTokens >= 5000 ? 'detailed' : 'standard';
    }
    if (maxTokens < 1000) return 'concise';
    if (maxTokens < 3000) return 'standard';
    return 'detailed';
  }

  /**
   * Record usage with context tracking
   * All data goes to database - no file writes
   */
  public async recordUsage(
    taskName: string,
    provider: AIProvider,
    tokensUsed: number,
    context: UsageContext,
    latencyMs: number | null,
    success: boolean,
    verbosity: 'concise' | 'standard' | 'detailed',
    priority: TaskPriority,
    errorMessage?: string
  ): Promise<void> {
    try {
      // Map context to source for database
      const source = context === UsageContext.AUTONOMOUS ? 'worker' : 'user';

      // Record to database with full context
      await tokenMetrics.recordUsage({
        taskName,
        provider,
        tokensUsed,
        latencyMs,
        success,
        verbosity,
        priority,
        errorMessage,
        source,
      });

      // Log autonomous usage for monitoring
      if (provider === AIProvider.GROQ && context === UsageContext.AUTONOMOUS) {
        const autonomousUsage = await tokenMetrics.getTodayUsageBySource('groq', 'worker');
        const autonomousLimit = Math.floor((this.GROQ_DAILY_TOKEN_LIMIT * this.AUTONOMOUS_GROQ_LIMIT_PERCENT) / 100);
        console.log(`[AI Governor] Autonomous Groq usage: ${autonomousUsage.tokens}/${autonomousLimit} (${Math.round((autonomousUsage.tokens / autonomousLimit) * 100)}%)`);
      }

      // Warn if autonomous uses Gemini (violation)
      if (provider === AIProvider.GEMINI && context === UsageContext.AUTONOMOUS) {
        console.error('[AI Governor] ⚠️ VIOLATION: Autonomous function used Gemini! This violates the rules.');
      }

      // Update rate limit tracker for success/failure
      if (provider === AIProvider.GEMINI) {
        if (success) {
          rateLimitTracker.recordGeminiSuccess();
        } else if (errorMessage) {
          rateLimitTracker.recordGeminiError(new Error(errorMessage));
        }
      } else if (provider === AIProvider.GROQ) {
        if (success) {
          rateLimitTracker.recordGroqSuccess(tokensUsed);
        } else if (errorMessage) {
          rateLimitTracker.recordGroqError(new Error(errorMessage));
        }
      }
    } catch (error) {
      console.error('[AI Governor] Error recording usage:', error);
      // Don't throw - recording errors shouldn't break the application
    }
  }

  /**
   * Get next reset time (midnight UTC)
   */
  public getNextResetTime(): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Check if autonomous functions should be rescheduled
   */
  public async shouldRescheduleAutonomous(): Promise<{
    shouldReschedule: boolean;
    delayMs: number;
    reason: string;
  }> {
    const canUse = await this.canAutonomousUseGroq();
    
    if (canUse) {
      return {
        shouldReschedule: false,
        delayMs: 0,
        reason: 'Within 15% limit'
      };
    }

    const resetTime = this.getNextResetTime();
    const delayMs = resetTime.getTime() - Date.now();

    return {
      shouldReschedule: true,
      delayMs,
      reason: `Autonomous Groq 15% limit reached. Will resume at ${resetTime.toISOString()}`
    };
  }

  /**
   * Should defer non-critical tasks?
   * Checks both quota and rate limits
   */
  public async shouldDeferNonCritical(): Promise<boolean> {
    try {
      const quotaStatus = await this.getQuotaStatus();
      
      // For autonomous: defer if close to 15% limit
      const autonomousNearLimit = quotaStatus.groq.autonomousPercentUsed > 80;
      
      // For users: defer if both APIs running low
      const geminiLow = quotaStatus.gemini.percentUsed > 70;
      const groqLow = quotaStatus.groq.percentUsed > 85;

      // Also check if we're rate limited
      const rateLimited = rateLimitTracker.shouldUseGroq();

      return autonomousNearLimit || (geminiLow && groqLow) || rateLimited;
    } catch (error) {
      console.error('[AI Governor] Error checking deferral:', error);
      return false;
    }
  }
}

// Export enhanced governor
export const aiTokenGovernor = AITokenGovernorEnhanced.getInstance();

// Export compatibility functions for existing code
export async function getBudgetForTask(task: AITaskMetadata): Promise<TokenBudget> {
  return aiTokenGovernor.getBudgetForTask(task);
}

export async function recordUsage(
  taskName: string,
  provider: AIProvider,
  tokensUsed: number,
  latencyMs: number | null,
  success: boolean,
  verbosity: 'concise' | 'standard' | 'detailed',
  priority: TaskPriority,
  errorMessage?: string
): Promise<void> {
  // Default to user context for backwards compatibility
  await aiTokenGovernor.recordUsage(
    taskName,
    provider,
    tokensUsed,
    UsageContext.USER,
    latencyMs,
    success,
    verbosity,
    priority,
    errorMessage
  );
}

export async function shouldDeferNonCritical(): Promise<boolean> {
  return aiTokenGovernor.shouldDeferNonCritical();
}

export function getPromptInstruction(verbosity: 'concise' | 'standard' | 'detailed'): string {
  switch (verbosity) {
    case 'concise':
      return 'Provide a concise, bullet-point response. Focus only on critical information.';
    case 'standard':
      return 'Provide a clear, well-structured response with key details.';
    case 'detailed':
      return 'Provide a comprehensive analysis with detailed explanations and supporting information.';
  }
}
