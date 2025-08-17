const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");
const { generateToken } = require("../utils/generateToken");
const { createDefaultUserData } = require("../utils/userUtil");
const { sendWelcomeEmail } = require("../utils/emailUtils");
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Google OAuth authentication
// @route   POST /api/auth/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
  const { idToken, accessToken } = req.body;

  if (!idToken) {
    res.status(400);
    throw new Error("Google ID token is required");
  }

  try {
    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const {
      sub: googleId,
      email,
      name,
      given_name: firstName,
      family_name: lastName,
      picture: avatarUrl,
      email_verified: emailVerified
    } = payload;

    if (!email) {
      res.status(400);
      throw new Error("Email not provided by Google");
    }

    // Check if user already exists
    let user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { 'integrations.connectedServices.service': 'google', 'integrations.connectedServices.serviceId': googleId }
      ]
    });

    if (user) {
      // Update existing user's Google connection if not already connected
      const googleConnection = user.integrations.connectedServices.find(
        service => service.service === 'google'
      );

      if (!googleConnection) {
        user.integrations.connectedServices.push({
          service: 'google',
          serviceId: googleId,
          connectedAt: new Date(),
          lastSync: new Date(),
          status: 'active'
        });
      } else {
        googleConnection.lastSync = new Date();
        googleConnection.status = 'active';
      }

      // Update profile info if missing
      if (!user.profile.avatar && avatarUrl) {
        user.profile.avatar = avatarUrl;
      }
      if (!user.profile.firstName && firstName) {
        user.profile.firstName = firstName;
      }
      if (!user.profile.lastName && lastName) {
        user.profile.lastName = lastName;
      }

      // Mark email as verified if Google says it's verified
      if (emailVerified && !user.security.verification.email.verified) {
        user.security.verification.email.verified = true;
        user.security.verification.email.verifiedAt = new Date();
      }

      // Update activity
      user.activity.lastLogin = new Date();
      user.activity.lastActiveDate = new Date();
      user.activity.loginCount += 1;

      await user.save();
    } else {
      // Create new user
      const defaultData = createDefaultUserData();
      
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: crypto.randomBytes(32).toString('hex'), // Random password since they'll use OAuth
        ...defaultData,
        
        // Profile information from Google
        profile: {
          ...defaultData.profile,
          firstName: firstName || '',
          lastName: lastName || '',
          avatar: avatarUrl || '',
        },

        // Mark email as verified if Google verified it
        security: {
          ...defaultData.security,
          verification: {
            ...defaultData.security.verification,
            email: {
              verified: emailVerified || false,
              verifiedAt: emailVerified ? new Date() : null,
              token: null
            }
          }
        },

        // Add Google connection
        integrations: {
          ...defaultData.integrations,
          connectedServices: [{
            service: 'google',
            serviceId: googleId,
            connectedAt: new Date(),
            lastSync: new Date(),
            status: 'active'
          }]
        },

        // Onboarding info
        onboarding: {
          completed: false,
          currentStep: 0,
          stepsCompleted: [],
          source: 'google-oauth'
        },

        // Activity tracking
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
            integrationsConnected: 1 // Google integration
          }
        },

        // Analytics
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
        }
      });

      // Send welcome email (async)
      if (user.security.verification.email.verified) {
        sendWelcomeEmail(user).catch(err => 
          console.error('Failed to send welcome email:', err)
        );
      }
    }

    // Create session
    const sessionId = crypto.randomBytes(32).toString('hex');
    user.security.sessions.push({
      sessionId,
      deviceInfo: {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        location: req.get('CF-IPCountry') || 'Unknown',
        deviceType: 'mobile'
      },
      createdAt: new Date(),
      lastActive: new Date(),
      isActive: true
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: user.integrations.connectedServices.length > 1 ? "Login successful" : "Account created successfully",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          fullName: user.fullName,
          avatar: user.profile.avatar,
          isEmailVerified: user.security.verification.email.verified,
          onboardingCompleted: user.onboarding.completed,
          subscriptionPlan: user.subscription.plan,
          subscriptionStatus: user.subscription.status,
          isNewUser: user.activity.loginCount === 1,
          authProvider: 'google'
        },
        token,
        sessionId,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(401);
    throw new Error("Invalid Google token");
  }
});

// @desc    Apple OAuth authentication
// @route   POST /api/auth/apple
// @access  Public
const appleAuth = asyncHandler(async (req, res) => {
  const { identityToken, authorizationCode, user: appleUser } = req.body;

  if (!identityToken) {
    res.status(400);
    throw new Error("Apple identity token is required");
  }

  try {
    // Verify Apple identity token
    const appleSignin = require('apple-signin-auth');
    
    const appleIdTokenData = await appleSignin.verifyIdToken(identityToken, {
      audience: process.env.APPLE_CLIENT_ID || process.env.APPLE_BUNDLE_ID,
      ignoreExpiration: false,
    });

    const {
      sub: appleId,
      email,
      email_verified: emailVerified
    } = appleIdTokenData;

    // Apple might not always provide email (only on first sign in)
    let userEmail = email;
    let firstName = '';
    let lastName = '';
    let fullName = '';

    // If Apple user data is provided (first sign in)
    if (appleUser) {
      if (appleUser.name) {
        firstName = appleUser.name.firstName || '';
        lastName = appleUser.name.lastName || '';
        fullName = `${firstName} ${lastName}`.trim();
      }
      if (appleUser.email) {
        userEmail = appleUser.email;
      }
    }

    if (!userEmail && !appleId) {
      res.status(400);
      throw new Error("Unable to get user information from Apple");
    }

    // Check if user exists
    let user = await User.findOne({
      $or: [
        ...(userEmail ? [{ email: userEmail.toLowerCase() }] : []),
        { 'integrations.connectedServices.service': 'apple', 'integrations.connectedServices.serviceId': appleId }
      ]
    });

    if (user) {
      // Update existing user's Apple connection
      const appleConnection = user.integrations.connectedServices.find(
        service => service.service === 'apple'
      );

      if (!appleConnection) {
        user.integrations.connectedServices.push({
          service: 'apple',
          serviceId: appleId,
          connectedAt: new Date(),
          lastSync: new Date(),
          status: 'active'
        });
      } else {
        appleConnection.lastSync = new Date();
        appleConnection.status = 'active';
      }

      // Update profile if we have new info
      if (firstName && !user.profile.firstName) {
        user.profile.firstName = firstName;
      }
      if (lastName && !user.profile.lastName) {
        user.profile.lastName = lastName;
      }

      // Update email if missing
      if (userEmail && !user.email) {
        user.email = userEmail.toLowerCase();
      }

      // Mark email as verified if Apple says it's verified
      if (emailVerified && !user.security.verification.email.verified) {
        user.security.verification.email.verified = true;
        user.security.verification.email.verifiedAt = new Date();
      }

      // Update activity
      user.activity.lastLogin = new Date();
      user.activity.lastActiveDate = new Date();
      user.activity.loginCount += 1;

      await user.save();
    } else {
      // Create new user
      if (!userEmail) {
        // If no email provided, create a placeholder email
        userEmail = `apple_${appleId}@privaterelay.appleid.com`;
      }

      const defaultData = createDefaultUserData();
      
      user = await User.create({
        name: fullName || userEmail.split('@')[0],
        email: userEmail.toLowerCase(),
        password: crypto.randomBytes(32).toString('hex'), // Random password
        ...defaultData,
        
        // Profile information from Apple
        profile: {
          ...defaultData.profile,
          firstName: firstName || '',
          lastName: lastName || '',
        },

        // Mark email as verified if Apple verified it
        security: {
          ...defaultData.security,
          verification: {
            ...defaultData.security.verification,
            email: {
              verified: emailVerified || false,
              verifiedAt: emailVerified ? new Date() : null,
              token: null
            }
          }
        },

        // Add Apple connection
        integrations: {
          ...defaultData.integrations,
          connectedServices: [{
            service: 'apple',
            serviceId: appleId,
            connectedAt: new Date(),
            lastSync: new Date(),
            status: 'active'
          }]
        },

        // Onboarding info
        onboarding: {
          completed: false,
          currentStep: 0,
          stepsCompleted: [],
          source: 'apple-oauth'
        },

        // Activity tracking
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
            integrationsConnected: 1 // Apple integration
          }
        },

        // Analytics
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
        }
      });

      // Send welcome email if we have a verified email
      if (user.security.verification.email.verified && !userEmail.includes('privaterelay.appleid.com')) {
        sendWelcomeEmail(user).catch(err => 
          console.error('Failed to send welcome email:', err)
        );
      }
    }

    // Create session
    const sessionId = crypto.randomBytes(32).toString('hex');
    user.security.sessions.push({
      sessionId,
      deviceInfo: {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        location: req.get('CF-IPCountry') || 'Unknown',
        deviceType: 'mobile'
      },
      createdAt: new Date(),
      lastActive: new Date(),
      isActive: true
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: user.integrations.connectedServices.length > 1 ? "Login successful" : "Account created successfully",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          fullName: user.fullName,
          avatar: user.profile.avatar,
          isEmailVerified: user.security.verification.email.verified,
          onboardingCompleted: user.onboarding.completed,
          subscriptionPlan: user.subscription.plan,
          subscriptionStatus: user.subscription.status,
          isNewUser: user.activity.loginCount === 1,
          authProvider: 'apple'
        },
        token,
        sessionId,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    });

  } catch (error) {
    console.error('Apple OAuth error:', error);
    res.status(401);
    throw new Error("Invalid Apple token");
  }
});

// @desc    Link OAuth account to existing user
// @route   POST /api/auth/link-oauth
// @access  Private
const linkOAuthAccount = asyncHandler(async (req, res) => {
  const { provider, idToken } = req.body;
  
  if (!provider || !idToken) {
    res.status(400);
    throw new Error("Provider and ID token are required");
  }

  const user = await User.findById(req.user._id);
  
  try {
    let serviceId;
    let userInfo = {};

    if (provider === 'google') {
      const ticket = await googleClient.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      serviceId = payload.sub;
      userInfo = {
        email: payload.email,
        name: payload.name,
        avatar: payload.picture
      };
    } else if (provider === 'apple') {
      const appleSignin = require('apple-signin-auth');
      const appleIdTokenData = await appleSignin.verifyIdToken(idToken, {
        audience: process.env.APPLE_CLIENT_ID || process.env.APPLE_BUNDLE_ID,
      });
      serviceId = appleIdTokenData.sub;
      userInfo = {
        email: appleIdTokenData.email
      };
    } else {
      res.status(400);
      throw new Error("Unsupported OAuth provider");
    }

    // Check if this OAuth account is already linked to another user
    const existingUser = await User.findOne({
      'integrations.connectedServices.service': provider,
      'integrations.connectedServices.serviceId': serviceId,
      _id: { $ne: user._id }
    });

    if (existingUser) {
      res.status(400);
      throw new Error(`This ${provider} account is already linked to another user`);
    }

    // Check if already linked to current user
    const existingConnection = user.integrations.connectedServices.find(
      service => service.service === provider
    );

    if (existingConnection) {
      res.status(400);
      throw new Error(`${provider} account is already linked to your account`);
    }

    // Add the connection
    user.integrations.connectedServices.push({
      service: provider,
      serviceId: serviceId,
      connectedAt: new Date(),
      lastSync: new Date(),
      status: 'active'
    });

    // Update profile if missing info
    if (userInfo.avatar && !user.profile.avatar) {
      user.profile.avatar = userInfo.avatar;
    }

    await user.save();

    res.json({
      success: true,
      message: `${provider} account linked successfully`,
      data: {
        connectedServices: user.integrations.connectedServices.length,
        linkedProvider: provider
      }
    });

  } catch (error) {
    console.error(`${provider} OAuth linking error:`, error);
    res.status(401);
    throw new Error(`Failed to link ${provider} account`);
  }
});

// @desc    Unlink OAuth account
// @route   DELETE /api/auth/unlink-oauth/:provider
// @access  Private
const unlinkOAuthAccount = asyncHandler(async (req, res) => {
  const { provider } = req.params;
  
  const user = await User.findById(req.user._id);
  
  const connectionIndex = user.integrations.connectedServices.findIndex(
    service => service.service === provider
  );

  if (connectionIndex === -1) {
    res.status(404);
    throw new Error(`${provider} account is not linked`);
  }

  // Check if user has password or other OAuth methods
  const hasPassword = user.password && user.password.length > 60; // bcrypt hashes are typically 60 chars
  const hasOtherOAuth = user.integrations.connectedServices.length > 1;

  if (!hasPassword && !hasOtherOAuth) {
    res.status(400);
    throw new Error("Cannot unlink last authentication method. Please set a password first.");
  }

  // Remove the connection
  user.integrations.connectedServices.splice(connectionIndex, 1);
  await user.save();

  res.json({
    success: true,
    message: `${provider} account unlinked successfully`
  });
});

module.exports = {
  googleAuth,
  appleAuth,
  linkOAuthAccount,
  unlinkOAuthAccount,
};