import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function createDeviceRateLimitTables() {
  console.log('[Migration] Starting Device Rate Limit tables creation...');

  try {
    // Create officer_search_device_limits table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS officer_search_device_limits (
        id SERIAL PRIMARY KEY,
        device_fingerprint VARCHAR(64) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT NOT NULL,
        user_id VARCHAR(255),
        officer_name VARCHAR(255) NOT NULL,
        searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[Migration] ✓ Created officer_search_device_limits table');

    // Create indexes for officer_search_device_limits
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_device_fingerprint ON officer_search_device_limits(device_fingerprint);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_searched_at ON officer_search_device_limits(searched_at);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_device_time ON officer_search_device_limits(device_fingerprint, searched_at);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_id ON officer_search_device_limits(user_id);
    `);
    console.log('[Migration] ✓ Created indexes for officer_search_device_limits');

    console.log('[Migration] ✅ Successfully created Device Rate Limit tables and indexes');
    console.log('[Migration] ✅ Officer Search Device Limits table: READY for rate limiting');
  } catch (error) {
    console.error('[Migration] Error creating Device Rate Limit tables:', error);
    // Don't throw - allow app to start even if migration fails
    // The rate limiter will fail closed if the table doesn't exist
  }
}