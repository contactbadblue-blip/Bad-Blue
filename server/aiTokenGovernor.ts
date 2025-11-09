/**
 * AI Token Governor - Dynamic quota allocation and efficiency management
 * Implements intelligent budgeting for Gemini and Groq API calls based on:
 * - Task priority (user-facing > worker > sub-agent)
 * - Request complexity and expected token usage
 * - Current quota consumption levels
 * - Historical performance data
 */

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


interface QuotaStatus {
  gemini: { used: number; limit: number; percentUsed: number };
  groq: { used: number; limit: number; percentUsed: number };
}

async function getQuotaStatus(): Promise<QuotaStatus> {
  const GEMINI_DAILY_LIMIT = 50;
  const GROQ_DAILY_TOKEN_LIMIT = 100000;

  const geminiUsage = await tokenMetrics.getTodayUsage('gemini');
  const groqUsage = await tokenMetrics.getTodayUsage('groq');

  return {
    gemini: {
      used: geminiUsage.requests,
      limit: GEMINI_DAILY_LIMIT,
      percentUsed: geminiUsage.requests / GEMINI_DAILY_LIMIT,
    },
    groq: {
      used: groqUsage.tokens,
      limit: GROQ_DAILY_TOKEN_LIMIT,
      percentUsed: groqUsage.tokens / GROQ_DAILY_TOKEN_LIMIT,
    },
  };
}

async function selectProvider(task: AITaskMetadata, quotaStatus: QuotaStatus): Promise<AIProvider> {
  const geminiExhausted = quotaStatus.gemini.percentUsed >= 0.95;
  const groqExhausted = quotaStatus.groq.percentUsed >= 0.95;

  if (task.priority >= TaskPriority.HIGH_USER) {
    if (!geminiExhausted) {
      return AIProvider.GEMINI;
    }
    return AIProvider.GROQ;
  }

  if (!groqExhausted) {
    return AIProvider.GROQ;
  }

  return AIProvider.GEMINI;
}

function calculateMaxTokens(
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

  if (provider === AIProvider.GEMINI) {
    const percentRemaining = 1 - quotaStatus.gemini.percentUsed;
    if (percentRemaining < 0.2 && task.priority < TaskPriority.HIGH_USER) {
      baseTokens = Math.floor(baseTokens * 0.5);
    }
  } else if (provider === AIProvider.GROQ) {
    const percentRemaining = 1 - quotaStatus.groq.percentUsed;
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

export async function getBudgetForTask(task: AITaskMetadata): Promise<TokenBudget> {
  try {
    const quotaStatus = await getQuotaStatus();
    const bothExhausted = quotaStatus.gemini.percentUsed >= 0.95 && quotaStatus.groq.percentUsed >= 0.95;

    if (bothExhausted) {
      return {
        provider: AIProvider.GEMINI,
        maxTokens: 0,
        verbosityLevel: 'concise',
        shouldProceed: false,
        deferralReason: 'Both Gemini and Groq quotas exhausted',
      };
    }

    const provider = await selectProvider(task, quotaStatus);
    const providerStatus = provider === AIProvider.GEMINI ? quotaStatus.gemini : quotaStatus.groq;
    const isExhausted = providerStatus.percentUsed >= 0.95;

    if (isExhausted && task.allowDeferral) {
      return {
        provider,
        maxTokens: 0,
        verbosityLevel: 'concise',
        shouldProceed: false,
        deferralReason: `${provider} quota exhausted - task can be deferred`,
      };
    }

    if (isExhausted) {
      return {
        provider,
        maxTokens: 500,
        verbosityLevel: 'concise',
        shouldProceed: true,
      };
    }

    const maxTokens = calculateMaxTokens(task, provider, quotaStatus);
    const verbosity = determineVerbosity(maxTokens, task.priority);

    return {
      provider,
      maxTokens,
      verbosityLevel: verbosity,
      shouldProceed: true,
    };
  } catch (error) {
    console.error('[Token Governor] Error getting budget:', error);
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

export async function shouldDeferNonCritical(): Promise<boolean> {
  try {
    const quotaStatus = await getQuotaStatus();
    const geminiRemaining = 1 - quotaStatus.gemini.percentUsed;
    const groqRemaining = 1 - quotaStatus.groq.percentUsed;

    return geminiRemaining < 0.3 || groqRemaining < 0.15;
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
