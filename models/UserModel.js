const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic user information
  name: {
    type: String,
    required: [true, "Please add a name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
      "Please enter a valid email",
    ],
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: 6,
  },
  
  // Enhanced profile information
  profile: {
    firstName: String,
    lastName: String,
    avatar: String, // URL to profile image
    bio: String,
    title: String, // Job title
    company: String,
    department: String,
    timezone: {
      type: String,
      default: "UTC",
    },
    language: {
      type: String,
      default: "en",
    },
    country: String,
    city: String,
    dateOfBirth: Date,
    phone: String,
  },

  // Work preferences and settings
  workPreferences: {
    // Working hours
    workingHours: {
      monday: { start: String, end: String, enabled: Boolean },
      tuesday: { start: String, end: String, enabled: Boolean },
      wednesday: { start: String, end: String, enabled: Boolean },
      thursday: { start: String, end: String, enabled: Boolean },
      friday: { start: String, end: String, enabled: Boolean },
      saturday: { start: String, end: String, enabled: Boolean },
      sunday: { start: String, end: String, enabled: Boolean },
    },
    
    // Break preferences
    breaks: {
      shortBreakDuration: { type: Number, default: 15 }, // minutes
      longBreakDuration: { type: Number, default: 60 },
      shortBreakFrequency: { type: Number, default: 120 }, // every 2 hours
      lunchBreakTime: String, // "12:00"
      lunchBreakDuration: { type: Number, default: 60 },
    },
    
    // Focus preferences
    focus: {
      deepWorkBlockDuration: { type: Number, default: 90 }, // minutes
      allowInterruptions: { type: Boolean, default: false },
      notificationsDuringFocus: { type: Boolean, default: false },
      focusMusic: String, // Spotify playlist ID or similar
    },
    
    // Task preferences
    tasks: {
      defaultPriority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium",
      },
      defaultEstimationBuffer: { type: Number, default: 20 }, // percentage
      maxDailyTasks: { type: Number, default: 10 },
      preferredTaskDuration: { type: Number, default: 60 }, // minutes
      autoSchedule: { type: Boolean, default: true },
    },
  },

  // App settings and preferences
  settings: {
    // Notification preferences
    notifications: {
      email: {
        taskReminders: { type: Boolean, default: true },
        deadlineWarnings: { type: Boolean, default: true },
        weeklyReports: { type: Boolean, default: true },
        teamUpdates: { type: Boolean, default: true },
        systemUpdates: { type: Boolean, default: false },
      },
      push: {
        taskReminders: { type: Boolean, default: true },
        deadlineWarnings: { type: Boolean, default: true },
        smartSuggestions: { type: Boolean, default: true },
        locationReminders: { type: Boolean, default: false },
      },
      inApp: {
        taskUpdates: { type: Boolean, default: true },
        achievements: { type: Boolean, default: true },
        tips: { type: Boolean, default: true },
      },
      // Do not disturb settings
      doNotDisturb: {
        enabled: { type: Boolean, default: false },
        start: String, // "22:00"
        end: String,   // "08:00"
        weekendsOnly: { type: Boolean, default: false },
      },
    },
    
    // Privacy settings
    privacy: {
      shareAnalytics: { type: Boolean, default: true },
      shareUsageData: { type: Boolean, default: true },
      allowAILearning: { type: Boolean, default: true },
      dataRetention: {
        type: String,
        enum: ["1year", "2years", "5years", "forever"],
        default: "2years",
      },
    },
    
    // UI/UX preferences
    interface: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "light",
      },
      density: {
        type: String,
        enum: ["compact", "comfortable", "spacious"],
        default: "comfortable",
      },
      primaryColor: {
        type: String,
        default: "#007bff",
      },
      showCompletedTasks: { type: Boolean, default: false },
      defaultView: {
        type: String,
        enum: ["list", "board", "calendar", "timeline"],
        default: "list",
      },
      sidebarCollapsed: { type: Boolean, default: false },
    },
    
    // Advanced settings
    advanced: {
      enableBetaFeatures: { type: Boolean, default: false },
      debugMode: { type: Boolean, default: false },
      autoBackup: { type: Boolean, default: true },
      offlineMode: { type: Boolean, default: true },
      analyticsLevel: {
        type: String,
        enum: ["basic", "detailed", "comprehensive"],
        default: "detailed",
      },
    },
  },

  // Subscription and billing
  subscription: {
    plan: {
      type: String,
      enum: ["free", "pro", "team", "enterprise"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "canceled", "past_due", "trialing"],
      default: "active",
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    customerId: String, // Stripe customer ID
    subscriptionId: String, // Stripe subscription ID
    trialEndsAt: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    
    // Usage limits and tracking
    limits: {
      tasks: { type: Number, default: 1000 },
      projects: { type: Number, default: 10 },
      teamMembers: { type: Number, default: 1 },
      storage: { type: Number, default: 1024 }, // MB
      integrations: { type: Number, default: 3 },
      aiSuggestions: { type: Number, default: 100 }, // per month
    },
    
    usage: {
      tasks: { type: Number, default: 0 },
      projects: { type: Number, default: 0 },
      storage: { type: Number, default: 0 },
      aiSuggestionsUsed: { type: Number, default: 0 },
      lastResetDate: Date,
    },
  },

  // Team and collaboration
  team: {
    // Team membership
    teams: [{
      teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
      role: {
        type: String,
        enum: ["owner", "admin", "member", "viewer"],
        default: "member",
      },
      joinedAt: Date,
      permissions: [String],
    }],
    
    // Collaboration preferences
    collaboration: {
      shareProgressUpdates: { type: Boolean, default: true },
      allowTaskAssignment: { type: Boolean, default: true },
      showAvailability: { type: Boolean, default: true },
      defaultShareLevel: {
        type: String,
        enum: ["private", "team", "organization"],
        default: "private",
      },
    },
  },

  // Security and authentication
  security: {
    // Two-factor authentication
    twoFactorAuth: {
      enabled: { type: Boolean, default: false },
      secret: String, // TOTP secret
      backupCodes: [String],
      lastUsed: Date,
    },
    
    // Login sessions
    sessions: [{
      sessionId: String,
      deviceInfo: {
        userAgent: String,
        ip: String,
        location: String,
        deviceType: String,
      },
      createdAt: Date,
      lastActive: Date,
      isActive: { type: Boolean, default: true },
    }],
    
    // Security logs
    loginAttempts: [{
      ip: String,
      userAgent: String,
      success: Boolean,
      timestamp: Date,
      location: String,
    }],
    
    // Password reset
    passwordReset: {
      token: String,
      expires: Date,
      used: { type: Boolean, default: false },
    },
    
    // Account verification
    verification: {
      email: {
        verified: { type: Boolean, default: false },
        token: String,
        verifiedAt: Date,
      },
      phone: {
        verified: { type: Boolean, default: false },
        token: String,
        verifiedAt: Date,
      },
    },
  },

  // AI and personalization
  aiPreferences: {
    // AI assistance level
    assistanceLevel: {
      type: String,
      enum: ["minimal", "moderate", "aggressive", "custom"],
      default: "moderate",
    },
    
    // Feature-specific AI settings
    features: {
      smartScheduling: { type: Boolean, default: true },
      taskSuggestions: { type: Boolean, default: true },
      priorityRecommendations: { type: Boolean, default: true },
      timeEstimation: { type: Boolean, default: true },
      productivityInsights: { type: Boolean, default: true },
      habitTracking: { type: Boolean, default: true },
      goalRecommendations: { type: Boolean, default: true },
    },
    
    // Learning preferences
    learning: {
      adaptToPatterns: { type: Boolean, default: true },
      shareDataForImprovement: { type: Boolean, default: true },
      feedbackFrequency: {
        type: String,
        enum: ["never", "weekly", "monthly"],
        default: "monthly",
      },
    },
  },

  // Integrations and connected services
  integrations: {
    connectedServices: [{
      service: String,
      serviceId: String,
      connectedAt: Date,
      lastSync: Date,
      status: {
        type: String,
        enum: ["active", "error", "disconnected"],
        default: "active",
      },
    }],
    
    // API access
    apiAccess: {
      enabled: { type: Boolean, default: false },
      keys: [{
        name: String,
        key: String, // Hashed
        permissions: [String],
        createdAt: Date,
        lastUsed: Date,
        active: { type: Boolean, default: true },
      }],
    },
    
    // Webhooks
    webhooks: [{
      url: String,
      events: [String],
      secret: String,
      active: { type: Boolean, default: true },
      createdAt: Date,
      lastTriggered: Date,
    }],
  },

  // Analytics and insights
  analytics: {
    // Basic metrics
    metrics: {
      totalTasksCompleted: { type: Number, default: 0 },
      totalTimeTracked: { type: Number, default: 0 }, // minutes
      streakDays: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      joinDate: Date,
      lastActiveDate: Date,
    },
    
    // Achievements and badges
    achievements: [{
      type: String,
      name: String,
      description: String,
      unlockedAt: Date,
      level: Number,
    }],
    
    // Goals and targets
    goals: {
      dailyTaskTarget: { type: Number, default: 5 },
      weeklyHoursTarget: { type: Number, default: 40 },
      monthlyProjectsTarget: { type: Number, default: 2 },
    },
  },

  // Administrative fields
  admin: {
    role: {
      type: String,
      enum: ["user", "moderator", "admin", "super_admin"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "suspended", "banned", "deleted"],
      default: "active",
    },
    notes: String, // Admin notes
    flags: [String], // Admin flags
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },

  // Onboarding and help
  onboarding: {
    completed: { type: Boolean, default: false },
    currentStep: { type: Number, default: 0 },
    stepsCompleted: [String],
    skippedSteps: [String],
    completedAt: Date,
    
    // User source and referral
    source: String, // "google", "referral", "direct", etc.
    referralCode: String,
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },

  // Activity tracking
  activity: {
    lastLogin: Date,
    lastActiveDate: Date,
    loginCount: { type: Number, default: 0 },
    sessionCount: { type: Number, default: 0 },
    
    // Feature usage
    featureUsage: {
      tasksCreated: { type: Number, default: 0 },
      schedulesCreated: { type: Number, default: 0 },
      categoriesCreated: { type: Number, default: 0 },
      tagsCreated: { type: Number, default: 0 },
      integrationsConnected: { type: Number, default: 0 },
    },
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
// userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ "profile.company": 1 });
userSchema.index({ "subscription.plan": 1 });
userSchema.index({ "admin.status": 1 });
userSchema.index({ "activity.lastActiveDate": -1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it's been modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Match password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token (you'll need to implement this based on your JWT setup)
userSchema.methods.generateAuthToken = function () {
  // Implementation depends on your JWT setup
  // const jwt = require('jsonwebtoken');
  // return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Check if user has permission
userSchema.methods.hasPermission = function (permission) {
  if (this.admin.role === 'super_admin') return true;
  if (this.admin.role === 'admin' && !permission.includes('super_admin')) return true;
  
  // Check team permissions
  for (const team of this.team.teams) {
    if (team.permissions.includes(permission)) return true;
  }
  
  return false;
};

// Check subscription limits
userSchema.methods.checkLimit = function (resource) {
  const limit = this.subscription.limits[resource];
  const usage = this.subscription.usage[resource];
  
  if (!limit) return true; // No limit set
  return usage < limit;
};

// Increment usage counter
userSchema.methods.incrementUsage = async function (resource, amount = 1) {
  if (!this.subscription.usage[resource]) {
    this.subscription.usage[resource] = 0;
  }
  
  this.subscription.usage[resource] += amount;
  return this.save();
};

// Reset monthly usage counters
userSchema.methods.resetMonthlyUsage = async function () {
  this.subscription.usage.aiSuggestionsUsed = 0;
  this.subscription.usage.lastResetDate = new Date();
  return this.save();
};

// Get user's productivity score
// userSchema.methods.getProductivityScore = async function (days = 7) {
//   const Analytics = mongoose.model('Analytics');
  
//   const endDate = new Date();
//   const startDate = new Date();
//   startDate.setDate(startDate.getDate() - days);
  
//   const analytics = await Analytics.findOne({
//     user: this._id,
//     'period.startDate': { $gte: startDate },
//     'period.endDate': { $lte: endDate },
//   });
  
//   if (!analytics) return 50; // Default score
  
//   // Calculate weighted productivity score
//   const completionWeight = 0.4;
//   const timeManagementWeight = 0.3;
//   const goalAchievementWeight = 0.3;
  
//   const completionScore = analytics.taskMetrics.completionRate || 0;
//   const timeManagementScore = 100 - (analytics.estimationAccuracy.overall.avgError || 50);
//   const goalScore = analytics.goalMetrics.personal.achievement_rate || 0;
  
//   return Math.round(
//     completionScore * completionWeight +
//     timeManagementScore * timeManagementWeight +
//     goalScore * goalAchievementWeight
//   );
// };

userSchema.methods.getProductivityScore = async function (days = 7) {
  try {
    // Try to get Analytics model safely
    let Analytics;
    try {
      Analytics = mongoose.model('Analytics');
    } catch (error) {
      console.log('Analytics model not registered, calculating manually');
      return await this.calculateProductivityScoreManually(days);
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Try to find analytics record
    const analytics = await Analytics.findOne({
      user: this._id,
      'period.startDate': { $lte: endDate },
      'period.endDate': { $gte: startDate },
    }).sort({ 'period.endDate': -1 });
    
    if (analytics && analytics.taskMetrics) {
      // Calculate weighted productivity score from analytics
      const completionWeight = 0.4;
      const timeManagementWeight = 0.3;
      const goalAchievementWeight = 0.3;
      
      const completionScore = analytics.taskMetrics.completionRate || 0;
      const timeManagementScore = 100 - (analytics.estimationAccuracy?.overall?.avgError || 50);
      const goalScore = analytics.goalMetrics?.personal?.achievement_rate || 0;
      
      return Math.round(
        completionScore * completionWeight +
        timeManagementScore * timeManagementWeight +
        goalScore * goalAchievementWeight
      );
    }
    
    // Fallback to manual calculation
    return await this.calculateProductivityScoreManually(days);
    
  } catch (error) {
    console.error('Error calculating productivity score:', error);
    return await this.calculateProductivityScoreManually(days);
  }
};

// Add this new helper method to your UserModel.js:
userSchema.methods.calculateProductivityScoreManually = async function(days = 7) {
  try {
    // Get Task model safely
    let Task;
    try {
      Task = mongoose.model('Task');
    } catch (error) {
      console.log('Task model not available');
      return 50; // Default score
    }
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get tasks from the specified period
    const tasks = await Task.find({
      user: this._id,
      $or: [
        { createdAt: { $gte: startDate, $lte: endDate } },
        { completedAt: { $gte: startDate, $lte: endDate } }
      ]
    });

    if (tasks.length === 0) {
      // If no recent tasks, check user's overall completion rate
      const allTasks = await Task.find({ user: this._id }).limit(20);
      if (allTasks.length === 0) return 50;
      
      const completed = allTasks.filter(task => task.completed);
      return Math.round((completed.length / allTasks.length) * 100);
    }

    const completedTasks = tasks.filter(task => task.completed);
    const completionRate = (completedTasks.length / tasks.length) * 100;

    // Calculate time efficiency for completed tasks
    const timeEfficiency = completedTasks.reduce((acc, task) => {
      if (task.estimatedDuration && task.actualDuration) {
        const efficiency = Math.min(task.estimatedDuration / task.actualDuration, 1);
        return acc + efficiency;
      }
      return acc + 0.8; // Default efficiency if no time data
    }, 0) / Math.max(completedTasks.length, 1);

    // Calculate priority adherence
    const priorityScore = completedTasks.reduce((acc, task) => {
      const priorityWeights = { urgent: 1, high: 0.8, medium: 0.6, low: 0.4 };
      return acc + (priorityWeights[task.priority] || 0.5);
    }, 0) / Math.max(completedTasks.length, 1);

    // Calculate overdue penalty
    const overdueTasks = tasks.filter(task => 
      task.dueDate && task.dueDate < new Date() && !task.completed
    );
    const overduePenalty = tasks.length > 0 ? (overdueTasks.length / tasks.length) * 20 : 0;

    // Combine metrics into final score (0-100)
    const productivityScore = Math.round(
      (completionRate * 0.5) + 
      (timeEfficiency * 100 * 0.25) + 
      (priorityScore * 100 * 0.25) - 
      overduePenalty
    );

    return Math.min(Math.max(productivityScore, 0), 100);
    
  } catch (error) {
    console.error('Error in manual productivity calculation:', error);
    return 50; // Safe fallback
  }
};


// Add achievement
userSchema.methods.addAchievement = async function (achievementData) {
  const existing = this.analytics.achievements.find(
    a => a.type === achievementData.type && a.name === achievementData.name
  );
  
  if (existing) {
    // Upgrade existing achievement
    existing.level = Math.max(existing.level || 1, achievementData.level || 1);
  } else {
    // Add new achievement
    this.analytics.achievements.push({
      ...achievementData,
      unlockedAt: new Date(),
      level: achievementData.level || 1,
    });
  }
  
  return this.save();
};

// Get user's current streak
userSchema.methods.updateStreak = async function () {
  const Task = mongoose.model('Task');
  
  // Get completed tasks for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const completedTasks = await Task.find({
    user: this._id,
    completed: true,
    completedAt: { $gte: thirtyDaysAgo },
  }).sort({ completedAt: 1 });
  
  // Calculate current streak
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  // Group tasks by day
  const tasksByDay = {};
  completedTasks.forEach(task => {
    const day = task.completedAt.toDateString();
    if (!tasksByDay[day]) tasksByDay[day] = [];
    tasksByDay[day].push(task);
  });
  
  // Calculate streak from today backwards
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dayString = checkDate.toDateString();
    
    if (tasksByDay[dayString] && tasksByDay[dayString].length > 0) {
      if (i === 0 || currentStreak > 0) {
        currentStreak++;
      }
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      if (i === 0) {
        currentStreak = 0;
      }
      tempStreak = 0;
    }
  }
  
  this.analytics.metrics.streakDays = currentStreak;
  this.analytics.metrics.longestStreak = Math.max(
    this.analytics.metrics.longestStreak,
    longestStreak
  );
  
  return this.save();
};

// Update last active timestamp
userSchema.methods.updateLastActive = function () {
  this.activity.lastActiveDate = new Date();
  return this.save();
};

// Check if user is online (active in last 5 minutes)
userSchema.methods.isOnline = function () {
  if (!this.activity.lastActiveDate) return false;
  
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.activity.lastActiveDate > fiveMinutesAgo;
};

// Get user's timezone-adjusted current time
userSchema.methods.getCurrentTime = function () {
  const now = new Date();
  
  if (!this.profile.timezone || this.profile.timezone === 'UTC') {
    return now;
  }
  
  try {
    return new Date(now.toLocaleString("en-US", { timeZone: this.profile.timezone }));
  } catch (error) {
    return now; // Fallback to UTC if timezone is invalid
  }
};

// Static method to find users by team
userSchema.statics.findByTeam = function (teamId) {
  return this.find({
    'team.teams.teamId': teamId,
    'admin.status': 'active',
  });
};

// Static method to find active users
userSchema.statics.findActive = function (days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    'activity.lastActiveDate': { $gte: cutoffDate },
    'admin.status': 'active',
  });
};

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.name;
});

// Virtual for subscription status
userSchema.virtual('isSubscriptionActive').get(function () {
  return this.subscription.status === 'active' || this.subscription.status === 'trialing';
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model("User", userSchema);

module.exports = User;

// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, "Please add a name"],
//   },
//   email: {
//     type: String,
//     required: [true, "Please add a name"],
//     unique: true,
//     match: [
//       /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
//       "Please enter a valid email",
//     ],
//   },
//   password: {
//     type: String,
//     required: [true, "Please add a password"],
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// // Hash password before saving
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // Match password
// userSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model("User", userSchema);


