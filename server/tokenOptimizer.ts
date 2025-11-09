
/**
 * Intelligent Token Allocation System
 * Analyzes query complexity and determines optimal token limits
 */

interface TokenAnalysis {
  estimatedTokens: number;
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  reasoning: string;
}

/**
 * Analyzes query complexity and recommends token allocation
 */
export function analyzeTokenRequirements(
  userQuery: string,
  context?: {
    conversationHistory?: number;
    includesData?: boolean;
    requiresResearch?: boolean;
    requiresCodeGeneration?: boolean;
    requiresLegalAnalysis?: boolean;
  }
): TokenAnalysis {
  const queryLength = userQuery.length;
  const wordCount = userQuery.split(/\s+/).length;
  
  // Base complexity scoring
  let complexityScore = 0;
  let reasoning: string[] = [];
  
  // 1. Query length analysis
  if (wordCount < 10) {
    complexityScore += 1;
    reasoning.push('Very short query');
  } else if (wordCount < 30) {
    complexityScore += 2;
    reasoning.push('Short query');
  } else if (wordCount < 100) {
    complexityScore += 3;
    reasoning.push('Medium-length query');
  } else {
    complexityScore += 4;
    reasoning.push('Long, detailed query');
  }
  
  // 2. Context analysis
  if (context?.conversationHistory && context.conversationHistory > 5) {
    complexityScore += 2;
    reasoning.push('Extended conversation history');
  }
  
  if (context?.includesData) {
    complexityScore += 3;
    reasoning.push('Includes data/documents to analyze');
  }
  
  if (context?.requiresResearch) {
    complexityScore += 4;
    reasoning.push('Requires legal research');
  }
  
  if (context?.requiresCodeGeneration) {
    complexityScore += 3;
    reasoning.push('Requires code generation');
  }
  
  if (context?.requiresLegalAnalysis) {
    complexityScore += 4;
    reasoning.push('Requires legal analysis');
  }
  
  // 3. Query complexity indicators
  const complexityIndicators = [
    { pattern: /\b(explain|describe|analyze|compare|evaluate)\b/i, score: 2, label: 'Analytical task' },
    { pattern: /\b(comprehensive|detailed|thorough|complete)\b/i, score: 3, label: 'Detailed response requested' },
    { pattern: /\b(step by step|walkthrough|tutorial)\b/i, score: 3, label: 'Step-by-step explanation needed' },
    { pattern: /\b(lawsuit|complaint|petition|legal document)\b/i, score: 4, label: 'Legal document generation' },
    { pattern: /\b(research|precedent|case law|statute)\b/i, score: 4, label: 'Legal research required' },
    { pattern: /\b(multiple|several|various|all)\b/i, score: 2, label: 'Multiple items to address' },
    { pattern: /\?.*\?/i, score: 2, label: 'Multiple questions' },
  ];
  
  complexityIndicators.forEach(indicator => {
    if (indicator.pattern.test(userQuery)) {
      complexityScore += indicator.score;
      reasoning.push(indicator.label);
    }
  });
  
  // 4. Determine complexity level and token allocation
  let complexity: TokenAnalysis['complexity'];
  let estimatedTokens: number;
  
  if (complexityScore <= 4) {
    complexity = 'simple';
    estimatedTokens = 1024; // Short, direct answers
  } else if (complexityScore <= 8) {
    complexity = 'moderate';
    estimatedTokens = 2048; // Medium explanations
  } else if (complexityScore <= 12) {
    complexity = 'complex';
    estimatedTokens = 4096; // Detailed responses
  } else {
    complexity = 'very_complex';
    estimatedTokens = 8192; // Comprehensive legal/technical documents
  }
  
  return {
    estimatedTokens,
    complexity,
    reasoning: reasoning.join('; ')
  };
}

/**
 * Get optimal token limit for Groq API calls
 */
export function getOptimalGroqTokens(
  userQuery: string,
  context?: Parameters<typeof analyzeTokenRequirements>[1]
): number {
  const analysis = analyzeTokenRequirements(userQuery, context);
  
  console.log(`[Token Optimizer] Query complexity: ${analysis.complexity} (${analysis.reasoning})`);
  console.log(`[Token Optimizer] Allocating ${analysis.estimatedTokens} tokens`);
  
  return analysis.estimatedTokens;
}

/**
 * Get optimal token limit for Gemini API calls
 */
export function getOptimalGeminiTokens(
  userQuery: string,
  context?: Parameters<typeof analyzeTokenRequirements>[1]
): number {
  // Gemini has same allocation as Groq
  return getOptimalGroqTokens(userQuery, context);
}
