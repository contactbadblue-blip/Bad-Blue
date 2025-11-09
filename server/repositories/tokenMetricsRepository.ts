/**
 * Token Metrics Repository
 * Tracks AI usage for quota governance and billing
 * Migration-ready: Replaces in-memory metrics tracking
 */

import { db } from '../db';
import { aiUsageMetrics, type InsertAiUsageMetric, type AiUsageMetric } from '../../shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export interface UsageRecord {
  taskName: string;
  provider: 'gemini' | 'groq';
  tokensUsed: number;
  latencyMs: number | null;
  success: boolean;
  verbosity: 'concise' | 'standard' | 'detailed';
  priority: number;
  errorMessage?: string;
}

export async function recordUsage(record: UsageRecord): Promise<void> {
  try {
    const entry: InsertAiUsageMetric = {
      taskName: record.taskName,
      provider: record.provider,
      tokensUsed: record.tokensUsed,
      latencyMs: record.latencyMs,
      success: record.success,
      verbosity: record.verbosity,
      priority: record.priority,
      errorMessage: record.errorMessage || null,
    };

    await db.insert(aiUsageMetrics).values(entry);
  } catch (error) {
    console.error('[Token Metrics] Error recording usage (degrading gracefully):', error);
  }
}

export async function getUsageInWindow(
  provider: 'gemini' | 'groq',
  windowMinutes: number
): Promise<{
  totalTokens: number;
  totalRequests: number;
  successfulRequests: number;
  averageLatencyMs: number;
}> {
  try {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    const results = await db
      .select({
        totalTokens: sql<number>`SUM(${aiUsageMetrics.tokensUsed})::int`,
        totalRequests: sql<number>`COUNT(*)::int`,
        successfulRequests: sql<number>`COUNT(*) FILTER (WHERE ${aiUsageMetrics.success} = true)::int`,
        averageLatencyMs: sql<number>`AVG(${aiUsageMetrics.latencyMs})::int`,
      })
      .from(aiUsageMetrics)
      .where(
        and(
          eq(aiUsageMetrics.provider, provider),
          gte(aiUsageMetrics.timestamp, windowStart)
        )
      );

    const result = results[0];
    return {
      totalTokens: result?.totalTokens || 0,
      totalRequests: result?.totalRequests || 0,
      successfulRequests: result?.successfulRequests || 0,
      averageLatencyMs: result?.averageLatencyMs || 0,
    };
  } catch (error) {
    console.error('[Token Metrics] Error getting usage window:', error);
    return { totalTokens: 0, totalRequests: 0, successfulRequests: 0, averageLatencyMs: 0 };
  }
}

export async function getTodayUsage(provider: 'gemini' | 'groq'): Promise<{
  tokens: number;
  requests: number;
}> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const results = await db
      .select({
        tokens: sql<number>`SUM(${aiUsageMetrics.tokensUsed})::int`,
        requests: sql<number>`COUNT(*)::int`,
      })
      .from(aiUsageMetrics)
      .where(
        and(
          eq(aiUsageMetrics.provider, provider),
          gte(aiUsageMetrics.timestamp, todayStart)
        )
      );

    const result = results[0];
    return {
      tokens: result?.tokens || 0,
      requests: result?.requests || 0,
    };
  } catch (error) {
    console.error('[Token Metrics] Error getting today usage:', error);
    return { tokens: 0, requests: 0 };
  }
}

export async function cleanupOldMetrics(retentionDays: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await db
      .delete(aiUsageMetrics)
      .where(sql`${aiUsageMetrics.timestamp} < ${cutoffDate}`);

    const deleted = result.rowCount || 0;
    if (deleted > 0) {
      console.log(`[Token Metrics] Cleaned up ${deleted} old metrics (>${retentionDays} days)`);
    }
    return deleted;
  } catch (error) {
    console.error('[Token Metrics] Error cleaning old metrics:', error);
    return 0;
  }
}
