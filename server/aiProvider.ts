/**
 * Unified AI Provider Module
 * Enforces token governance and provider selection rules
 * 
 * RULES:
 * - Autonomous functions: Groq ONLY (up to 15% daily limit)
 * - User functions: Gemini FIRST, Groq as backup
 * - All usage tracked in database with proper context
 */

import { GoogleGenAI } from "@google/genai";
import { getGroqClient } from './groq';
import { 
  aiTokenGovernor, 
  AIProvider, 
  UsageContext, 
  TaskPriority, 
  TaskComplexity,
  type AITaskMetadata 
} from './aiTokenGovernor';

export { UsageContext, TaskPriority, TaskComplexity } from './aiTokenGovernor';

// Re-export for convenience
export type { AITaskMetadata };

interface AIResponse {
  content: string;
  provider: AIProvider;
  tokensUsed: number;
  latencyMs: number;
}

interface GenerateOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  useJSON?: boolean;
}

/**
 * Generate text using governed AI providers
 * Enforces all quotas and context-based routing
 */
export async function generateText(
  task: AITaskMetadata,
  prompt: string,
  options: GenerateOptions = {}
): Promise<AIResponse> {
  const startTime = Date.now();
  
  try {
    // Get budget from governor
    const budget = await aiTokenGovernor.getBudgetForTask(task);
    
    if (!budget.shouldProceed) {
      // If autonomous and over limit, throw specific error for rescheduling
      if (task.context === UsageContext.AUTONOMOUS) {
        const rescheduleInfo = await aiTokenGovernor.shouldRescheduleAutonomous();
        throw new Error(`AUTONOMOUS_LIMIT_REACHED: ${rescheduleInfo.reason}`);
      }
      throw new Error(`Task deferred: ${budget.deferralReason}`);
    }

    const maxTokens = options.maxTokens || budget.maxTokens;
    const actualPrompt = buildPromptWithVerbosity(prompt, budget.verbosityLevel);

    let content: string;
    let tokensUsed: number;

    if (budget.provider === AIProvider.GEMINI) {
      content = await callGemini(actualPrompt, options, maxTokens);
      // Estimate tokens for Gemini (rough approximation)
      tokensUsed = Math.floor((prompt.length + content.length) / 4);
    } else {
      content = await callGroq(actualPrompt, options, maxTokens);
      // Estimate tokens for Groq
      tokensUsed = Math.floor((prompt.length + content.length) / 4);
    }

    const latencyMs = Date.now() - startTime;

    // Record usage with proper context
    await aiTokenGovernor.recordUsage(
      task.taskName,
      budget.provider,
      tokensUsed,
      task.context,
      latencyMs,
      true,
      budget.verbosityLevel,
      task.priority
    );

    return {
      content,
      provider: budget.provider,
      tokensUsed,
      latencyMs
    };
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    
    // Record failure
    await aiTokenGovernor.recordUsage(
      task.taskName,
      AIProvider.GEMINI, // Default for error recording
      0,
      task.context,
      latencyMs,
      false,
      'concise',
      task.priority,
      error.message
    );

    throw error;
  }
}

/**
 * Generate JSON response using governed AI providers
 */
export async function generateJSON<T = any>(
  task: AITaskMetadata,
  prompt: string,
  options: GenerateOptions = {}
): Promise<T> {
  const response = await generateText(task, prompt, { ...options, useJSON: true });
  
  try {
    // Clean up markdown code blocks if present
    let cleanJson = response.content;
    if (cleanJson.includes('```json')) {
      cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    }
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('[AI Provider] Failed to parse JSON response:', response.content);
    throw new Error('Invalid JSON response from AI provider');
  }
}

/**
 * Check if autonomous functions can proceed
 */
export async function canAutonomousProceed(): Promise<boolean> {
  return aiTokenGovernor.canAutonomousUseGroq();
}

/**
 * Get rescheduling information for autonomous functions
 */
export async function getAutonomousRescheduleInfo(): Promise<{
  shouldReschedule: boolean;
  delayMs: number;
  reason: string;
}> {
  return aiTokenGovernor.shouldRescheduleAutonomous();
}

// Private helper functions

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    geminiClient = new GoogleGenAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
}

async function callGemini(
  prompt: string,
  options: GenerateOptions,
  maxTokens: number
): Promise<string> {
  try {
    const gemini = getGeminiClient();
    const gemini = getGeminiClient(); // same as before

const fullPrompt = options.systemPrompt
  ? `${options.systemPrompt}\n\n${prompt}`
  : prompt;

const result = await gemini.models.generateContent({
  model: options.model || "gemini-1.5-flash",
  contents: [
    {
      role: "user",
      parts: [{ text: fullPrompt }],
    },
  ],
  generationConfig: {
    temperature: options.temperature ?? 0.7,
    maxOutputTokens: maxTokens,
    responseMimeType: options.useJSON ? "application/json" : "text/plain",
  },
});

return result.text ?? "";
    
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    return text;
  } catch (error: any) {
    console.error('[AI Provider] Gemini error:', error);
    throw error;
  }
}

async function callGroq(
  prompt: string,
  options: GenerateOptions,
  maxTokens: number
): Promise<string> {
  try {
    const groq = getGroqClient();
    
    const messages = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    if (options.useJSON) {
      messages[0] = {
        role: 'system',
        content: `${options.systemPrompt || ''}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanations, just raw JSON.`
      };
    }

    const response = await groq.chat.completions.create({
      model: options.model || 'llama-3.3-70b-versatile',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: maxTokens,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq');
    }

    return content;
  } catch (error: any) {
    console.error('[AI Provider] Groq error:', error);
    throw error;
  }
}

function buildPromptWithVerbosity(
  basePrompt: string,
  verbosity: 'concise' | 'standard' | 'detailed'
): string {
  const verbosityInstruction = getVerbosityInstruction(verbosity);
  return `${verbosityInstruction}\n\n${basePrompt}`;
}

function getVerbosityInstruction(verbosity: 'concise' | 'standard' | 'detailed'): string {
  switch (verbosity) {
    case 'concise':
      return 'Be extremely concise. Use bullet points. Focus only on essential information.';
    case 'standard':
      return 'Provide a clear, well-structured response with key details.';
    case 'detailed':
      return 'Provide comprehensive analysis with detailed explanations and examples.';
  }
}

/**
 * Quick helper to create task metadata for common use cases
 */
export function createTaskMetadata(
  taskName: string,
  context: UsageContext,
  priority: TaskPriority = TaskPriority.MEDIUM_BACKGROUND,
  complexity: TaskComplexity = TaskComplexity.MODERATE
): AITaskMetadata {
  return {
    taskName,
    context,
    priority,
    complexity,
    isUserFacing: context === UsageContext.USER,
    allowDeferral: priority <= TaskPriority.MEDIUM_BACKGROUND,
  };
}

// Export convenience functions for specific use cases

/**
 * Generate text for user-initiated requests (uses Gemini-first strategy)
 */
export async function generateUserText(
  taskName: string,
  prompt: string,
  options: GenerateOptions = {},
  priority: TaskPriority = TaskPriority.HIGH_USER
): Promise<AIResponse> {
  const task = createTaskMetadata(taskName, UsageContext.USER, priority, TaskComplexity.MODERATE);
  return generateText(task, prompt, options);
}

/**
 * Generate text for autonomous functions (uses Groq only, respects 15% limit)
 */
export async function generateAutonomousText(
  taskName: string,
  prompt: string,
  options: GenerateOptions = {},
  priority: TaskPriority = TaskPriority.LOW_BACKGROUND
): Promise<AIResponse> {
  const task = createTaskMetadata(taskName, UsageContext.AUTONOMOUS, priority, TaskComplexity.MODERATE);
  return generateText(task, prompt, options);
}

/**
 * Helper for legal AI (user-facing, high priority)
 */
export async function generateLegalAnalysis(
  analysisType: string,
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const task = createTaskMetadata(
    `legal-${analysisType}`,
    UsageContext.USER,
    TaskPriority.CRITICAL_USER,
    TaskComplexity.COMPREHENSIVE
  );
  const response = await generateText(task, prompt, options);
  return response.content;
}

/**
 * Helper for officer search (user-facing, high priority)
 */
export async function searchOfficerData(
  searchType: string,
  prompt: string,
  options: GenerateOptions = {}
): Promise<any> {
  const task = createTaskMetadata(
    `officer-${searchType}`,
    UsageContext.USER,
    TaskPriority.CRITICAL_USER,
    TaskComplexity.COMPREHENSIVE
  );
  return generateJSON(task, prompt, options);
}