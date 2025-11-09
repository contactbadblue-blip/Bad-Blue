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

// Configure connection pool for high concurrency (500+ users)
// Supabase uses connection pooling for optimal performance
export const pool = new Pool({ 
  connectionString: databaseUrl,
  max: 100, // Maximum pool size - allows 100 concurrent database connections
  min: 10, // Minimum pool size - keeps 10 connections ready
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Timeout for acquiring connection (10s)
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL
});

// CRITICAL: Global error handler to prevent unhandled error crashes
// Without this, database terminations crash the entire Node.js process
pool.on('error', (err, client) => {
  console.error('[DATABASE POOL] Unexpected error on idle client:', err.message);
  console.error('[DATABASE POOL] Error code:', (err as any).code);
  console.error('[DATABASE POOL] Error severity:', (err as any).severity);
  
  // Log the error but don't crash - the pool will handle reconnection
  if (err.message?.includes('shutdown') || err.message?.includes('termination')) {
    console.log('[DATABASE POOL] Database connection terminated - pool will reconnect automatically');
  }
  
  // The pool automatically removes terminated clients and creates new ones
  // No action needed - just prevent the crash
});

// Log successful pool creation
console.log('[DATABASE] Connection pool created - ready for queries');

export const db = drizzle(pool, { schema });
