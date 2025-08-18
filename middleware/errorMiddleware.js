const { sendErrorResponse, formatMongooseErrors } = require("../utils/responseUtils");

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    return sendErrorResponse(res, message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    return sendErrorResponse(res, message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = formatMongooseErrors(err);
    return sendErrorResponse(res, 'Validation Error', 400, errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    return sendErrorResponse(res, message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    return sendErrorResponse(res, message, 401);
  }

  // Rate limiting error
  if (err.type === 'entity.too.large') {
    const message = 'Request payload too large';
    return sendErrorResponse(res, message, 413);
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';
  
  return sendErrorResponse(res, message, statusCode);
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
  const message = `Route ${req.originalUrl} not found`;
  return sendErrorResponse(res, message, 404);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation error handler
const validationErrorHandler = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = {};
    errors.array().forEach(error => {
      if (!formattedErrors[error.path]) {
        formattedErrors[error.path] = [];
      }
      formattedErrors[error.path].push(error.msg);
    });
    
    return sendErrorResponse(res, 'Validation failed', 400, formattedErrors);
  }
  
  next();
};

// Database connection error handler
const handleDatabaseErrors = () => {
  const mongoose = require('mongoose');

  mongoose.connection.on("error", (err) => {
    console.error('MongoDB connection error:'.bgRed, err);
  });

  mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected");
  });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    } catch (err) {
      console.error('Error during graceful shutdown:', err);
      process.exit(1);
    }
  });
};

// Uncaught exception handler
const handleUncaughtExceptions = () => {
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', err);
    process.exit(1);
  });
};

// Request timeout handler
const timeoutHandler = (timeout = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeout, () => {
      const err = new Error('Request timeout');
      err.statusCode = 408;
      next(err);
    });
    next();
  };
};

// Memory usage monitor
const monitorMemoryUsage = () => {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const mb = (bytes) => Math.round(bytes / 1024 / 1024 * 100) / 100;
    
    console.log('Memory Usage:', {
      rss: `${mb(memUsage.rss)} MB`,
      heapTotal: `${mb(memUsage.heapTotal)} MB`,
      heapUsed: `${mb(memUsage.heapUsed)} MB`,
      external: `${mb(memUsage.external)} MB`
    });
    
    // Alert if memory usage is high
    if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      console.warn('High memory usage detected!');
    }
  }, 60000); // Check every minute
};

// CORS error handler
const corsErrorHandler = (err, req, res, next) => {
  if (err && err.type === 'CORS') {
    return sendErrorResponse(res, 'CORS policy violation', 403);
  }
  next(err);
};

// Rate limit error handler
const rateLimitErrorHandler = (err, req, res, next) => {
  if (err && err.type === 'RATE_LIMIT') {
    return sendErrorResponse(res, 'Too many requests. Please try again later.', 429);
  }
  next(err);
};

// Request size limit error handler
const sizeLimitErrorHandler = (err, req, res, next) => {
  if (err && err.type === 'entity.too.large') {
    return sendErrorResponse(res, 'Request entity too large', 413);
  }
  next(err);
};

// Custom error class for application errors
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Business logic error handler
const businessLogicErrorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return sendErrorResponse(res, err.message, err.statusCode);
  }
  next(err);
};

// Security error handler
const securityErrorHandler = (err, req, res, next) => {
  // Handle security-related errors
  if (err.message && err.message.includes('CSRF')) {
    return sendErrorResponse(res, 'CSRF token validation failed', 403);
  }
  
  if (err.message && err.message.includes('XSS')) {
    return sendErrorResponse(res, 'Potential XSS attack detected', 400);
  }
  
  next(err);
};

// Development error handler (shows stack trace)
const developmentErrorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    const response = {
      success: false,
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    };
    
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json(response);
  }
  
  next(err);
};

// Production error handler (hides sensitive information)
const productionErrorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    // Don't leak error details in production
    const message = err.isOperational ? err.message : 'Something went wrong';
    const statusCode = err.statusCode || 500;
    
    return sendErrorResponse(res, message, statusCode);
  }
  
  next(err);
};

// Error reporting to external services
const reportError = (err, req) => {
  // In production, you might want to send errors to services like:
  // - Sentry
  // - Rollbar
  // - Bugsnag
  // - CloudWatch
  
  if (process.env.NODE_ENV === 'production' && err.isOperational === false) {
    // Report only programming errors, not operational ones
    console.error('Error reported to monitoring service:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user._id : null,
      timestamp: new Date().toISOString()
    });
    
    // Example Sentry integration:
    // const Sentry = require('@sentry/node');
    // Sentry.captureException(err);
  }
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validationErrorHandler,
  handleDatabaseErrors,
  handleUncaughtExceptions,
  timeoutHandler,
  monitorMemoryUsage,
  corsErrorHandler,
  rateLimitErrorHandler,
  sizeLimitErrorHandler,
  AppError,
  businessLogicErrorHandler,
  securityErrorHandler,
  developmentErrorHandler,
  productionErrorHandler,
  reportError
};