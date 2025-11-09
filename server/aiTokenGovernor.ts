/**
 * AI Token Governor - Dynamic quota allocation and efficiency management
 * Implements intelligent budgeting for Gemini and Groq API calls based on:
 * - Task priority (user-facing > worker > sub-agent)
 * - Request complexity and expected token usage
 * - Current quota consumption levels
 * - Historical performance data
 */

import { getCurrentUsage, areBothAPIsExhausted, type RateLimitStatus } from './rateLimitTracker';
import * as tokenMetrics from './repositories/tokenMetricsRepository';

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


/**
 * Provider selection based on task priority and quota status
 */
async function selectProvider(task: AITaskMetadata, rateLimits: RateLimitStatus): Promise<AIProvider> {
  // Critical user tasks prefer Gemini (higher quality)
  if (task.priority >= TaskPriority.HIGH_USER) {
    if (!rateLimits.gemini.isExhausted) {
      return AIProvider.GEMINI;
    }
    // Fall back to Groq if Gemini exhausted
    return AIProvider.GROQ;
  }

  // Background tasks prefer Groq (larger quota)
  if (!rateLimits.groq.isExhausted) {
    return AIProvider.GROQ;
  }

  // Fall back to Gemini for background if Groq exhausted
  return AIProvider.GEMINI;
}

/**
 * Calculate max tokens based on complexity and remaining quota
 */
function calculateMaxTokens(
  task: AITaskMetadata,
  provider: AIProvider,
  rateLimits: RateLimitStatus
): number {
  // Base token budgets by complexity
  const complexityBudgets = {
    [TaskComplexity.LIGHTWEIGHT]: 500,
    [TaskComplexity.MODERATE]: 2000,
    [TaskComplexity.COMPREHENSIVE]: 8000,
  };

  let baseTokens = task.expectedTokens || complexityBudgets[task.complexity];

  // Adjust based on remaining quota
  if (provider === AIProvider.GEMINI) {
    const remaining = rateLimits.gemini.limit - rateLimits.gemini.used;
    const percentRemaining = remaining / rateLimits.gemini.limit;

    // If less than 20% quota remaining, reduce token budgets for non-critical tasks
    if (percentRemaining < 0.2 && task.priority < TaskPriority.HIGH_USER) {
      baseTokens = Math.floor(baseTokens * 0.5);
    }
  } else if (provider === AIProvider.GROQ) {
    const remaining = rateLimits.groq.limit - rateLimits.groq.used;
    const percentRemaining = remaining / rateLimits.groq.limit;

    // If less than 10% quota remaining, reduce token budgets
    if (percentRemaining < 0.1 && task.priority < TaskPriority.CRITICAL_USER) {
      baseTokens = Math.floor(baseTokens * 0.6);
    }
  }

  return baseTokens;
}

/**
 * Determine verbosity level based on tokens and priority
 */
function determineVerbosity(maxTokens: number, priority: TaskPriority): 'concise' | 'standard' | 'detailed' {
  if (priority >= TaskPriority.HIGH_USER) {
    return maxTokens >= 5000 ? 'detailed' : 'standard';
  }

  if (maxTokens < 1000) return 'concise';
  if (maxTokens < 3000) return 'standard';
  return 'detailed';
}

/**
 * Main API: Get token budget for a task
 */
export async function getBudgetForTask(task: AITaskMetadata): Promise<TokenBudget> {
  try {
    const rateLimits = await getCurrentUsage();

    // Check if both APIs are exhausted
    if (await areBothAPIsExhausted()) {
      return {
        provider: AIProvider.GEMINI, // Doesn't matter
        maxTokens: 0,
        verbosityLevel: 'concise',
        shouldProceed: false,
        deferralReason: 'Both Gemini and Groq quotas exhausted',
      };
    }

    // Select provider
    const provider = await selectProvider(task, rateLimits);

    // Check if selected provider is exhausted
    const providerStatus = provider === AIProvider.GEMINI ? rateLimits.gemini : rateLimits.groq;
    if (providerStatus.isExhausted) {
      // If task can be deferred, defer it
      if (task.allowDeferral) {
        return {
          provider,
          maxTokens: 0,
          verbosityLevel: 'concise',
          shouldProceed: false,
          deferralReason: `${provider} quota exhausted - task can be deferred`,
        };
      }

      // Critical tasks proceed with minimal tokens
      const emergencyTokens = 500;
      return {
        provider,
        maxTokens: emergencyTokens,
        verbosityLevel: 'concise',
        shouldProceed: true,
      };
    }

    // Calculate max tokens
    const maxTokens = calculateMaxTokens(task, provider, rateLimits);
    const verbosity = determineVerbosity(maxTokens, task.priority);

    return {
      provider,
      maxTokens,
      verbosityLevel: verbosity,
      shouldProceed: true,
    };
  } catch (error) {
    console.error('[Token Governor] Error getting budget:', error);

    // Default safe budget
    return {
      provider: AIProvider.GEMINI,
      maxTokens: 1000,
      verbosityLevel: 'concise',
      shouldProceed: true,
    };
  }
}

/**
 * Record AI usage for telemetry and adaptive learning
 * MIGRATED: Now uses PostgreSQL-backed repository
 */
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
  try {
    await tokenMetrics.recordUsage({
      taskName,
      provider,
      tokensUsed,
      latencyMs,
      success,
      verbosity,
      priority,
      errorMessage,
    });
  } catch (error) {
    console.error('[Token Governor] Error recording usage (degrading gracefully):', error);
  }
}

/**
 * Check if non-critical tasks should be deferred
 */
export async function shouldDeferNonCritical(): Promise<boolean> {
  try {
    const rateLimits = await getCurrentUsage();

    // Defer if Gemini below 30% or Groq below 15%
    const geminiPercent = (rateLimits.gemini.limit - rateLimits.gemini.used) / rateLimits.gemini.limit;
    const groqPercent = (rateLimits.groq.limit - rateLimits.groq.used) / rateLimits.groq.limit;

    return geminiPercent < 0.3 || groqPercent < 0.15;
  } catch (error) {
    console.error('[Token Governor] Error checking deferral:', error);
    return false;
  }
}

/**
 * Get adaptive prompt instruction based on verbosity level
 */
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
