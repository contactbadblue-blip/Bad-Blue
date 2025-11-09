import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function createSubAgentTables() {
  console.log('[Migration] Starting Sub-Agent tables creation...');

  try {
    // Create subagent_capabilities table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subagent_capabilities (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        capability_name VARCHAR UNIQUE NOT NULL,
        description TEXT NOT NULL,
        success_count INTEGER DEFAULT 0 NOT NULL,
        fail_count INTEGER DEFAULT 0 NOT NULL,
        avg_execution_time_ms INTEGER,
        last_used TIMESTAMP,
        learned_at TIMESTAMP DEFAULT NOW() NOT NULL,
        limitations TEXT[],
        improvements TEXT[],
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('[Migration] ✓ Created subagent_capabilities table');

    // Create indexes for subagent_capabilities
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_capability_name ON subagent_capabilities(capability_name);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_last_used ON subagent_capabilities(last_used);
    `);
    console.log('[Migration] ✓ Created indexes for subagent_capabilities');

    // Create subagent_learning_patterns table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subagent_learning_patterns (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        pattern_type VARCHAR NOT NULL,
        pattern_data JSONB NOT NULL,
        confidence_score INTEGER DEFAULT 50 NOT NULL,
        times_observed INTEGER DEFAULT 1 NOT NULL,
        last_observed TIMESTAMP DEFAULT NOW() NOT NULL,
        associated_capabilities TEXT[],
        impact VARCHAR,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('[Migration] ✓ Created subagent_learning_patterns table');

    // Create indexes for subagent_learning_patterns
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_pattern_type ON subagent_learning_patterns(pattern_type);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_confidence_score ON subagent_learning_patterns(confidence_score);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_last_observed ON subagent_learning_patterns(last_observed);
    `);
    console.log('[Migration] ✓ Created indexes for subagent_learning_patterns');

    // Create subagent_performance_metrics table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subagent_performance_metrics (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        metric_name VARCHAR NOT NULL,
        metric_value INTEGER NOT NULL,
        measured_at TIMESTAMP DEFAULT NOW() NOT NULL,
        context JSONB,
        task_id VARCHAR,
        capability_name VARCHAR,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('[Migration] ✓ Created subagent_performance_metrics table');

    // Create indexes for subagent_performance_metrics
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_metric_name ON subagent_performance_metrics(metric_name);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_measured_at ON subagent_performance_metrics(measured_at);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_metrics_capability_name ON subagent_performance_metrics(capability_name);
    `);
    console.log('[Migration] ✓ Created indexes for subagent_performance_metrics');

    // Create subagent_self_improvement_actions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subagent_self_improvement_actions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        action_type VARCHAR NOT NULL,
        description TEXT NOT NULL,
        before_state JSONB,
        after_state JSONB,
        success_metrics JSONB,
        rollback_available BOOLEAN DEFAULT TRUE NOT NULL,
        rolled_back BOOLEAN DEFAULT FALSE NOT NULL,
        rollback_reason TEXT,
        impact VARCHAR,
        capability_affected VARCHAR,
        implemented_at TIMESTAMP DEFAULT NOW() NOT NULL,
        evaluated_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('[Migration] ✓ Created subagent_self_improvement_actions table');

    // Create indexes for subagent_self_improvement_actions
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_action_type ON subagent_self_improvement_actions(action_type);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_implemented_at ON subagent_self_improvement_actions(implemented_at);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_impact ON subagent_self_improvement_actions(impact);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_rolled_back ON subagent_self_improvement_actions(rolled_back);
    `);
    console.log('[Migration] ✓ Created indexes for subagent_self_improvement_actions');

    // Create officer_profiles table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS officer_profiles (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        officer_name TEXT NOT NULL,
        badge_number VARCHAR,
        department TEXT,
        rank TEXT,
        location TEXT,
        career_data JSONB,
        incidents JSONB,
        court_cases JSONB,
        news_mentions JSONB,
        community_complaints JSONB,
        sources TEXT[],
        data_quality_score INTEGER,
        last_updated TIMESTAMP DEFAULT NOW(),
        search_count INTEGER DEFAULT 0,
        last_searched_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('[Migration] ✓ Created officer_profiles table');

    // Create indexes for officer_profiles
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS officer_profiles_name_idx ON officer_profiles(officer_name);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS officer_profiles_badge_idx ON officer_profiles(badge_number);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS officer_profiles_department_idx ON officer_profiles(department);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS officer_profiles_location_idx ON officer_profiles(location);
    `);
    console.log('[Migration] ✓ Created indexes for officer_profiles');

    // Create department_urls table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS department_urls (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        department_name TEXT NOT NULL,
        url TEXT NOT NULL,
        location TEXT NOT NULL,
        state VARCHAR(2) NOT NULL,
        department_type VARCHAR NOT NULL,
        verified BOOLEAN DEFAULT FALSE NOT NULL,
        last_verified TIMESTAMP,
        contact_email TEXT,
        phone VARCHAR,
        jurisdiction TEXT,
        serves_population INTEGER,
        sources TEXT[],
        discovered_at TIMESTAMP DEFAULT NOW() NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('[Migration] ✓ Created department_urls table');

    // Create indexes for department_urls
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_department_state ON department_urls(state);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_department_type ON department_urls(department_type);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_discovered_at ON department_urls(discovered_at);
    `);
    console.log('[Migration] ✓ Created indexes for department_urls');

    // Create sub_agent_search_cycles table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sub_agent_search_cycles (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        current_cycle VARCHAR NOT NULL DEFAULT 'officer',
        last_cycle_start TIMESTAMP,
        next_cycle_start TIMESTAMP,
        search_state VARCHAR NOT NULL DEFAULT 'not_running',
        is_paused BOOLEAN DEFAULT FALSE NOT NULL,
        pause_context JSONB,
        cycle_count INTEGER DEFAULT 0 NOT NULL,
        last_officer_search_count INTEGER,
        last_department_search_count INTEGER,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('[Migration] ✓ Created sub_agent_search_cycles table');

    // Create indexes for sub_agent_search_cycles
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_search_state ON sub_agent_search_cycles(search_state);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_is_paused ON sub_agent_search_cycles(is_paused);
    `);
    console.log('[Migration] ✓ Created indexes for sub_agent_search_cycles');

    console.log('[Migration] ✅ Successfully created all Sub-Agent tables and indexes');
    console.log('[Migration] ✅ Officer Profiles table: READY for autonomous data storage');
    console.log('[Migration] ✅ Department URLs table: READY for autonomous data storage');
    console.log('[Migration] ✅ Search Cycles table: READY for autonomous operations');
    return true;
  } catch (error) {
    console.error('[Migration] ❌ Failed to create Sub-Agent tables:', error);
    throw error;
  }
}
