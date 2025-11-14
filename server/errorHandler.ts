// Centralized Error Handler for BadBlue Platform
// Provides consistent error responses and logging across the application

import type { Request, Response, NextFunction } from 'express';

// Custom error class for application-specific errors
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode: number, isOperational = true, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error types for common scenarios
export const ErrorTypes = {
  // Authentication & Authorization
  UNAUTHORIZED: (message = 'Unauthorized access') => new AppError(message, 401),
  FORBIDDEN: (message = 'Access forbidden') => new AppError(message, 403),
  INVALID_CREDENTIALS: () => new AppError('Invalid username or password', 401),
  SESSION_EXPIRED: () => new AppError('Session expired. Please login again', 401),
  
  // Validation & Input
  VALIDATION_ERROR: (message: string, details?: any) => new AppError(message, 400, true, details),
  MISSING_REQUIRED_FIELDS: (fields: string[]) => 
    new AppError(`Missing required fields: ${fields.join(', ')}`, 400, true, { fields }),
  INVALID_INPUT: (message = 'Invalid input data') => new AppError(message, 400),
  
  // Resource & Database
  NOT_FOUND: (resource = 'Resource') => new AppError(`${resource} not found`, 404),
  DUPLICATE_ENTRY: (field: string) => new AppError(`${field} already exists`, 409),
  DATABASE_ERROR: (message = 'Database operation failed') => new AppError(message, 500, false),
  
  // Payment & Stripe
  PAYMENT_FAILED: (message = 'Payment processing failed') => new AppError(message, 402),
  STRIPE_ERROR: (message: string) => new AppError(`Payment error: ${message}`, 402),
  INSUFFICIENT_FUNDS: () => new AppError('Insufficient funds for this transaction', 402),
  
  // Rate Limiting & Security
  RATE_LIMIT_EXCEEDED: (retryAfter?: number) => 
    new AppError('Too many requests. Please try again later', 429, true, { retryAfter }),
  SUSPICIOUS_ACTIVITY: () => new AppError('Suspicious activity detected', 403),
  
  // AI & External Services
  AI_SERVICE_ERROR: (service: string) => new AppError(`${service} AI service unavailable`, 503),
  EXTERNAL_API_ERROR: (api: string) => new AppError(`External service error: ${api}`, 503),
  QUOTA_EXCEEDED: (service: string) => new AppError(`${service} quota exceeded`, 503),
  
  // File & Storage
  FILE_TOO_LARGE: (maxSize: string) => new AppError(`File size exceeds ${maxSize} limit`, 413),
  INVALID_FILE_TYPE: (allowedTypes: string[]) => 
    new AppError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`, 415),
  STORAGE_ERROR: () => new AppError('File storage operation failed', 500, false),
  
  // Server & System
  INTERNAL_ERROR: () => new AppError('Internal server error', 500, false),
  SERVICE_UNAVAILABLE: () => new AppError('Service temporarily unavailable', 503),
  MAINTENANCE_MODE: () => new AppError('System under maintenance. Please try again later', 503),
};

// Error logger for production monitoring
function logError(error: AppError | Error, req: Request) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.id || null,
    error: {
      message: error.message,
      stack: error.stack,
      statusCode: error instanceof AppError ? error.statusCode : 500,
      isOperational: error instanceof AppError ? error.isOperational : false,
      details: error instanceof AppError ? error.details : undefined,
    }
  };

  // Log to console in development, could send to monitoring service in production
  if (process.env.NODE_ENV !== 'production' || !(error instanceof AppError && error.isOperational)) {
    console.error('[ERROR]', JSON.stringify(errorLog, null, 2));
  }
}

// Main error handling middleware
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // Log the error
  logError(err, req);

  // Handle Stripe errors specifically
  if (err.name === 'StripeError' || (err as any).type?.includes('Stripe')) {
    const stripeError = err as any;
    return res.status(402).json({
      error: 'Payment processing error',
      message: stripeError.message,
      code: stripeError.code,
    });
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const zodError = err as any;
    return res.status(400).json({
      error: 'Validation error',
      message: 'Invalid request data',
      details: zodError.errors,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication error',
      message: 'Invalid or expired token',
    });
  }

  // Handle multer file upload errors
  if (err.name === 'MulterError') {
    const multerError = err as any;
    let message = 'File upload error';
    let statusCode = 400;
    
    if (multerError.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large';
      statusCode = 413;
    } else if (multerError.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    }
    
    return res.status(statusCode).json({
      error: 'Upload error',
      message,
      code: multerError.code,
    });
  }

  // Handle our custom AppError
  if (err instanceof AppError) {
    const response: any = {
      error: err.message,
      statusCode: err.statusCode,
    };

    // Include details in development or for operational errors
    if (process.env.NODE_ENV !== 'production' || err.isOperational) {
      response.details = err.details;
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle database errors
  if (err.message?.includes('duplicate key') || err.message?.includes('unique constraint')) {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'This record already exists',
    });
  }

  if (err.message?.includes('foreign key') || err.message?.includes('constraint')) {
    return res.status(400).json({
      error: 'Invalid reference',
      message: 'Referenced record does not exist',
    });
  }

  // Default error response for unhandled errors
  const isDevelopment = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'An unexpected error occurred',
    ...(isDevelopment && { stack: err.stack }),
  });
}

// Async error wrapper to catch errors in async route handlers
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Middleware to handle 404 errors
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Not found',
    message: `Cannot ${req.method} ${req.path}`,
  });
}

// Validation middleware factory
export function validateRequest(schema: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}