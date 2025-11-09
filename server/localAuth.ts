// Local Authentication (Username/Password) with bcrypt
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import crypto from "crypto";

const BCRYPT_SALT_ROUNDS = 12; // Strong hashing cost

/**
 * Hash a password using bcrypt with salt
 */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);
  return { hash, salt };
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Register a new user with username/password
 */
export async function registerLocalUser(username: string, password: string, email?: string) {
  // Check if username already exists
  const existing = await storage.getAuthAccountByUsername(username);
  if (existing) {
    throw new Error("Username already exists");
  }

  // Validate password strength
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  // Hash password
  const { hash, salt } = await hashPassword(password);

  // Create user
  const user = await storage.upsertUser({
    id: crypto.randomUUID(),
    email: email || null,
    firstName: username,
    lastName: null,
    profileImageUrl: null,
  });

  // Create auth account
  const authAccount = await storage.createAuthAccount({
    userId: user.id,
    authType: "local",
    username,
    passwordHash: hash,
    passwordSalt: salt,
  });

  return { user, authAccount };
}

/**
 * Setup passport-local strategy
 */
export function setupLocalStrategy() {
  passport.use(
    "local",
    new LocalStrategy(async (username, password, done) => {
      try {
        // Special case: Admin bypass (requires specific password)
        const adminBypassId = process.env.ADMIN_BYPASS_ID || "$ADMIN85";
        const adminBypassPassword = process.env.ADMIN_BYPASS_PASSWORD || "SARBEAR";
        
        if (username === adminBypassId) {
          // Verify admin password
          if (password !== adminBypassPassword) {
            return done(null, false, { message: "Invalid admin credentials" });
          }
          
          // Note: Admin access logging is handled in the route handler where
          // we have access to req.ip, req.get("user-agent"), and req.sessionID
          console.log(`[SECURITY] Admin bypass authentication successful`);
          
          // Create or get admin user
          let user = await storage.getUser("admin-bypass");
          if (!user) {
            user = await storage.upsertUser({
              id: "admin-bypass",
              email: "brclink1985@gmail.com",
              firstName: "Administrator",
              lastName: "Bypass",
              profileImageUrl: null,
              lastLoginAt: new Date(),
            });
          } else {
            // Update last login for existing admin user
            await storage.updateUserLastLogin("admin-bypass");
          }
          
          // Grant admin access without waiting (bypass payment gate)
          // Update happens asynchronously to avoid blocking authentication
          if (!user.hasPaidForAccess) {
            storage.updateUserAccess("admin-bypass", "admin-bypass", 0).catch(err => {
              console.error('[SECURITY] Failed to update admin access:', err);
            });
          }
          
          return done(null, {
            claims: { sub: user.id, email: user.email || "brclink1985@gmail.com", first_name: user.firstName },
            isAdminBypass: true,
          });
        }

        // Special case: Payment bypass (allows paid access without admin privileges)
        if (username === "bypass") {
          // Verify bypass password
          if (password !== "password") {
            return done(null, false, { message: "Invalid bypass credentials" });
          }
          
          console.log(`[SECURITY] Payment bypass authentication successful`);
          
          // Create or get payment bypass user
          let user = await storage.getUser("payment-bypass");
          if (!user) {
            user = await storage.upsertUser({
              id: "payment-bypass",
              email: "bypass@badblue.internal",
              firstName: "Payment",
              lastName: "Bypass",
              profileImageUrl: null,
              lastLoginAt: new Date(),
            });
          } else {
            // Update last login for existing bypass user
            await storage.updateUserLastLogin("payment-bypass");
          }
          
          // Grant paid access without admin privileges
          if (!user.hasPaidForAccess) {
            storage.updateUserAccess("payment-bypass", "payment-bypass", 0).catch(err => {
              console.error('[SECURITY] Failed to update payment bypass access:', err);
            });
          }
          
          return done(null, {
            claims: { sub: user.id, email: user.email || "bypass@badblue.internal", first_name: user.firstName },
            isAdminBypass: false, // Not admin - just payment bypass
          });
        }

        // Normal username/password authentication
        const authAccount = await storage.getAuthAccountByUsername(username);
        if (!authAccount) {
          return done(null, false, { message: "Invalid username or password" });
        }

        // Verify password
        const isValid = await verifyPassword(password, authAccount.passwordHash!);
        if (!isValid) {
          return done(null, false, { message: "Invalid username or password" });
        }

        // Update last login for both auth account and user
        await storage.updateAuthAccountLastLogin(authAccount.id);
        await storage.updateUserLastLogin(authAccount.userId);

        // Get user
        const user = await storage.getUser(authAccount.userId);
        if (!user) {
          return done(null, false, { message: "User not found" });
        }

        return done(null, {
          claims: { sub: user.id, email: user.email, first_name: user.firstName },
          isAdminBypass: false,
        });
      } catch (error) {
        return done(error);
      }
    })
  );
}
