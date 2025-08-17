const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const { sendRateLimitResponse } = require('../utils/responseUtils');

// Redis client for rate limiting (optional, falls back to memory)
let redisClient = null;
if (process.env.REDIS_URL) {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL
    });
    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
      redisClient = null;
    });
  } catch (error) {
    console.error('Failed to create Redis client:', error);
  }
}

// Create rate limit store
const createStore = () => {
  if (redisClient) {
    return new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
    });
  }
  return undefined; // Use default memory store
};

// Helper function for IPv6-safe key generation
const createKeyGenerator = (prefix, useUser = false) => {
  return (req, res) => {
    if (useUser && req.user) {
      return `${prefix}:user:${req.user._id}`;
    }
    // Use the built-in IP key generator for IPv6 safety
    const ipKey = req.ipKeyGenerator ? req.ipKeyGenerator() : req.ip;
    return `${prefix}:ip:${ipKey}`;
  };
};

// Standard message function
const standardMessage = (req, res) => {
  return sendRateLimitResponse(res, 'Too many requests, please try again later');
};

// General API rate limit (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: standardMessage,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore(),
  keyGenerator: createKeyGenerator('api', true),
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});

// Strict rate limit for authentication routes (5 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: (req, res) => {
    return sendRateLimitResponse(res, 'Too many authentication attempts, please try again in 15 minutes');
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore(),
  keyGenerator: (req, res) => {
    const email = req.body.email || 'unknown';
    const ipKey = req.ipKeyGenerator ? req.ipKeyGenerator() : req.ip;
    return `auth:${ipKey}:${email}`;
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Password reset rate limit (3 requests per hour)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: (req, res) => {
    return sendRateLimitResponse(res, 'Too many password reset attempts, please try again in 1 hour');
  },
  store: createStore(),
  keyGenerator: (req, res) => {
    const email = req.body.email || 'unknown';
    const ipKey = req.ipKeyGenerator ? req.ipKeyGenerator() : req.ip;
    return `password-reset:${ipKey}:${email}`;
  },
});

// Email verification rate limit (5 requests per hour)
const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: (req, res) => {
    return sendRateLimitResponse(res, 'Too many verification email requests, please try again in 1 hour');
  },
  store: createStore(),
  keyGenerator: createKeyGenerator('email-verification', true),
});

// File upload rate limit (10 uploads per hour)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: (req, res) => {
    return sendRateLimitResponse(res, 'Too many file uploads, please try again in 1 hour');
  },
  store: createStore(),
  keyGenerator: createKeyGenerator('upload', true),
});

// API key creation rate limit (2 per day)
const apiKeyCreationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 2,
  message: (req, res) => {
    return sendRateLimitResponse(res, 'Too many API key creation attempts, please try again tomorrow');
  },
  store: createStore(),
  keyGenerator: (req, res) => `api-key-creation:${req.user._id}`,
});

// Webhook creation rate limit (5 per day)
const webhookCreationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  message: (req, res) => {
    return sendRateLimitResponse(res, 'Too many webhook creation attempts, please try again tomorrow');
  },
  store: createStore(),
  keyGenerator: (req, res) => `webhook-creation:${req.user._id}`,
});

// Admin actions rate limit (50 per hour)
const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: (req, res) => {
    return sendRateLimitResponse(res, 'Too many admin actions, please slow down');
  },
  store: createStore(),
  keyGenerator: (req, res) => `admin:${req.user._id}`,
  skip: (req) => {
    // Only apply to admin users
    return !req.user || !['admin', 'super_admin'].includes(req.user.admin.role);
  }
});

// Search rate limit (30 searches per minute)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: (req, res) => {
    return sendRateLimitResponse(res, 'Too many search requests, please slow down');
  },
  store: createStore(),
  keyGenerator: createKeyGenerator('search', true),
});

// Export rate limit (3 exports per hour)
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: (req, res) => {
    return sendRateLimitResponse(res, 'Too many export requests, please try again in 1 hour');
  },
  store: createStore(),
  keyGenerator: (req, res) => `export:${req.user._id}`,
});

// Progressive delay for repeated requests (Fixed for v2)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 20, // allow 20 requests per windowMs without delay
  delayMs: () => 500, // Fixed: use new v2 format - constant 500ms delay
  maxDelayMs: 5000, // maximum delay of 5 seconds
  store: createStore(),
  keyGenerator: createKeyGenerator('speed', true),
  validate: {
    delayMs: false, // Disable the warning about delayMs
  }
});

// 2FA verification rate limit (10 attempts per 15 minutes)
const twoFactorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: (req, res) => {
    return sendRateLimitResponse(res, 'Too many 2FA verification attempts, please try again in 15 minutes');
  },
  store: createStore(),
  keyGenerator: createKeyGenerator('2fa', true),
  skipSuccessfulRequests: true,
});

// Team operations rate limit (20 per hour)
const teamOperationsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: (req, res) => {
    return sendRateLimitResponse(res, 'Too many team operations, please try again in 1 hour');
  },
  store: createStore(),
  keyGenerator: (req, res) => `team-ops:${req.user._id}`,
});

// Subscription changes rate limit (5 per day)
const subscriptionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  message: (req, res) => {
    return sendRateLimitResponse(res, 'Too many subscription changes, please try again tomorrow');
  },
  store: createStore(),
  keyGenerator: (req, res) => `subscription:${req.user._id}`,
});

// Dynamic rate limiting based on user subscription plan
const dynamicRateLimiter = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  const plan = req.user.subscription.plan;
  let maxRequests = 100; // default for free plan
  
  switch (plan) {
    case 'pro':
      maxRequests = 500;
      break;
    case 'team':
      maxRequests = 1000;
      break;
    case 'enterprise':
      maxRequests = 5000;
      break;
  }

  const dynamicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: maxRequests,
    message: (req, res) => {
      return sendRateLimitResponse(res, `Rate limit exceeded for ${plan} plan. Upgrade for higher limits.`);
    },
    store: createStore(),
    keyGenerator: (req, res) => `dynamic:${req.user._id}`,
  });

  return dynamicLimiter(req, res, next);
};

// IP-based rate limiting for anonymous users
const anonymousLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // lower limit for anonymous users
  message: (req, res) => {
    return sendRateLimitResponse(res, 'Too many requests. Please register or login for higher limits.');
  },
  store: createStore(),
  keyGenerator: createKeyGenerator('anonymous', false),
  skip: (req) => {
    return !!req.user; // Skip if user is authenticated
  }
});

// Create custom rate limiter
const createCustomLimiter = (options) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: standardMessage,
    store: createStore(),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: createKeyGenerator('custom', true),
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// Rate limiting for specific endpoints
const endpointLimiters = {
  // Health check - no limit
  health: (req, res, next) => next(),
  
  // Public endpoints - light limits
  public: createCustomLimiter({ max: 50, windowMs: 15 * 60 * 1000 }),
  
  // Authentication - strict limits
  auth: authLimiter,
  
  // Password operations - very strict
  passwordReset: passwordResetLimiter,
  
  // Email operations
  emailVerification: emailVerificationLimiter,
  
  // File operations
  upload: uploadLimiter,
  
  // API management
  apiKeyCreation: apiKeyCreationLimiter,
  webhookCreation: webhookCreationLimiter,
  
  // Admin operations
  admin: adminLimiter,
  
  // Search operations
  search: searchLimiter,
  
  // Export operations
  export: exportLimiter,
  
  // 2FA operations
  twoFactor: twoFactorLimiter,
  
  // Team operations
  teamOperations: teamOperationsLimiter,
  
  // Subscription operations
  subscription: subscriptionLimiter,
};

// Cleanup function for graceful shutdown
const cleanup = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('Redis client closed');
    } catch (error) {
      console.error('Error closing Redis client:', error);
    }
  }
};

// Monitor rate limit metrics
const monitorRateLimits = () => {
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      // Here you would collect and send rate limit metrics to monitoring services
      console.log('Rate limit monitoring - timestamp:', new Date().toISOString());
    }, 60000); // Every minute
  }
};

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  uploadLimiter,
  apiKeyCreationLimiter,
  webhookCreationLimiter,
  adminLimiter,
  searchLimiter,
  exportLimiter,
  speedLimiter,
  twoFactorLimiter,
  teamOperationsLimiter,
  subscriptionLimiter,
  dynamicRateLimiter,
  anonymousLimiter,
  createCustomLimiter,
  endpointLimiters,
  cleanup,
  monitorRateLimits
};