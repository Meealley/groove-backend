const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const colors = require("colors");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const connectDB = require("./config/db");
const {
  notFoundHandler,
  errorHandler,
  handleDatabaseErrors,
  handleUncaughtExceptions,
} = require("./middleware/errorMiddleware");

// Import routes
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const preferencesRoutes = require("./routes/preferencesRoutes");
const profileRoutes = require("./routes/profileRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const adminRoutes = require("./routes/adminRoutes");
const teamRoutes = require("./routes/teamRoutes")

// Initialize Express app
const app = express();

// Error Handling for uncaught exceptions
handleUncaughtExceptions();

// Connect to database
connectDB();
handleDatabaseErrors();

// Trust proxy (important for rate limiting and getting real IP addresses)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: process.env.MAX_JSON_SIZE || '10mb',
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: false, 
  limit: process.env.MAX_URL_ENCODED_SIZE || '10mb'
}));

// Data sanitization - Custom MongoDB injection prevention
// Data sanitization - Fixed MongoDB injection prevention
const mongoSanitizeCustom = (req, res, next) => {
  const emailFields = ['email'] // Add other email field names if needed
  
  const sanitize = (payload, keyPath = '') => {
    if (payload && typeof payload === 'object') {
      for (const key in payload) {
        const currentPath = keyPath ? `${keyPath}.${key}` : key;
        
        if (typeof payload[key] === 'string') {
          // Remove MongoDB operators ($ prefix)
          payload[key] = payload[key].replace(/^\$/, '');
          
          // Only remove dots if this is NOT an email field
          const isEmailField = emailFields.some(emailField => 
            key.toLowerCase().includes(emailField.toLowerCase()) ||
            currentPath.toLowerCase().includes(emailField.toLowerCase())
          );
          
          if (!isEmailField) {
            // Remove dots from non-email fields to prevent injection
            payload[key] = payload[key].replace(/\./g, '');
          }
        } else if (typeof payload[key] === 'object') {
          sanitize(payload[key], currentPath);
        }
      }
    }
  };

  // Sanitize request body
  if (req.body) {
    sanitize(req.body);
  }

  // Sanitize query parameters (create a new object to avoid read-only issues)
  if (req.query) {
    const sanitizedQuery = {};
    for (const key in req.query) {
      const isEmailField = emailFields.some(emailField => 
        key.toLowerCase().includes(emailField.toLowerCase())
      );
      
      if (typeof req.query[key] === 'string') {
        let sanitized = req.query[key].replace(/^\$/, '');
        if (!isEmailField) {
          sanitized = sanitized.replace(/\./g, '');
        }
        sanitizedQuery[key] = sanitized;
      } else {
        sanitizedQuery[key] = req.query[key];
      }
    }
    // Override the query object safely
    Object.defineProperty(req, 'query', {
      value: sanitizedQuery,
      writable: true,
      configurable: true
    });
  }

  next();
};

app.use(mongoSanitizeCustom); // Custom MongoDB injection prevention
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Custom XSS protection middleware (replacement for deprecated xss-clean)
const xssProtection = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Basic XSS protection - escape dangerous characters
      return value
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    if (obj === null || typeof obj !== 'object') {
      return sanitizeValue(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    const sanitized = {};
    Object.keys(obj).forEach(key => {
      sanitized[key] = sanitizeObject(obj[key]);
    });
    return sanitized;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

app.use(xssProtection);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint (before other routes)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3020,
    message: 'TaskGroove API is running smoothly! 🚀'
  });
});

// Test endpoint for debugging
app.get('/test', (req, res) => {
  res.json({
    message: 'Test endpoint working!',
    query: req.query,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/preferences", preferencesRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teams", teamRoutes);

// Root route
app.get("/api/", (_req, res) => {
  res.json({
    ok: true,
    message: "TaskGroove API — core for anyone to keep track of their tasks",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      users: "/api/users",
      tasks: "/api/tasks", 
      preferences: "/api/preferences",
      profile: "/api/profile",
      subscription: "/api/subscription",
      analytics: "/api/analytics",
      admin: "/api/admin"
    },
    documentation: "See README.md for API documentation"
  });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3020;

const server = app.listen(PORT, () => {
  console.log(`🚀 TaskGroove API Server`.cyan.bold);
  console.log(`📡 Server running on port ${PORT}`.cyan);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`.cyan);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`.cyan);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/`.cyan);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`.yellow);
  
  server.close(async (err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('Server closed successfully'.green);
    
    try {
    
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      console.log('Database connection closed'.green);
      
      console.log('Graceful shutdown completed'.green);
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });
  

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down'.red);
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;