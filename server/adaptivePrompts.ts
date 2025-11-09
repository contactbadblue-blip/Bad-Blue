/**
 * Adaptive Prompt Templates
 * Provides context-aware prompts that adjust complexity based on token budgets
 * Supports lightweight summaries, standard analysis, and comprehensive deep-dives
 */

import { getPromptInstruction, type TokenBudget } from './aiTokenGovernor';

/**
 * Prompt templates for Worker monitoring tasks
 */
export const WorkerPrompts = {
  /**
   * Database health check
   */
  databaseHealth: (verbosity: TokenBudget['verbosityLevel']): string => {
    const instruction = getPromptInstruction(verbosity);
    
    if (verbosity === 'concise') {
      return `Check database connectivity and basic health. ${instruction}
Report: Connection status, query response time, any errors.`;
    }

    if (verbosity === 'standard') {
      return `Analyze database health and performance. ${instruction}
Check: Connection status, query performance, active connections, recent errors.
Provide actionable recommendations if issues found.`;
    }

    return `Perform comprehensive database health analysis. ${instruction}
Analyze: Connection pool status, query performance metrics, lock contention, replication lag, disk usage, error patterns.
Provide detailed diagnostics and optimization recommendations.`;
  },

  /**
   * Rate limit monitoring
   */
  rateLimitCheck: (verbosity: TokenBudget['verbosityLevel'], currentUsage: any): string => {
    const instruction = getPromptInstruction(verbosity);
    
    if (verbosity === 'concise') {
      return `Rate limit status check. ${instruction}
Current usage: ${JSON.stringify(currentUsage)}
Report: Status summary and immediate actions needed.`;
    }

    if (verbosity === 'standard') {
      return `Analyze API rate limit status and predict exhaustion. ${instruction}
Current usage: ${JSON.stringify(currentUsage)}
Provide: Status assessment, time until exhaustion, recommended actions.`;
    }

    return `Comprehensive rate limit analysis with predictive modeling. ${instruction}
Current usage: ${JSON.stringify(currentUsage)}
Analyze: Usage patterns, exhaustion forecasting, quota optimization opportunities.
Recommend: Scaling strategy, caching improvements, request prioritization.`;
  },

  /**
   * System diagnostics
   */
  systemDiagnostic: (verbosity: TokenBudget['verbosityLevel'], errorLogs?: string): string => {
    const instruction = getPromptInstruction(verbosity);
    
    if (verbosity === 'concise') {
      return `Quick system diagnostic. ${instruction}
${errorLogs ? `Recent errors:\n${errorLogs.substring(0, 500)}` : 'No recent errors.'}
Report: Critical issues only.`;
    }

    if (verbosity === 'standard') {
      return `Standard system diagnostic analysis. ${instruction}
${errorLogs ? `Error logs:\n${errorLogs.substring(0, 2000)}` : 'No recent errors.'}
Analyze: Error patterns, system stability, performance bottlenecks.
Provide: Issue summary and fix priorities.`;
    }

    return `Comprehensive system diagnostic with root cause analysis. ${instruction}
${errorLogs ? `Full error context:\n${errorLogs}` : 'No recent errors.'}
Perform: Error pattern analysis, dependency chain review, performance profiling.
Deliver: Detailed diagnostics, root causes, step-by-step remediation plan.`;
  },
};

/**
 * Prompt templates for Sub-Agent improvement tasks
 */
export const SubAgentPrompts = {
  /**
   * Learning pattern analysis
   */
  analyzePatterns: (verbosity: TokenBudget['verbosityLevel'], data: any): string => {
    const instruction = getPromptInstruction(verbosity);
    
    if (verbosity === 'concise') {
      return `Identify key patterns in user consultation data. ${instruction}
Data: ${JSON.stringify(data).substring(0, 500)}
Report: Top 3 patterns only.`;
    }

    if (verbosity === 'standard') {
      return `Analyze patterns in user consultations and legal queries. ${instruction}
Data: ${JSON.stringify(data).substring(0, 2000)}
Identify: Common case types, legal issues, user needs.
Suggest: Improvements to legal analysis or document generation.`;
    }

    return `Comprehensive pattern analysis with legal research integration. ${instruction}
Full data: ${JSON.stringify(data)}
Analyze: Case patterns, legal precedents, user behavior trends.
Research: Related case law, statutory updates, emerging legal strategies.
Recommend: System improvements, new features, enhanced legal frameworks.`;
  },

  /**
   * Self-improvement recommendations
   */
  selfImprovement: (verbosity: TokenBudget['verbosityLevel'], performance: any): string => {
    const instruction = getPromptInstruction(verbosity);
    
    if (verbosity === 'concise') {
      return `Review system performance and suggest improvements. ${instruction}
Metrics: ${JSON.stringify(performance).substring(0, 500)}
Report: Top 3 actionable improvements.`;
    }

    if (verbosity === 'standard') {
      return `Analyze system performance and recommend enhancements. ${instruction}
Performance data: ${JSON.stringify(performance).substring(0, 2000)}
Evaluate: Success rates, error patterns, efficiency metrics.
Recommend: Specific improvements with implementation priority.`;
    }

    return `Comprehensive self-improvement analysis with implementation roadmap. ${instruction}
Full performance data: ${JSON.stringify(performance)}
Deep analysis: Success metrics, failure modes, optimization opportunities.
Strategic planning: Feature enhancements, architectural improvements, code quality.
Deliver: Prioritized roadmap with technical specifications.`;
  },
};

/**
 * Prompt templates for user-facing AI features
 */
export const UserPrompts = {
  /**
   * LegalAI consultation
   */
  legalConsultation: (verbosity: TokenBudget['verbosityLevel'], question: string): string => {
    const instruction = getPromptInstruction(verbosity);
    
    // User-facing features always use detailed analysis regardless of verbosity
    // But adjust comprehensiveness based on token budget
    if (verbosity === 'concise') {
      return `Legal consultation - focused response required. ${instruction}
User question: ${question}
Provide: Direct legal analysis, key statutes, actionable next steps.
Be thorough but concise.`;
    }

    return `Comprehensive legal consultation and case analysis. ${instruction}
User question: ${question}
Analyze: Legal merits, applicable laws, case precedents, procedural requirements.
Provide: Detailed assessment, legal strategy, documentation needs, timeline.
Maintain professional legal analysis standards.`;
  },

  /**
   * Officer search analysis
   */
  officerSearch: (verbosity: TokenBudget['verbosityLevel'], officerData: any): string => {
    const instruction = getPromptInstruction(verbosity);
    
    if (verbosity === 'concise') {
      return `Analyze officer data - efficient summary needed. ${instruction}
Officer information: ${JSON.stringify(officerData).substring(0, 1000)}
Provide: Key findings, misconduct indicators, recommended actions.`;
    }

    return `Comprehensive officer background analysis. ${instruction}
Full officer data: ${JSON.stringify(officerData)}
Analyze: Disciplinary history, complaint patterns, court involvement, public records.
Assess: Credibility factors, litigation risk, evidence quality.
Recommend: Legal strategies, additional investigation needs.`;
  },
};

/**
 * Get appropriate prompt template based on task and budget
 */
export function getAdaptivePrompt(
  category: 'worker' | 'subagent' | 'user',
  taskType: string,
  verbosity: TokenBudget['verbosityLevel'],
  data?: any
): string {
  if (category === 'worker') {
    switch (taskType) {
      case 'database_health':
        return WorkerPrompts.databaseHealth(verbosity);
      case 'rate_limit':
        return WorkerPrompts.rateLimitCheck(verbosity, data);
      case 'diagnostic':
        return WorkerPrompts.systemDiagnostic(verbosity, data);
      default:
        return `Perform ${taskType} analysis. ${getPromptInstruction(verbosity)}`;
    }
  }

  if (category === 'subagent') {
    switch (taskType) {
      case 'pattern_analysis':
        return SubAgentPrompts.analyzePatterns(verbosity, data);
      case 'self_improvement':
        return SubAgentPrompts.selfImprovement(verbosity, data);
      default:
        return `Complete ${taskType}. ${getPromptInstruction(verbosity)}`;
    }
  }

  if (category === 'user') {
    switch (taskType) {
      case 'legal_consultation':
        return UserPrompts.legalConsultation(verbosity, data);
      case 'officer_search':
        return UserPrompts.officerSearch(verbosity, data);
      default:
        return `Assist user with ${taskType}. Provide comprehensive, professional analysis.`;
    }
  }

  return `Complete ${taskType}. ${getPromptInstruction(verbosity)}`;
}
