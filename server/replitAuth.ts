// Replit Auth setup - from javascript_log_in_with_replit blueprint
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { sendWelcomeEmail } from "./emailService";
import { setupLocalStrategy } from "./localAuth";

// Helper to check if Replit OAuth is enabled
function isReplitOAuthEnabled(): boolean {
  return !!(
    process.env.REPLIT_DOMAINS &&
    process.env.REPL_ID &&
    process.env.ISSUER_URL
  );
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!,
    );
  },
  { maxAge: 3600 * 1000 },
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  // Check if user already exists
  const existingUser = await storage.getUser(claims["sub"]);
  const isNewUser = !existingUser;

  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    lastLoginAt: new Date(),
  });

  // Send welcome email to new users
  if (isNewUser && claims["email"] && claims["first_name"]) {
    // Don't await - send email in background
    sendWelcomeEmail({
      firstName: claims["first_name"],
      email: claims["email"]
    })
      .then((sent) => {
        if (sent) {
          console.log(`Welcome email sent to ${claims["email"]}`);
        }
      })
      .catch((error) => {
        console.error(
          `Failed to send welcome email to ${claims["email"]}:`,
          error,
        );
      });
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup local strategy for username/password auth (always available)
  setupLocalStrategy();

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Conditionally setup Replit OAuth if environment is configured
  if (isReplitOAuthEnabled()) {
    console.log("✓ Replit OAuth enabled - setting up OAuth strategies");
    
    const config = await getOidcConfig();

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback,
    ) => {
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      verified(null, user);
    };

    for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
    }

    app.get("/api/login", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });

    app.get("/api/callback", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href,
        );
      });
    });
  } else {
    console.log("ℹ Replit OAuth disabled - using local authentication only");
    console.log("  (Set REPLIT_DOMAINS, REPL_ID, and ISSUER_URL to enable OAuth)");
    
    // OAuth not configured - these routes are not available
    app.get("/api/login", (req, res) => {
      res.status(501).json({ 
        message: "OAuth login not configured. Use local authentication (/api/auth/login) instead.",
        localAuthAvailable: true 
      });
    });

    app.get("/api/callback", (req, res) => {
      res.status(404).json({ message: "OAuth callback not configured" });
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect("/");
      });
    });
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Local auth users (username/password and admin bypass) don't have expires_at or refresh_token
  // They only have claims object. OAuth users have expires_at.
  if (!user.expires_at) {
    // This is a local auth user - they're already authenticated, just continue
    return next();
  }

  // OAuth user - check token expiration and refresh if needed
  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
