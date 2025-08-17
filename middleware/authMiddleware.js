const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");

// Protect routes middleware
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        res.status(401);
        throw new Error("Not authorized - user not found");
      }

      // Check if user account is active
      if (req.user.admin.status !== "active") {
        res.status(401);
        throw new Error("Account is suspended or deactivated");
      }

      // Update last active timestamp
      await req.user.updateLastActive();

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Not authorized - invalid token");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized - no token provided");
  }
});

// Admin middleware
const admin = asyncHandler(async (req, res, next) => {
  if (req.user && (req.user.admin.role === "admin" || req.user.admin.role === "super_admin")) {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as admin");
  }
});

// Super admin middleware
const superAdmin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.admin.role === "super_admin") {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as super admin");
  }
});

// Check subscription middleware
const checkSubscription = (requiredPlan = "pro") => {
  return asyncHandler(async (req, res, next) => {
    const user = req.user;
    
    if (!user.isSubscriptionActive) {
      res.status(403);
      throw new Error("Active subscription required");
    }

    const planHierarchy = ["free", "pro", "team", "enterprise"];
    const userPlanIndex = planHierarchy.indexOf(user.subscription.plan);
    const requiredPlanIndex = planHierarchy.indexOf(requiredPlan);

    if (userPlanIndex < requiredPlanIndex) {
      res.status(403);
      throw new Error(`${requiredPlan} plan or higher required`);
    }

    next();
  });
};

// Check usage limit middleware
const checkUsageLimit = (resource) => {
  return asyncHandler(async (req, res, next) => {
    const user = req.user;
    
    if (!user.checkLimit(resource)) {
      res.status(403);
      throw new Error(`Usage limit exceeded for ${resource}`);
    }

    next();
  });
};

// Check permission middleware
const checkPermission = (permission) => {
  return asyncHandler(async (req, res, next) => {
    const user = req.user;
    
    if (!user.hasPermission(permission)) {
      res.status(403);
      throw new Error(`Permission denied: ${permission}`);
    }

    next();
  });
};

// Rate limiting middleware for sensitive operations
const rateLimitSensitive = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Count recent sensitive actions (password changes, 2FA changes, etc.)
  const recentActions = user.security.loginAttempts.filter(
    attempt => attempt.timestamp > oneHourAgo && attempt.success
  );

  if (recentActions.length > 5) {
    res.status(429);
    throw new Error("Too many sensitive operations. Please try again later.");
  }

  next();
});

// Verify email middleware
const verifyEmail = asyncHandler(async (req, res, next) => {
  if (!req.user.security.verification.email.verified) {
    res.status(403);
    throw new Error("Email verification required");
  }
  next();
});

// 2FA verification middleware (when enabled)
const verify2FA = asyncHandler(async (req, res, next) => {
  const user = req.user;
  
  if (user.security.twoFactorAuth.enabled) {
    const { twoFactorToken } = req.body;
    
    if (!twoFactorToken) {
      res.status(401);
      throw new Error("2FA token required");
    }

    const speakeasy = require('speakeasy');
    const verified = speakeasy.totp.verify({
      secret: user.security.twoFactorAuth.secret,
      encoding: 'base32',
      token: twoFactorToken,
      window: 1
    });

    if (!verified) {
      res.status(401);
      throw new Error("Invalid 2FA token");
    }

    // Update last used
    user.security.twoFactorAuth.lastUsed = new Date();
    await user.save();
  }

  next();
});

module.exports = {
  protect,
  admin,
  superAdmin,
  checkSubscription,
  checkUsageLimit,
  checkPermission,
  rateLimitSensitive,
  verifyEmail,
  verify2FA
};