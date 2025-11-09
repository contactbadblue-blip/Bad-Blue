import { db, pool } from "./db";
import { sql } from "drizzle-orm";

async function migrateSubAgentKnowledge() {
  console.log("Creating Sub-Agent knowledge tables...");
  
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sub_agent_capabilities (
        id SERIAL PRIMARY KEY,
        capability_name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        success_count INTEGER NOT NULL DEFAULT 0,
        fail_count INTEGER NOT NULL DEFAULT 0,
        avg_execution_time_ms INTEGER,
        last_used TIMESTAMP WITH TIME ZONE NOT NULL,
        learned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ Created sub_agent_capabilities table");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sub_agent_learning_patterns (
        id SERIAL PRIMARY KEY,
        pattern_type TEXT NOT NULL,
        pattern_data JSONB NOT NULL,
        confidence_score INTEGER NOT NULL DEFAULT 50,
        times_observed INTEGER NOT NULL DEFAULT 1,
        last_observed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ Created sub_agent_learning_patterns table");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sub_agent_performance_metrics (
        id SERIAL PRIMARY KEY,
        metric_name TEXT NOT NULL,
        metric_value NUMERIC NOT NULL,
        measured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        context JSONB
      )
    `);
    console.log("✓ Created sub_agent_performance_metrics table");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sub_agent_self_improvement_actions (
        id SERIAL PRIMARY KEY,
        action_type TEXT NOT NULL,
        description TEXT NOT NULL,
        before_state JSONB,
        after_state JSONB,
        success_metrics JSONB,
        rollback_available TEXT,
        performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ Created sub_agent_self_improvement_actions table");

    console.log("✅ All Sub-Agent knowledge tables created successfully!");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateSubAgentKnowledge()
  .then(() => {
    console.log("Migration complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
