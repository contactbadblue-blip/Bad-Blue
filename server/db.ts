// Database setup - optimized for Supabase PostgreSQL
// Optimized for 500+ concurrent users
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use Supabase database URL if available, otherwise fall back to DATABASE_URL
const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Module-level pool and drizzle instance (use 'let' so they can be reassigned during repairs)
export let pool = new Pool({ 
  connectionString: databaseUrl,
  max: 100,
  min: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

// Global error handler to prevent unhandled error crashes
pool.on('error', (err, client) => {
  console.error('[DATABASE POOL] Unexpected error on idle client:', err.message);
  console.error('[DATABASE POOL] Error code:', (err as any).code);
  console.error('[DATABASE POOL] Error severity:', (err as any).severity);
  
  if (err.message?.includes('shutdown') || err.message?.includes('termination') || 
      err.message?.includes('Cannot use a pool after calling end') ||
      err.message?.includes('Connection terminated')) {
    console.log('[DATABASE POOL] Database connection issue detected - will auto-recover');
    // Don't call resetPool here as it might cause recursion
  }
});

console.log('[DATABASE] Connection pool created - ready for queries');

export let db = drizzle(pool, { schema });

// Reset lock to prevent concurrent pool resets
let resetInProgress: Promise<void> | null = null;

/**
 * Reset the database connection pool and Drizzle instance
 * Used by Worker auto-repair to recover from connection failures
 * Thread-safe: prevents concurrent resets
 */
export async function resetPool(): Promise<void> {
  if (resetInProgress) {
    console.log('[DATABASE] Reset already in progress - waiting...');
    await resetInProgress;
    return;
  }

  resetInProgress = (async () => {
    try {
      console.log('[DATABASE] Resetting connection pool...');

      try {
        await pool.end();
        console.log('[DATABASE] Old pool closed');
      } catch (error) {
        console.warn('[DATABASE] Error closing old pool (may already be closed):', error);
      }

      const newDatabaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
      if (!newDatabaseUrl) {
        throw new Error('DATABASE_URL not available for pool reset');
      }

      pool = new Pool({
        connectionString: newDatabaseUrl,
        max: 100,
        min: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: { rejectUnauthorized: false },
      });

      // Re-attach error handler to new pool
      pool.on('error', (err, client) => {
        console.error('[DATABASE POOL] Unexpected error on idle client:', err.message);
        if (err.message?.includes('shutdown') || err.message?.includes('termination')) {
          console.log('[DATABASE POOL] Database connection terminated - pool will reconnect automatically');
        }
      });

      db = drizzle(pool, { schema });

      await db.execute('SELECT 1');

      console.log('[DATABASE] ✓ Pool reset successful - connection restored');
    } catch (error) {
      console.error('[DATABASE] ❌ Pool reset failed:', error);
      throw error;
    } finally {
      resetInProgress = null;
    }
  })();

  await resetInProgress;
}
