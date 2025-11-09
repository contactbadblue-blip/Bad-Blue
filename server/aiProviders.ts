/**
 * AI Provider Abstraction Layer
 * Manages Gemini (primary) and Groq (fallback) AI providers
 * 
 * This app uses ONLY Gemini and Groq - no OpenAI
 */

export type AIProvider = 'gemini' | 'groq';

export const AI_PROVIDERS = {
  PRIMARY: 'gemini' as AIProvider,
  FALLBACK: 'groq' as AIProvider,
};

export interface AIProviderStatus {
  provider: AIProvider;
  available: boolean;
  configured: boolean;
  keyPresent: boolean;
}

/**
 * Get list of configured AI providers
 * @returns Array of providers that have API keys configured
 */
export function getConfiguredProviders(): AIProvider[] {
  const providers: AIProvider[] = [];
  
  if (process.env.GEMINI_API_KEY) {
    providers.push('gemini');
  }
  
  if (process.env.GROQ_API_KEY) {
    providers.push('groq');
  }
  
  return providers;
}

/**
 * Check if primary provider (Gemini) is available
 * @returns Promise resolving to true if Gemini API key is configured
 */
export async function isPrimaryProviderAvailable(): Promise<boolean> {
  return !!process.env.GEMINI_API_KEY;
}

/**
 * Check if fallback provider (Groq) is available
 * @returns Promise resolving to true if Groq API key is configured
 */
export async function isFallbackProviderAvailable(): Promise<boolean> {
  return !!process.env.GROQ_API_KEY;
}

/**
 * Get status of all AI providers
 * @returns Array of provider status objects
 */
export async function getAllProviderStatuses(): Promise<AIProviderStatus[]> {
  return [
    {
      provider: 'gemini',
      available: await isPrimaryProviderAvailable(),
      configured: !!process.env.GEMINI_API_KEY,
      keyPresent: !!process.env.GEMINI_API_KEY,
    },
    {
      provider: 'groq',
      available: await isFallbackProviderAvailable(),
      configured: !!process.env.GROQ_API_KEY,
      keyPresent: !!process.env.GROQ_API_KEY,
    },
  ];
}

/**
 * Check if at least one AI provider is available
 * @returns Promise resolving to true if any provider is configured
 */
export async function hasAnyProviderAvailable(): Promise<boolean> {
  const gemini = await isPrimaryProviderAvailable();
  const groq = await isFallbackProviderAvailable();
  return gemini || groq;
}

/**
 * Get the name of the primary AI provider
 * @returns Human-readable name of primary provider
 */
export function getPrimaryProviderName(): string {
  return 'Gemini';
}

/**
 * Get the name of the fallback AI provider
 * @returns Human-readable name of fallback provider
 */
export function getFallbackProviderName(): string {
  return 'Groq';
}

/**
 * Get required environment variable names for AI providers
 * @returns Array of required environment variable names
 */
export function getRequiredEnvVars(): string[] {
  return ['GEMINI_API_KEY', 'GROQ_API_KEY'];
}

/**
 * Validate that at least one AI provider is configured
 * @throws Error if no providers are configured
 */
export function validateProvidersConfigured(): void {
  const gemini = !!process.env.GEMINI_API_KEY;
  const groq = !!process.env.GROQ_API_KEY;
  
  if (!gemini && !groq) {
    throw new Error('No AI providers configured. Please set GEMINI_API_KEY or GROQ_API_KEY');
  }
  
  if (!gemini) {
    console.warn('[AI Providers] Warning: Primary provider (Gemini) not configured. Using fallback (Groq) only.');
  }
  
  if (!groq) {
    console.warn('[AI Providers] Warning: Fallback provider (Groq) not configured. Using primary (Gemini) only.');
  }
}
