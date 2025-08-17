const express = require("express");
const router = express.Router();
const {
  changePassword,
  setup2FA,
  enable2FA,
  disable2FA,
  getSessions,
  revokeSession,
  revokeAllSessions,
  getLoginHistory,
  requestPasswordReset,
  resetPassword,
  verifyEmail
} = require("../controllers/securitycontroller");
const { protect } = require("../middleware/authMiddleware");

// Public routes (no authentication required)
// @route   POST /api/security/password-reset-request
// @desc    Request password reset
// @access  Public
router.post("/password-reset-request", requestPasswordReset);

// @route   POST /api/security/password-reset
// @desc    Reset password with token
// @access  Public
router.post("/password-reset", resetPassword);

// @route   POST /api/security/verify-email
// @desc    Verify email address
// @access  Public
router.post("/verify-email", verifyEmail);

// Protected routes (authentication required)
router.use(protect);

// Password Management
// @route   PUT /api/security/change-password
// @desc    Change password
// @access  Private
router.put("/change-password", changePassword);

// Two-Factor Authentication
// @route   POST /api/security/2fa/setup
// @desc    Setup 2FA (get QR code and secret)
// @access  Private
router.post("/2fa/setup", setup2FA);

// @route   PUT /api/security/2fa/enable
// @desc    Enable 2FA after verification
// @access  Private
router.put("/2fa/enable", enable2FA);

// @route   PUT /api/security/2fa/disable
// @desc    Disable 2FA
// @access  Private
router.put("/2fa/disable", disable2FA);

// Session Management
// @route   GET /api/security/sessions
// @desc    Get active sessions
// @access  Private
router.get("/sessions", getSessions);

// @route   DELETE /api/security/sessions/:sessionId
// @desc    Revoke specific session
// @access  Private
router.delete("/sessions/:sessionId", revokeSession);

// @route   DELETE /api/security/sessions/revoke-all
// @desc    Revoke all sessions except current
// @access  Private
router.delete("/sessions/revoke-all", revokeAllSessions);

// Login History
// @route   GET /api/security/login-history
// @desc    Get login history
// @access  Private
router.get("/login-history", getLoginHistory);

module.exports = router;