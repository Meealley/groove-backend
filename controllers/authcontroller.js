const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");
const { generateToken } = require("../utils/generateToken");
const { createDefaultUserData } = require("../utils/userUtil");
const { validateRegistration, validateLogin } = require("../utils/validationUtils");
const { sendWelcomeEmail, sendEmailVerification } = require("../utils/emailUtils");
const speakeasy = require('speakeasy');
const crypto = require('crypto');

// @desc Register a new User
// @access Public
// @route POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  const validation = validateRegistration({ name, email, password });
  if (!validation.isValid) {
    res.status(400);
    throw new Error(Object.values(validation.errors).join(', '));
  }

  // Check if user already exists
  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists with this email");
  }

  // Get default user data structure
  const defaultData = createDefaultUserData();

  // Create user with default data
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    password, // Will be hashed by the pre-save middleware
    ...defaultData,
    // Set initial analytics
    analytics: {
      ...defaultData.analytics,
      metrics: {
        totalTasksCompleted: 0,
        totalTimeTracked: 0,
        streakDays: 0,
        longestStreak: 0,
        joinDate: new Date(),
        lastActiveDate: new Date()
      }
    },
    // Set onboarding info
    onboarding: {
      completed: false,
      currentStep: 0,
      stepsCompleted: [],
      skippedSteps: [],
      source: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'web'
    },
    // Set initial activity
    activity: {
      lastLogin: new Date(),
      lastActiveDate: new Date(),
      loginCount: 1,
      sessionCount: 1,
      featureUsage: {
        tasksCreated: 0,
        schedulesCreated: 0,
        categoriesCreated: 0,
        tagsCreated: 0,
        integrationsConnected: 0
      }
    }
  });

  if (user) {
    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.security.verification.email.token = verificationToken;
    await user.save();

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(user).catch(err => 
      console.error('Failed to send welcome email:', err)
    );

    // Send verification email (async, don't wait)
    sendEmailVerification(user, verificationToken).catch(err => 
      console.error('Failed to send verification email:', err)
    );

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          fullName: user.fullName,
          isEmailVerified: user.security.verification.email.verified,
          onboardingCompleted: user.onboarding.completed,
          subscriptionPlan: user.subscription.plan,
          profileComplete: !!(user.profile.firstName && user.profile.lastName)
        },
        token,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    });
  } else {
    res.status(400);
    throw new Error("Failed to create user account");
  }
});

// @desc Authenticate a User
// @route POST /api/auth/login
// @access Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password, twoFactorToken } = req.body;

  // Validate input
  const validation = validateLogin({ email, password });
  if (!validation.isValid) {
    res.status(400);
    throw new Error(Object.values(validation.errors).join(', '));
  }

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() });

  // Prepare login attempt data
  const loginAttempt = {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    success: false,
    timestamp: new Date(),
    location: req.get('CF-IPCountry') || 'Unknown'
  };

  if (!user) {
    // Log failed attempt (even for non-existent users for security monitoring)
    console.log('Login attempt for non-existent user:', email);
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // Check account status
  if (user.admin.status !== 'active') {
    loginAttempt.success = false;
    user.security.loginAttempts.push(loginAttempt);
    await user.save();
    
    res.status(401);
    throw new Error("Account is suspended or deactivated");
  }

  // Verify password
  const isPasswordValid = await user.matchPassword(password);
  
  if (!isPasswordValid) {
    loginAttempt.success = false;
    user.security.loginAttempts.push(loginAttempt);
    await user.save();
    
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // Check if 2FA is enabled
  if (user.security.twoFactorAuth.enabled) {
    if (!twoFactorToken) {
      res.status(200).json({
        success: true,
        requires2FA: true,
        message: "2FA token required"
      });
      return;
    }

    // Verify 2FA token
    const verified = speakeasy.totp.verify({
      secret: user.security.twoFactorAuth.secret,
      encoding: 'base32',
      token: twoFactorToken,
      window: 1
    });

    if (!verified) {
      loginAttempt.success = false;
      user.security.loginAttempts.push(loginAttempt);
      await user.save();
      
      res.status(401);
      throw new Error("Invalid 2FA token");
    }

    // Update 2FA last used
    user.security.twoFactorAuth.lastUsed = new Date();
  }

  // Successful login - update user activity
  loginAttempt.success = true;
  user.security.loginAttempts.push(loginAttempt);
  
  // Update activity metrics
  user.activity.lastLogin = new Date();
  user.activity.lastActiveDate = new Date();
  user.activity.loginCount += 1;
  user.activity.sessionCount += 1;

  // Create session record
  const sessionId = crypto.randomBytes(32).toString('hex');
  user.security.sessions.push({
    sessionId,
    deviceInfo: {
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      location: req.get('CF-IPCountry') || 'Unknown',
      deviceType: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop'
    },
    createdAt: new Date(),
    lastActive: new Date(),
    isActive: true
  });

  // Clean up old sessions (keep only last 10)
  if (user.security.sessions.length > 10) {
    user.security.sessions = user.security.sessions.slice(-10);
  }

  // Clean up old login attempts (keep only last 50)
  if (user.security.loginAttempts.length > 50) {
    user.security.loginAttempts = user.security.loginAttempts.slice(-50);
  }

  await user.save();

  // Generate JWT token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        fullName: user.fullName,
        avatar: user.profile.avatar,
        isEmailVerified: user.security.verification.email.verified,
        has2FA: user.security.twoFactorAuth.enabled,
        onboardingCompleted: user.onboarding.completed,
        subscriptionPlan: user.subscription.plan,
        subscriptionStatus: user.subscription.status,
        isSubscriptionActive: user.isSubscriptionActive,
        role: user.admin.role,
        permissions: user.team.teams.flatMap(team => team.permissions),
        lastLogin: user.activity.lastLogin,
        streakDays: user.analytics.metrics.streakDays,
        theme: user.settings.interface.theme,
        timezone: user.profile.timezone
      },
      token,
      sessionId,
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // Get fresh user data
  const user = await User.findById(req.user._id)
    .select('-password -security.twoFactorAuth.secret -security.passwordReset');

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Update last active timestamp
  await user.updateLastActive();

  // Calculate some real-time metrics
  const accountAge = Math.floor((new Date() - user.createdAt) / (1000 * 60 * 60 * 24));
  const engagementScore = require("../utils/userUtil").calculateEngagementScore(user);

  res.status(200).json({
    success: true,
    data: {
      user: {
        // Basic info
        _id: user._id,
        name: user.name,
        email: user.email,
        fullName: user.fullName,
        
        // Profile
        profile: user.profile,
        
        // Settings (safe subset)
        settings: {
          interface: user.settings.interface,
          notifications: {
            email: user.settings.notifications.email,
            push: user.settings.notifications.push,
            inApp: user.settings.notifications.inApp,
            doNotDisturb: user.settings.notifications.doNotDisturb
          }
        },
        
        // Work preferences
        workPreferences: user.workPreferences,
        
        // AI preferences
        aiPreferences: user.aiPreferences,
        
        // Subscription info
        subscription: {
          plan: user.subscription.plan,
          status: user.subscription.status,
          isActive: user.isSubscriptionActive,
          limits: user.subscription.limits,
          usage: user.subscription.usage
        },
        
        // Team info
        teams: user.team.teams.length,
        collaboration: user.team.collaboration,
        
        // Security status
        security: {
          emailVerified: user.security.verification.email.verified,
          twoFactorEnabled: user.security.twoFactorAuth.enabled,
          activeSessions: user.security.sessions.filter(s => s.isActive).length
        },
        
        // Analytics
        analytics: user.analytics,
        
        // Activity
        activity: {
          lastLogin: user.activity.lastLogin,
          lastActiveDate: user.activity.lastActiveDate,
          loginCount: user.activity.loginCount,
          isOnline: user.isOnline(),
          accountAge,
          engagementScore
        },
        
        // Onboarding
        onboarding: user.onboarding,
        
        // Admin (if applicable)
        ...(user.admin.role !== 'user' && { admin: { role: user.admin.role, status: user.admin.status } })
      }
    }
  });
});

// @desc    Refresh authentication token
// @route   POST /api/auth/refresh
// @access  Private
const refreshToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user || user.admin.status !== 'active') {
    res.status(401);
    throw new Error("Invalid user or account deactivated");
  }

  // Update last active
  await user.updateLastActive();

  // Generate new token
  const token = generateToken(user._id);

  res.json({
    success: true,
    data: {
      token,
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  });
});

// @desc    Logout user (invalidate session)
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  // Handle case where req.body might be undefined
  const { sessionId } = req.body || {};
  
  try {
    if (sessionId) {
      const user = await User.findById(req.user._id);
      
      if (user) {
        // Find and deactivate the specific session
        const session = user.security.sessions.find(s => s.sessionId === sessionId && s.isActive);
        if (session) {
          session.isActive = false;
          await user.save();
          
          res.json({
            success: true,
            message: "Session logged out successfully",
            data: {
              sessionId,
              loggedOut: true
            }
          });
          return;
        }
      }
    }
    
    // If no sessionId provided or session not found, still return success
    // This handles cases where the client doesn't send sessionId
    res.json({
      success: true,
      message: "Logged out successfully",
      data: {
        loggedOut: true,
        note: sessionId ? "Session not found but logout confirmed" : "Logout without specific session"
      }
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if there's an error, we should still return success for logout
    // since the token will be discarded on the client side anyway
    res.json({
      success: true,
      message: "Logged out successfully",
      data: {
        loggedOut: true,
        note: "Logout completed with minor issues"
      }
    });
  }
});

// @desc    Verify email address
// @route   GET /api/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    // Return HTML error page for better UX
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
          .error { color: #d32f2f; }
          .success { color: #2e7d32; }
        </style>
      </head>
      <body>
        <h2>Email Verification</h2>
        <div class="error">
          <p>❌ Verification token is missing</p>
          <p>Please use the complete link from your email.</p>
        </div>
      </body>
      </html>
    `);
  }

  try {
    // Find user with this verification token
    const user = await User.findOne({
      'security.verification.email.token': token,
      'security.verification.email.verified': false
    });

    if (!user) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Verification</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { color: #d32f2f; }
          </style>
        </head>
        <body>
          <h2>Email Verification</h2>
          <div class="error">
            <p>❌ Invalid or expired verification token</p>
            <p>The verification link may have expired or already been used.</p>
            <p>Please request a new verification email from the app.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Verify the email
    user.security.verification.email.verified = true;
    user.security.verification.email.verifiedAt = new Date();
    user.security.verification.email.token = null; // Clear the token
    
    await user.save();

    // Return success HTML page
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
          .success { color: #2e7d32; }
          .info { color: #1976d2; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h2>Email Verification</h2>
        <div class="success">
          <p>✅ Email verified successfully!</p>
          <p>Your email <strong>${user.email}</strong> has been verified.</p>
        </div>
        <div class="info">
          <p>You can now return to the app and enjoy all features.</p>
          <p><small>Verified at: ${user.security.verification.email.verifiedAt}</small></p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
          .error { color: #d32f2f; }
        </style>
      </head>
      <body>
        <h2>Email Verification</h2>
        <div class="error">
          <p>❌ Something went wrong</p>
          <p>Please try again or contact support.</p>
        </div>
      </body>
      </html>
    `);
  }
});

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Private
const resendEmailVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (user.security.verification.email.verified) {
    res.status(400);
    throw new Error("Email is already verified");
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.security.verification.email.token = verificationToken;
  await user.save();

  // Send verification email
  try {
    await sendEmailVerification(user, verificationToken);
    res.json({
      success: true,
      message: "Verification email sent successfully"
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    res.status(500);
    throw new Error("Failed to send verification email");
  }
});

// @desc    Verify email address (JSON response for mobile)
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmailAPI = asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    res.status(400);
    throw new Error("Verification token is required");
  }

  // Find user with this verification token
  const user = await User.findOne({
    'security.verification.email.token': token,
    'security.verification.email.verified': false
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired verification token");
  }

  // Verify the email
  user.security.verification.email.verified = true;
  user.security.verification.email.verifiedAt = new Date();
  user.security.verification.email.token = null; // Clear the token
  
  await user.save();

  res.json({
    success: true,
    message: "Email verified successfully! You can now access all features.",
    data: {
      emailVerified: true,
      verifiedAt: user.security.verification.email.verifiedAt
    }
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  refreshToken,
  logoutUser,
  verifyEmail,
  verifyEmailAPI,
  resendEmailVerification,
};