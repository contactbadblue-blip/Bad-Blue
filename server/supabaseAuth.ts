// Supabase Auth Adapter - Compatibility layer for migration from Passport.js to Supabase Auth

import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { supabaseAdapter } from './supabaseAdapter';
import { storage } from './storage';
import type { Request, Response, NextFunction } from 'express';

interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isAdmin?: boolean;
}

class SupabaseAuthAdapter {
  private client: SupabaseClient | null = null;
  
  constructor() {
    this.client = supabaseAdapter.getClient();
  }
  
  /**
   * Authenticate a user using Supabase Auth
   * Maintains compatibility with existing passport.js interface
   */
  async authenticateUser(email: string, password: string): Promise<AuthUser | null> {
    if (!this.client || !supabaseAdapter.useSupabaseAuth()) {
      return null; // Fallback to passport.js
    }
    
    try {
      // Special case: Admin bypass (maintain existing functionality)
      const adminBypassId = process.env.ADMIN_BYPASS_ID || "$ADMIN85";
      const adminBypassPassword = process.env.ADMIN_BYPASS_PASSWORD || "SARBEAR";
      
      if ((email === adminBypassId || email === "admin") && password === adminBypassPassword) {
        // Return admin user without hitting Supabase
        return {
          id: 'admin-bypass',
          email: 'brclink1985@gmail.com',
          firstName: 'Bypass',
          lastName: 'User',
          isAdmin: true
        };
      }
      
      // Normal Supabase authentication
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });
      
      if (error || !data.user) {
        console.error('[SupabaseAuth] Authentication failed:', error);
        return null;
      }
      
      // Map Supabase user to our AuthUser format
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        firstName: data.user.user_metadata?.firstName,
        lastName: data.user.user_metadata?.lastName,
        isAdmin: data.user.id === 'admin-bypass'
      };
      
      // Update last login in our database
      await storage.updateUserLastLogin(authUser.id);
      
      return authUser;
    } catch (error) {
      console.error('[SupabaseAuth] Error during authentication:', error);
      return null;
    }
  }
  
  /**
   * Register a new user with Supabase Auth
   */
  async registerUser(
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string
  ): Promise<{ user: AuthUser; error?: string }> {
    if (!this.client || !supabaseAdapter.useSupabaseAuth()) {
      throw new Error('Supabase Auth not configured');
    }
    
    try {
      // Create user in Supabase Auth
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName,
            lastName
          }
        }
      });
      
      if (error || !data.user) {
        return {
          user: null as any,
          error: error?.message || 'Registration failed'
        };
      }
      
      // Create user record in our database
      const dbUser = await storage.upsertUser({
        id: data.user.id,
        email: data.user.email!,
        firstName,
        lastName,
        profileImageUrl: null,
        lastLoginAt: new Date()
      });
      
      return {
        user: {
          id: dbUser.id,
          email: dbUser.email || email,
          firstName: dbUser.firstName || firstName,
          lastName: dbUser.lastName || lastName
        }
      };
    } catch (error: any) {
      console.error('[SupabaseAuth] Registration error:', error);
      return {
        user: null as any,
        error: error.message || 'Registration failed'
      };
    }
  }
  
  /**
   * Middleware to check if user is authenticated
   * Compatible with existing Express middleware pattern
   */
  async isAuthenticated(req: Request & { user?: any }, res: Response, next: NextFunction) {
    if (!supabaseAdapter.useSupabaseAuth()) {
      // Use existing passport.js authentication
      return next();
    }
    
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Check session for backward compatibility
        if (req.user) {
          return next();
        }
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const token = authHeader.substring(7);
      
      if (!this.client) {
        return res.status(500).json({ message: 'Auth not configured' });
      }
      
      const { data: { user }, error } = await this.client.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      // Attach user to request for compatibility
      req.user = {
        id: user.id,
        email: user.email,
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.user_metadata?.firstName,
          last_name: user.user_metadata?.lastName
        }
      };
      
      next();
    } catch (error) {
      console.error('[SupabaseAuth] Authentication check error:', error);
      res.status(500).json({ message: 'Authentication error' });
    }
  }
  
  /**
   * Get current user from token
   */
  async getCurrentUser(token: string): Promise<AuthUser | null> {
    if (!this.client || !supabaseAdapter.useSupabaseAuth()) {
      return null;
    }
    
    try {
      const { data: { user }, error } = await this.client.auth.getUser(token);
      
      if (error || !user) {
        return null;
      }
      
      return {
        id: user.id,
        email: user.email!,
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        isAdmin: user.id === 'admin-bypass'
      };
    } catch (error) {
      console.error('[SupabaseAuth] Error getting current user:', error);
      return null;
    }
  }
  
  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    if (!this.client || !supabaseAdapter.useSupabaseAuth()) {
      return;
    }
    
    try {
      await this.client.auth.signOut();
    } catch (error) {
      console.error('[SupabaseAuth] Sign out error:', error);
    }
  }
}

// Export singleton instance
export const supabaseAuth = new SupabaseAuthAdapter();

// Export middleware for easy use
export const isAuthenticated = supabaseAuth.isAuthenticated.bind(supabaseAuth);