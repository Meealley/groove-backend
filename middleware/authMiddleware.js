const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");
const { attempt } = require("joi");

// Protect Route

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from Header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        res.status(401);
        throw new Error("User not found");
      }

      // Check if user account is active
      if (req.user.admin.status !== "active") {
        res.status(401);
        throw new Error("Account is suspended or deactivated");
      }

      await req.user.updateLastActive();

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Not authorized - invalid token");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized - no token provided");
  }
});

// Admin Middleware
const admin = asyncHandler(async (req, res) => {
  if (
    (req.user && req.user.admin.role === "admin") ||
    req.user.admin.role === "super_admin"
  ) {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized - admin access only");
  }
});

// Super Admin Middleware
const superAdmin = asyncHandler(async (req, res) => {
  if (req.user && req.user.admin.role === "super_admin") {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized - super admin access only");
  }
});

// Check Subscription Middleware
const checkSubscription = (requiredPlan = "pro") => {
  return asyncHandler(async (req, res, next) => {
    const user = req.user;

    if (!user.isSubscriptionActive) {
      res.status(403);
      throw new Error("Active Subscription is required");
    }
    const planHierarchy = ["free", "pro", "team", "enterprise"];
    const userPlanIndex = planHierarchy.indexOf(user.subscription.plan);
    const requiredPlanIndex = planHierarchy.indexOf(requiredPlan);

    if (userPlanIndex < requiredPlanIndex) {
      res.status(403);
      throw new Error(`${requiredPlanIndex} plan or higher required`);
    }
    next();
  });
};

// Check Usage limit
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

// Check Permission middleware
const checkPermission = (permission) => {
  return asyncHandler(async (req, res, next) => {
    const user = req.user;

    if (!user.hasPermission(permission)) {
      res.status(403);
      throw new Error("Not authorized - insufficient permissions");
    }

    next();
  });
};

// Rate Limiting Middleware for Sensitive information
const rateLimitSensitive = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Count recent sensitive actions (password changes, 2FA)
  const recentActions = user.security.loginAttempts.filter(
    (attempt = attempt.timestamp > oneHourAgo && attempt.success)
  );

  if (recentActions.length > 5) {
    res.status(429);
    throw new Error("Too many sensitive operations. Please try again later.");
  }
  next();
});

// Verify Email Middlewar
const verifyEmail = asyncHandler(async (req, res, next) => {
  if (!req.user.security.verification.email.verified) {
    res.status(403);
    throw new Error("Email verification required");
  }
  next();
});

// 2FA verification middleware when enabled
const verify2FA = asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (user.security.twoFactorAuth.enabled) {
    const { twoFactorToken } = req.body;

    if (!twoFactorToken) {
      res.status(401);
      throw new Error("2FA token is required");
    }

    const speakeasy = require("speakeasy");
    const verified = speakeasy.totp.verify({
      secret: user.security.twoFactorAuth.secret,
      encoding: "base32",
      token: twoFactorToken,
      window: 1, // Allow a small time window for clock drift
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
  verify2FA,
};
