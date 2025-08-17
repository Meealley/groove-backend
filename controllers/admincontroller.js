const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");
const { calculateEngagementScore } = require("../utils/userUtil");

// @desc    Get all users with pagination and filtering
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status = 'all',
    plan = 'all',
    role = 'all',
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter query
  const filter = {};
  
  if (status !== 'all') {
    filter['admin.status'] = status;
  }
  
  if (plan !== 'all') {
    filter['subscription.plan'] = plan;
  }
  
  if (role !== 'all') {
    filter['admin.role'] = role;
  }
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { 'profile.company': { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query
  const users = await User.find(filter)
    .select('-password -security.twoFactorAuth.secret -security.passwordReset')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const totalUsers = await User.countDocuments(filter);
  const totalPages = Math.ceil(totalUsers / parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        limit: parseInt(limit),
        totalUsers,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  });
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:userId
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const user = await User.findById(userId)
    .select('-password -security.twoFactorAuth.secret -security.passwordReset');
  
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user status
// @route   PUT /api/admin/users/:userId/status
// @access  Private/Admin
const updateUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, reason } = req.body;
  
  const validStatuses = ['active', 'suspended', 'banned', 'deleted'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error("Invalid status");
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Prevent self-modification for sensitive actions
  if (req.user._id.toString() === userId && ['suspended', 'banned', 'deleted'].includes(status)) {
    res.status(400);
    throw new Error("Cannot perform this action on yourself");
  }

  user.admin.status = status;
  user.admin.lastModifiedBy = req.user._id;
  
  if (reason) {
    user.admin.notes = (user.admin.notes || '') + `\n[${new Date().toISOString()}] Status changed to ${status}: ${reason}`;
  }
  
  await user.save();

  res.status(200).json({
    success: true,
    message: `User status updated to ${status}`,
    data: {
      userId: user._id,
      status: user.admin.status
    }
  });
});

// @desc    Update user role
// @route   PUT /api/admin/users/:userId/role
// @access  Private/SuperAdmin
const updateUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  
  const validRoles = ['user', 'moderator', 'admin', 'super_admin'];
  if (!validRoles.includes(role)) {
    res.status(400);
    throw new Error("Invalid role");
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Prevent self-demotion from super_admin
  if (req.user._id.toString() === userId && req.user.admin.role === 'super_admin' && role !== 'super_admin') {
    res.status(400);
    throw new Error("Cannot demote yourself from super admin");
  }

  user.admin.role = role;
  user.admin.lastModifiedBy = req.user._id;
  user.admin.notes = (user.admin.notes || '') + `\n[${new Date().toISOString()}] Role changed to ${role} by ${req.user.email}`;
  
  await user.save();

  res.status(200).json({
    success: true,
    message: `User role updated to ${role}`,
    data: {
      userId: user._id,
      role: user.admin.role
    }
  });
});

// @desc    Add admin note to user
// @route   POST /api/admin/users/:userId/notes
// @access  Private/Admin
const addUserNote = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { note } = req.body;
  
  if (!note || note.trim().length === 0) {
    res.status(400);
    throw new Error("Note content is required");
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const timestamp = new Date().toISOString();
  const adminNote = `\n[${timestamp}] ${req.user.email}: ${note.trim()}`;
  
  user.admin.notes = (user.admin.notes || '') + adminNote;
  user.admin.lastModifiedBy = req.user._id;
  
  await user.save();

  res.status(200).json({
    success: true,
    message: "Note added successfully",
    data: {
      userId: user._id,
      noteAdded: adminNote
    }
  });
});

// @desc    Get user analytics for admin
// @route   GET /api/admin/users/:userId/analytics
// @access  Private/Admin
const getUserAnalytics = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const engagementScore = calculateEngagementScore(user);
  const accountAge = Math.floor((new Date() - user.createdAt) / (1000 * 60 * 60 * 24));
  
  const analytics = {
    basic: {
      accountAge,
      engagementScore,
      isOnline: user.isOnline(),
      lastActive: user.activity.lastActiveDate,
      loginCount: user.activity.loginCount,
      sessionCount: user.activity.sessionCount
    },
    metrics: user.analytics.metrics,
    subscription: {
      plan: user.subscription.plan,
      status: user.subscription.status,
      usage: user.subscription.usage,
      limits: user.subscription.limits
    },
    security: {
      twoFactorEnabled: user.security.twoFactorAuth.enabled,
      emailVerified: user.security.verification.email.verified,
      recentLoginAttempts: user.security.loginAttempts
        .filter(attempt => attempt.timestamp > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .length,
      activeSessions: user.security.sessions.filter(session => session.isActive).length
    },
    featureUsage: user.activity.featureUsage
  };

  res.status(200).json({
    success: true,
    data: analytics
  });
});

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getSystemStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // User statistics
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ 'admin.status': 'active' });
  const newUsersThisMonth = await User.countDocuments({ 
    createdAt: { $gte: thirtyDaysAgo },
    'admin.status': 'active'
  });
  const recentlyActiveUsers = await User.countDocuments({
    'activity.lastActiveDate': { $gte: sevenDaysAgo },
    'admin.status': 'active'
  });

  // Subscription statistics
  const subscriptionStats = await User.aggregate([
    { $match: { 'admin.status': 'active' } },
    { $group: { _id: '$subscription.plan', count: { $sum: 1 } } }
  ]);

  // Admin statistics
  const adminUsers = await User.countDocuments({ 
    'admin.role': { $in: ['admin', 'super_admin'] },
    'admin.status': 'active'
  });

  // Security statistics
  const users2FAEnabled = await User.countDocuments({ 
    'security.twoFactorAuth.enabled': true,
    'admin.status': 'active'
  });
  const verifiedEmails = await User.countDocuments({ 
    'security.verification.email.verified': true,
    'admin.status': 'active'
  });

  res.status(200).json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
        recentlyActive: recentlyActiveUsers,
        admins: adminUsers
      },
      subscriptions: subscriptionStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      security: {
        twoFactorEnabled: users2FAEnabled,
        emailVerified: verifiedEmails,
        twoFactorPercentage: Math.round((users2FAEnabled / activeUsers) * 100),
        verificationPercentage: Math.round((verifiedEmails / activeUsers) * 100)
      }
    }
  });
});

// @desc    Bulk update users
// @route   PUT /api/admin/users/bulk-update
// @access  Private/SuperAdmin
const bulkUpdateUsers = asyncHandler(async (req, res) => {
  const { userIds, updates } = req.body;
  
  if (!Array.isArray(userIds) || userIds.length === 0) {
    res.status(400);
    throw new Error("User IDs array is required");
  }

  if (!updates || Object.keys(updates).length === 0) {
    res.status(400);
    throw new Error("Updates object is required");
  }

  // Prevent bulk changes to super admin role
  if (updates['admin.role'] === 'super_admin') {
    res.status(403);
    throw new Error("Cannot bulk assign super admin role");
  }

  // Add audit trail
  updates['admin.lastModifiedBy'] = req.user._id;
  updates.updatedAt = new Date();

  const result = await User.updateMany(
    { 
      _id: { $in: userIds },
      _id: { $ne: req.user._id } // Prevent self-modification
    },
    { $set: updates }
  );

  res.status(200).json({
    success: true,
    message: `Updated ${result.modifiedCount} users`,
    data: {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    }
  });
});

// @desc    Export user data
// @route   GET /api/admin/users/export
// @access  Private/Admin
const exportUserData = asyncHandler(async (req, res) => {
  const { format = 'json', fields = 'basic' } = req.query;
  
  let selectFields = '';
  
  if (fields === 'basic') {
    selectFields = '_id name email createdAt admin.status subscription.plan activity.lastActiveDate';
  } else if (fields === 'detailed') {
    selectFields = '-password -security.twoFactorAuth.secret -security.passwordReset';
  }

  const users = await User.find({ 'admin.status': { $ne: 'deleted' } })
    .select(selectFields)
    .lean();

  if (format === 'csv') {
    // Convert to CSV format
    const csv = convertToCSV(users);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csv);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=users.json');
    res.json({
      success: true,
      exportDate: new Date().toISOString(),
      totalRecords: users.length,
      data: users
    });
  }
});

// Helper function to convert to CSV
const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  addUserNote,
  getUserAnalytics,
  getSystemStats,
  bulkUpdateUsers,
  exportUserData
};