// Supabase Database Adapter
// This provides a compatibility layer for migrating from PostgreSQL to Supabase

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "../shared/schema";

// Supabase client types
export interface SupabaseConfig {
  url: string;
  serviceKey: string;
  dbUrl: string;
}

class SupabaseAdapter {
  private supabaseClient: SupabaseClient | null = null;
  private drizzleDb: any = null;
  private enabled: boolean = false;
  
  constructor() {
    // Check if Supabase is configured
    this.enabled = !!(
      process.env.SUPABASE_URL && 
      process.env.SUPABASE_SERVICE_KEY && 
      process.env.SUPABASE_DB_URL
    );
    
    if (this.enabled) {
      console.log('[Supabase] Configuration detected, initializing adapter...');
      this.initialize();
    } else {
      console.log('[Supabase] Not configured, using legacy PostgreSQL');
    }
  }
  
  private initialize() {
    try {
      // Initialize Supabase client for Auth and Storage
      this.supabaseClient = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          }
        }
      );
      
      // Initialize Drizzle ORM with Supabase database
      if (process.env.SUPABASE_DB_URL) {
        const connectionString = process.env.SUPABASE_DB_URL;
        const client = postgres(connectionString, {
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10,
        });
        
        this.drizzleDb = drizzle(client, { schema });
        console.log('[Supabase] Database adapter initialized successfully');
      }
    } catch (error) {
      console.error('[Supabase] Failed to initialize adapter:', error);
      this.enabled = false;
    }
  }
  
  // Check if Supabase is enabled
  isEnabled(): boolean {
    return this.enabled;
  }
  
  // Get Supabase client for Auth and Storage
  getClient(): SupabaseClient | null {
    return this.supabaseClient;
  }
  
  // Get Drizzle DB instance for Supabase
  getDb(): any {
    return this.drizzleDb;
  }
  
  // Feature flag for gradual migration
  useSupabaseAuth(): boolean {
    return this.enabled && process.env.USE_SUPABASE_AUTH === 'true';
  }
  
  useSupabaseStorage(): boolean {
    return this.enabled && process.env.USE_SUPABASE_STORAGE === 'true';
  }
  
  useSupabaseDb(): boolean {
    return this.enabled && process.env.USE_SUPABASE_DB === 'true';
  }
}

// Singleton instance
export const supabaseAdapter = new SupabaseAdapter();

// Export convenience methods
export function getSupabaseClient(): SupabaseClient | null {
  return supabaseAdapter.getClient();
}

export function getSupabaseDb(): any {
  return supabaseAdapter.getDb();
}

// Migration helper: Dual-write pattern
export async function dualWrite<T>(
  operation: string,
  legacyFn: () => Promise<T>,
  supabaseFn: () => Promise<T>
): Promise<T> {
  // Execute on legacy system first (source of truth during migration)
  const result = await legacyFn();
  
  // If Supabase is enabled, write to it as well (async, non-blocking)
  if (supabaseAdapter.isEnabled() && supabaseAdapter.useSupabaseDb()) {
    supabaseFn().catch(error => {
      console.error(`[DualWrite] Failed to replicate ${operation} to Supabase:`, error);
      // Don't throw - legacy operation succeeded
    });
  }
  
  return result;
}