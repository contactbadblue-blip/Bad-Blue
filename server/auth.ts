// Platform-agnostic authentication setup
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { sendWelcomeEmail } from "./emailService";
import { setupLocalStrategy } from "./localAuth";


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


export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup local strategy for username/password auth
  setupLocalStrategy();

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  console.log("✓ Local authentication enabled");
  
  // Setup authentication routes for local auth only
  app.get("/api/login", (req, res) => {
    res.status(501).json({ 
      message: "Use local authentication endpoint (/api/auth/login) for login.",
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

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // User is authenticated - continue
  return next();
};
