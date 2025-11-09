// Rate Limiting Middleware
// Protects API from abuse and ensures fair resource distribution for 500+ concurrent users

import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

// In-memory store for rate limiting
// For production with multiple servers, use Redis instead
const rateLimitStore: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetAt < now) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string;
  statusCode?: number;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

/**
 * Create a rate limiting middleware
 * 
 * @param options Rate limit configuration
 * @returns Express middleware function
 */
export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    statusCode = 429,
    skipSuccessfulRequests = false,
    keyGenerator = (req: Request) => {
      // Default: Use user ID if authenticated, otherwise IP address
      const userId = (req as any).user?.claims?.sub;
      return userId || req.ip || 'anonymous';
    },
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Initialize or get current rate limit data
    if (!rateLimitStore[key] || rateLimitStore[key].resetAt < now) {
      rateLimitStore[key] = {
        count: 0,
        resetAt: now + windowMs,
      };
    }

    // Increment request count
    rateLimitStore[key].count++;

    // Set rate limit headers
    const timeRemaining = Math.ceil((rateLimitStore[key].resetAt - now) / 1000);
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - rateLimitStore[key].count).toString());
    res.setHeader('X-RateLimit-Reset', timeRemaining.toString());

    // Check if limit exceeded
    if (rateLimitStore[key].count > max) {
      res.setHeader('Retry-After', timeRemaining.toString());
      return res.status(statusCode).json({
        error: message,
        retryAfter: timeRemaining,
      });
    }

    // If skipSuccessfulRequests, decrement on successful response
    if (skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function(data: any) {
        if (res.statusCode < 400) {
          rateLimitStore[key].count--;
        }
        return originalSend.call(this, data);
      };
    }

    next();
  };
}

// Pre-configured rate limiters for different use cases

/**
 * General API rate limiter
 * 100 requests per 15 minutes per user/IP
 */
export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many API requests. Please try again in 15 minutes.',
});

/**
 * Strict rate limiter for sensitive endpoints
 * 10 requests per 15 minutes per user/IP
 */
export const strictRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many requests to this endpoint. Please try again later.',
});

/**
 * Auth rate limiter (login, register)
 * 5 attempts per 15 minutes per IP
 */
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts. Please try again later.',
  keyGenerator: (req: Request) => req.ip || 'anonymous', // Always use IP for auth
});

/**
 * Payment rate limiter
 * 3 payment attempts per hour per user
 */
export const paymentRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many payment attempts. Please try again in an hour.',
});

/**
 * AI Sub-Agent rate limiter
 * 20 commands per hour per admin
 */
export const subAgentRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many AI Sub-Agent commands. Please try again in an hour.',
});

/**
 * Autosave rate limiter
 * 200 saves per 15 minutes per user (very generous for autosave)
 */
export const autosaveRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  skipSuccessfulRequests: true, // Don't count successful autosaves against limit
  message: 'Autosave rate limit exceeded. Please wait a moment.',
});
