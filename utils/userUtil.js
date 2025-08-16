const User = require("../models/UserModel");
const crypto = require("crypto");

// generate random password
const generateRandomPassword = (length = 12) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  return password;
};

// Generate Secure Token
const generateSecureToken = (lenght = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

// Create default user preferences

const createDefaultUserData = () => {
  return {
    profile: {
      timezone: "UTC",
      language: "en",
    },
    workPreferences: {
      workingHours: {
        monday: { start: "09:00", end: "17:00", enabled: true },
        tuesday: { start: "09:00", end: "17:00", enabled: true },
        wednesday: { start: "09:00", end: "17:00", enabled: true },
        thursday: { start: "09:00", end: "17:00", enabled: true },
        friday: { start: "09:00", end: "17:00", enabled: true },
        saturday: { start: "09:00", end: "17:00", enabled: false },
        sunday: { start: "09:00", end: "17:00", enabled: false },
      },
      breaks: {
        shortBreakDuration: 15,
        longBreakDuration: 60,
        shortBreakFrequency: 120,
        lunchBreakTime: "12:00",
        lunchBreakDuration: 60,
      },
      focus: {
        deepWorkBlockDuration: 90,
        allowInterruptions: false,
        notificationsDuringFocus: false,
      },
      tasks: {
        defaultPriority: "medium",
        defaultEstimationBuffer: 20,
        maxDailyTasks: 10,
        preferredTaskDuration: 60,
        autoSchedule: true,
      },
    },

    setting: {
      notifications: {
        email: {
          taskReminders: true,
          deadlineWarnings: true,
          weeklyReports: true,
          teamUpdates: true,
          systemUpdates: false,
        },
        push: {
          taskReminders: true,
          deadlineWarnings: true,
          smartSuggestions: true,
          locationReminders: false,
        },
        inApp: {
          taskUpdates: true,
          achievements: true,
          tips: true,
        },
        doNotDisturb: {
          enabled: false,
          weekendsOnly: false,
        },
      },

      privacy: {
        shareAnalytics: true,
        shareUsageData: true,
        allowAILearning: true,
        dataRetention: "2years",
      },
      interface: {
        theme: "light",
        density: "comfortable",
        primaryColor: "#007bff",
        showCompletedTasks: false,
        defaultView: "list",
        sidebarCollapsed: false,
      },
      advanced: {
        enableBetaFeatures: false,
        debugMode: false,
        autoBackup: true,
        offlineMode: true,
        analyticsLevel: "detailed",
      },
    },
    aiPreferences: {
      assistanceLevel: "moderate",
      features: {
        smartScheduling: true,
        taskSuggestions: true,
        priorityRecommendations: true,
        timeEstimation: true,
        productivityInsights: true,
        habitTracking: true,
        goalRecommendations: true,
      },
      learning: {
        adaptToPatterns: true,
        shareDataForImprovement: true,
        feedbackFrequency: "monthly",
      },
    },
    analytics: {
      goals: {
        dailyTaskTarget: 5,
        weeklyHoursTarget: 40,
        monthlyProjectsTarget: 2,
      },
    },
  };
};

// Validate User data
const validateUserUpdate = (data, allowedFields) => {
  const errors = [];
  const sanitizedData = [];

  // Only include allowed Fields
  for (const field of allowedFields) {
    if (data.hasOwnProperty(field)) {
      sanitizedData[field] = data[field];
    }
  }

  // Validate email format
  if (sanitizedData.email) {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      errors.push("Invalid email format");
    }
  }

  // Validate password strength
  if (sanitizedData.password) {
    if (sanitizedData.password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }
  }

  // Validate phone number (basic validation)
  if (sanitizedData.phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(sanitizedData.phone)) {
      errors.push("Invalid phone number format");
    }
  }

  // Validate timezone
  if (sanitizedData.timezone) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: sanitizedData.timezone });
    } catch (error) {
      errors.push("Invalid timezone");
    }
  }

  return { errors, sanitizedData };
};

// Check if user exists by email
const checkUserExists = async (email) => {
  const user = await User.findOne({ email }).select("_id email");
  return !!user;
};

// Get user by various identifiers
const getUserBy = async (field, value, selectFields = null) => {
  const query = { [field]: value };

  if (selectFields) {
    return await User.findOne(query).select(selectFields);
  }

  return await User.findOne(query);
};

// Calculate user's account age in days
const getAccountAge = (user) => {
  const now = new Date();
  const createdAt = new Date(user.createdAt);
  const diffTime = Math.abs(now - createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Check if user is premium (has paid plan)
const isPremiumUser = (user) => {
  return (
    ["pro", "team", "enterprise"].includes(user.subscription.plan) &&
    user.isSubscriptionActive
  );
};

// Get user's subscription tier level (0-3)
const getSubscriptionTier = (user) => {
  const tiers = { free: 0, pro: 1, team: 2, enterprise: 3 };
  return tiers[user.subscription.plan] || 0;
};

// Format user for public display (remove sensitive data)
const formatUserForPublic = (user) => {
  return {
    _id: user._id,
    name: user.name,
    fullName: user.fullName,
    profile: {
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      avatar: user.profile.avatar,
      bio: user.profile.bio,
      title: user.profile.title,
      company: user.profile.company,
      timezone: user.profile.timezone,
      country: user.profile.country,
      city: user.profile.city,
    },
    isOnline: user.isOnline(),
    joinedAt: user.createdAt,
    lastActive: user.activity.lastActiveDate,
  };
};

// Get user's working hours for a specific day
const getUserWorkingHours = (user, dayName) => {
  const day = dayName.toLowerCase();
  const workingHours = user.workPreferences.workingHours[day];

  if (!workingHours || !workingHours.enabled) {
    return null;
  }

  return {
    start: workingHours.start,
    end: workingHours.end,
    enabled: workingHours.enabled,
  };
};

// Check if user is currently in working hours
const isInWorkingHours = (user) => {
  const now = user.getCurrentTime();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const workingHours = getUserWorkingHours(user, dayName);

  if (!workingHours) {
    return false;
  }

  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  return currentTime >= workingHours.start && currentTime <= workingHours.end;
};

// Check if user is in DND
const isInDoNotDisturbMode = (user) => {
  const dnd = user.settings.notifications.doNotDisturb;
  if (!dnd.enabled) {
    return false;
  }

  const now = user.getCurrentTime();
  const currentTime = now.toTimeString().slice(0, 5);

  // Check weekend only settings
  if (dnd.weekendOnly) {
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      return false;
    }
  }

  if (dnd.start && dnd.end) {
    if (dnd.start <= dnd.end) {
      // Same day range (e.g., 22:00 to 08:00 next day)
      return currentTime >= dnd.start || currentTime <= dnd.end;
    } else {
      // Cross-day range (e.g., 22:00 to 08:00)
      return currentTime >= dnd.start && currentTime <= dnd.end;
    }
  }

  return false;
};

// Calculate user engagement score based on activity
const calculateEngagementScore = (user) => {
  const accountAge = getAccountAge(user);
  const loginFrequency = user.activity.loginCount / Math.max(accountAge, 1);
  const lastActiveRecency = Math.min(
    7,
    Math.floor(
      (new Date() - new Date(user.activity.lastActiveDate)) /
        (1000 * 60 * 60 * 24)
    )
  );

  // Score based on login frequency (0-40 points)
  const loginScore = Math.min(40, loginFrequency * 10);

  // Score based on recency (0-30 points)
  const recencyScore = Math.max(0, 30 - lastActiveRecency * 5);

  // Score based on feature usage (0-30 points)
  const featureUsageTotal = Object.values(user.activity.featureUsage).reduce(
    (a, b) => a + b,
    0
  );
  const featureScore = Math.min(30, featureUsageTotal / 10);

  return Math.round(loginScore + recencyScore + featureScore);
};

// Log user activity
const logUserActivity = async (userId, activityType, metadata = {}) => {
  const user = await User.findById(userId);
  if (!user) return;

  // Update general activity
  user.activity.lastActiveDate = new Date();

  // Update specific feature usage
  if (user.activity.featureUsage[activityType] !== undefined) {
    user.activity.featureUsage[activityType] += 1;
  }

  await user.save();
};

module.exports = {
  generateRandomPassword,
  generateSecureToken,
  createDefaultUserData,
  validateUserUpdate,
  checkUserExists,
  getUserBy,
  getAccountAge,
  isPremiumUser,
  getSubscriptionTier,
  formatUserForPublic,
  getUserWorkingHours,
  isInWorkingHours,
  isInDoNotDisturbMode,
  calculateEngagementScore,
  logUserActivity,
};
