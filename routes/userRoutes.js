const express = require("express");
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getMe,
  refreshToken,
  logoutUser,
  verifyEmail,
  verifyEmailAPI,
  resendEmailVerification
} = require("../controllers/authcontroller");
const { protect } = require("../middleware/authMiddleware");
const { authLimiter, twoFactorLimiter, emailVerificationLimiter } = require("../middleware/rateLimitMiddleware");

// Include OAuth routes
// const oauthRoutes = require("./oauthRoutes");
// router.use("/", oauthRoutes);

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", authLimiter, registerUser);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", authLimiter, twoFactorLimiter, loginUser);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", protect, getMe);

// @route   POST /api/auth/refresh
// @desc    Refresh authentication token
// @access  Private
router.post("/refresh", protect, refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post("/logout", protect, logoutUser);

// @route   GET /api/auth/verify-email
// @desc    Verify email address (HTML response for email clicks)
// @access  Public
router.get("/verify-email", verifyEmail);

// @route   POST /api/auth/verify-email  
// @desc    Verify email address (JSON response for mobile apps)
// @access  Public
router.post("/verify-email", verifyEmailAPI);

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification
// @access  Private
router.post("/resend-verification", protect, emailVerificationLimiter, resendEmailVerification);

module.exports = router;