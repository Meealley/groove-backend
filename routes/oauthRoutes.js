const express = require("express");
const router = express.Router();
const {
  googleAuth,
  appleAuth,
  linkOAuthAccount,
  unlinkOAuthAccount,
} = require("../controllers/oauthcontroller");
const { protect } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimitMiddleware");

// @route   POST /api/auth/google
// @desc    Authenticate with Google OAuth
// @access  Public
router.post("/google", authLimiter, googleAuth);

// @route   POST /api/auth/apple
// @desc    Authenticate with Apple OAuth
// @access  Public
router.post("/apple", authLimiter, appleAuth);

// @route   POST /api/auth/link-oauth
// @desc    Link OAuth account to existing user
// @access  Private
router.post("/link-oauth", protect, linkOAuthAccount);

// @route   DELETE /api/auth/unlink-oauth/:provider
// @desc    Unlink OAuth account
// @access  Private
router.delete("/unlink-oauth/:provider", protect, unlinkOAuthAccount);

module.exports = router;