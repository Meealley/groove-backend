const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const speakeasy = require('speakeasy'); 
const qrcode = require('qrcode');

// @desc    Change password
// @route   PUT /api/security/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current password and new password are required");
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }

  const user = await User.findById(req.user._id);
  
  // Verify current password
  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  // Hash and update new password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  
  // Log the password change
  user.security.loginAttempts.push({
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    success: true,
    timestamp: new Date(),
    location: req.get('CF-IPCountry') || 'Unknown'
  });

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully"
  });
});

// @desc    Setup 2FA
// @route   POST /api/security/2fa/setup
// @access  Private
const setup2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (user.security.twoFactorAuth.enabled) {
    res.status(400);
    throw new Error("2FA is already enabled");
  }

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: user.email,
    service: 'TaskGroove',
    length: 32
  });

  // Generate QR code
  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

  // Save secret (temporary, not enabled yet)
  user.security.twoFactorAuth.secret = secret.base32;
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes: []
    }
  });
});

// @desc    Enable 2FA
// @route   PUT /api/security/2fa/enable
// @access  Private
const enable2FA = asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    res.status(400);
    throw new Error("2FA token is required");
  }

  const user = await User.findById(req.user._id);
  
  if (!user.security.twoFactorAuth.secret) {
    res.status(400);
    throw new Error("2FA setup not initiated");
  }

  // Verify the token
  const verified = speakeasy.totp.verify({
    secret: user.security.twoFactorAuth.secret,
    encoding: 'base32',
    token: token,
    window: 1
  });

  if (!verified) {
    res.status(400);
    throw new Error("Invalid 2FA token");
  }

  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () => 
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );

  // Enable 2FA
  user.security.twoFactorAuth.enabled = true;
  user.security.twoFactorAuth.backupCodes = backupCodes;
  user.security.twoFactorAuth.lastUsed = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    message: "2FA enabled successfully",
    data: {
      backupCodes
    }
  });
});

// @desc    Disable 2FA
// @route   PUT /api/security/2fa/disable
// @access  Private
const disable2FA = asyncHandler(async (req, res) => {
  const { password, token } = req.body;
  
  if (!password) {
    res.status(400);
    throw new Error("Password is required to disable 2FA");
  }

  const user = await User.findById(req.user._id);
  
  // Verify password
  if (!(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Incorrect password");
  }

  // If 2FA is enabled, verify token
  if (user.security.twoFactorAuth.enabled && token) {
    const verified = speakeasy.totp.verify({
      secret: user.security.twoFactorAuth.secret,
      encoding: 'base32',
      token: token,
      window: 1
    });

    if (!verified) {
      res.status(400);
      throw new Error("Invalid 2FA token");
    }
  }

  // Disable 2FA
  user.security.twoFactorAuth = {
    enabled: false,
    secret: null,
    backupCodes: [],
    lastUsed: null
  };
  await user.save();

  res.status(200).json({
    success: true,
    message: "2FA disabled successfully"
  });
});

// @desc    Get active sessions
// @route   GET /api/security/sessions
// @access  Private
const getSessions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  const activeSessions = user.security.sessions.filter(session => session.isActive);

  res.status(200).json({
    success: true,
    data: activeSessions.map(session => ({
      sessionId: session.sessionId,
      deviceInfo: session.deviceInfo,
      createdAt: session.createdAt,
      lastActive: session.lastActive,
      isCurrent: session.sessionId === req.sessionId // Assuming session ID is available in request
    }))
  });
});

// @desc    Revoke session
// @route   DELETE /api/security/sessions/:sessionId
// @access  Private
const revokeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  const user = await User.findById(req.user._id);
  
  const session = user.security.sessions.find(s => s.sessionId === sessionId);
  
  if (!session) {
    res.status(404);
    throw new Error("Session not found");
  }

  // Mark session as inactive
  session.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Session revoked successfully"
  });
});

// @desc    Revoke all sessions except current
// @route   DELETE /api/security/sessions/revoke-all
// @access  Private
const revokeAllSessions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  // Mark all sessions as inactive except current
  user.security.sessions.forEach(session => {
    if (session.sessionId !== req.sessionId) {
      session.isActive = false;
    }
  });
  
  await user.save();

  res.status(200).json({
    success: true,
    message: "All other sessions revoked successfully"
  });
});

// @desc    Get login history
// @route   GET /api/security/login-history
// @access  Private
const getLoginHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  const user = await User.findById(req.user._id);
  
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const loginHistory = user.security.loginAttempts
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(startIndex, endIndex);

  res.status(200).json({
    success: true,
    data: {
      loginHistory,
      pagination: {
        current: page,
        total: Math.ceil(user.security.loginAttempts.length / limit),
        hasNext: endIndex < user.security.loginAttempts.length,
        hasPrev: startIndex > 0
      }
    }
  });
});

// @desc    Request password reset
// @route   POST /api/security/password-reset-request
// @access  Public
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const user = await User.findOne({ email });
  
  if (!user) {
    // Don't reveal that user doesn't exist
    res.status(200).json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent"
    });
    return;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  user.security.passwordReset = {
    token: resetToken,
    expires: resetTokenExpiry,
    used: false
  };
  
  await user.save();

  // Here you would send email with reset link
  // sendPasswordResetEmail(user.email, resetToken);

  res.status(200).json({
    success: true,
    message: "Password reset link sent to your email"
  });
});

// @desc    Reset password with token
// @route   POST /api/security/password-reset
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    res.status(400);
    throw new Error("Token and new password are required");
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const user = await User.findOne({
    'security.passwordReset.token': token,
    'security.passwordReset.expires': { $gt: new Date() },
    'security.passwordReset.used': false
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired reset token");
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  
  // Mark reset token as used
  user.security.passwordReset.used = true;
  
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully"
  });
});

// @desc    Verify email
// @route   POST /api/security/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    res.status(400);
    throw new Error("Verification token is required");
  }

  const user = await User.findOne({
    'security.verification.email.token': token
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid verification token");
  }

  user.security.verification.email.verified = true;
  user.security.verification.email.verifiedAt = new Date();
  user.security.verification.email.token = null;
  
  await user.save();

  res.status(200).json({
    success: true,
    message: "Email verified successfully"
  });
});

module.exports = {
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
};