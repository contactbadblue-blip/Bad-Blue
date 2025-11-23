/**
 * Database Schema Synchronization
 * Ensures all required tables and columns exist in the database
 * This runs on startup to handle Railway deployments
 */

import { db } from './db';
import { sql } from 'drizzle-orm';

export async function ensureSchemaSync() {
  console.log('[Schema Sync] Starting database schema verification...');

  try {
    // Check if ai_usage_metrics table exists with all required columns
    const aiMetricsCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ai_usage_metrics' 
      AND table_schema = 'public'
    `);

    const existingColumns = new Set(aiMetricsCheck.rows.map((row: any) => row.column_name));

    // Required columns for ai_usage_metrics
    const requiredColumns = {
      'id': 'VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()',
      'timestamp': 'TIMESTAMP DEFAULT NOW() NOT NULL',
      'task_name': 'VARCHAR(100) NOT NULL',
      'provider': 'VARCHAR(20) NOT NULL',
      'tokens_used': 'INTEGER NOT NULL',
      'latency_ms': 'INTEGER', // This is the problematic column
      'success': 'BOOLEAN NOT NULL',
      'verbosity': 'VARCHAR(20) NOT NULL',
      'priority': 'INTEGER NOT NULL',
      'error_message': 'TEXT',
      'source': 'VARCHAR(20) DEFAULT \'user\' NOT NULL'
    };

    // Add missing columns
    for (const [column, definition] of Object.entries(requiredColumns)) {
      if (!existingColumns.has(column)) {
        console.log(`[Schema Sync] Adding missing column: ${column} to ai_usage_metrics`);
        
        // Special handling for different column types
        if (column === 'latency_ms') {
          await db.execute(sql.raw(`ALTER TABLE ai_usage_metrics ADD COLUMN IF NOT EXISTS latency_ms INTEGER`));
        } else if (column === 'source') {
          await db.execute(sql.raw(`ALTER TABLE ai_usage_metrics ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'user' NOT NULL`));
        }
        // Other columns would be handled here if needed
      }
    }

    // Create ai_usage_metrics table if it doesn't exist
    if (existingColumns.size === 0) {
      console.log('[Schema Sync] Creating ai_usage_metrics table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ai_usage_metrics (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
          task_name VARCHAR(100) NOT NULL,
          provider VARCHAR(20) NOT NULL,
          tokens_used INTEGER NOT NULL,
          latency_ms INTEGER,
          success BOOLEAN NOT NULL,
          verbosity VARCHAR(20) NOT NULL,
          priority INTEGER NOT NULL,
          error_message TEXT,
          source VARCHAR(20) DEFAULT 'user' NOT NULL
        )
      `);

      // Create indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_ai_usage_provider_timestamp 
        ON ai_usage_metrics(provider, timestamp DESC)
      `);
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_ai_usage_task 
        ON ai_usage_metrics(task_name)
      `);
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_ai_usage_source 
        ON ai_usage_metrics(source)
      `);
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_ai_usage_source_timestamp 
        ON ai_usage_metrics(source, timestamp DESC)
      `);
    }

    console.log('[Schema Sync] ✓ Database schema verification complete');
    return true;
  } catch (error: any) {
    console.error('[Schema Sync] Error during schema verification:', error.message);
    
    // Non-fatal error - log but continue startup
    if (error.code === '42703') { // Column doesn't exist error
      console.log('[Schema Sync] Column missing - attempting recovery...');
      try {
        // Force add the latency_ms column
        await db.execute(sql.raw(`ALTER TABLE ai_usage_metrics ADD COLUMN IF NOT EXISTS latency_ms INTEGER`));
        console.log('[Schema Sync] ✓ Recovery successful - added latency_ms column');
      } catch (recoveryError: any) {
        console.error('[Schema Sync] Recovery failed:', recoveryError.message);
      }
    }
    
    return false;
  }
}

// Export for use in server startup
export default ensureSchemaSync;