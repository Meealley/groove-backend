const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");

// @desc    Get user analytics overview
// @route   GET /api/analytics
// @access  Private
const getAnalytics = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  res.status(200).json({
    success: true,
    data: {
      metrics: user.analytics.metrics,
      achievements: user.analytics.achievements,
      goals: user.analytics.goals,
      isOnline: user.isOnline()
    }
  });
});

// @desc    Get productivity score
// @route   GET /api/analytics/productivity-score
// @access  Private
const getProductivityScore = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  
  const user = await User.findById(req.user._id);
  const productivityScore = await user.getProductivityScore(parseInt(days));
  
  res.status(200).json({
    success: true,
    data: {
      score: productivityScore,
      period: `${days} days`,
      lastCalculated: new Date()
    }
  });
});

// @desc    Get user streak information
// @route   GET /api/analytics/streak
// @access  Private
const getStreak = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  // Update streak before returning
  await user.updateStreak();
  
  res.status(200).json({
    success: true,
    data: {
      currentStreak: user.analytics.metrics.streakDays,
      longestStreak: user.analytics.metrics.longestStreak,
      lastUpdated: new Date()
    }
  });
});

// @desc    Get achievements
// @route   GET /api/analytics/achievements
// @access  Private
const getAchievements = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  // Sort achievements by unlock date (newest first)
  const sortedAchievements = user.analytics.achievements.sort(
    (a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt)
  );

  res.status(200).json({
    success: true,
    data: {
      achievements: sortedAchievements,
      totalAchievements: sortedAchievements.length
    }
  });
});

// @desc    Add achievement manually (for testing or admin)
// @route   POST /api/analytics/achievements
// @access  Private
const addAchievement = asyncHandler(async (req, res) => {
  const { type, name, description, level = 1 } = req.body;
  
  if (!type || !name || !description) {
    res.status(400);
    throw new Error("Type, name, and description are required");
  }

  const user = await User.findById(req.user._id);
  
  await user.addAchievement({
    type,
    name,
    description,
    level
  });

  res.status(201).json({
    success: true,
    message: "Achievement added successfully",
    data: user.analytics.achievements[user.analytics.achievements.length - 1]
  });
});

// @desc    Update goals
// @route   PUT /api/analytics/goals
// @access  Private
const updateGoals = asyncHandler(async (req, res) => {
  const { dailyTaskTarget, weeklyHoursTarget, monthlyProjectsTarget } = req.body;
  
  const updates = {};
  if (dailyTaskTarget !== undefined) updates['analytics.goals.dailyTaskTarget'] = dailyTaskTarget;
  if (weeklyHoursTarget !== undefined) updates['analytics.goals.weeklyHoursTarget'] = weeklyHoursTarget;
  if (monthlyProjectsTarget !== undefined) updates['analytics.goals.monthlyProjectsTarget'] = monthlyProjectsTarget;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "Goals updated successfully",
    data: user.analytics.goals
  });
});

// @desc    Get activity metrics
// @route   GET /api/analytics/activity
// @access  Private
const getActivityMetrics = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  // Calculate days since joining
  const daysSinceJoining = Math.floor(
    (new Date() - user.createdAt) / (1000 * 60 * 60 * 24)
  );
  
  // Calculate average tasks per day
  const avgTasksPerDay = daysSinceJoining > 0 
    ? (user.analytics.metrics.totalTasksCompleted / daysSinceJoining).toFixed(2)
    : 0;

  res.status(200).json({
    success: true,
    data: {
      totalTasksCompleted: user.analytics.metrics.totalTasksCompleted,
      totalTimeTracked: user.analytics.metrics.totalTimeTracked,
      daysSinceJoining,
      avgTasksPerDay: parseFloat(avgTasksPerDay),
      lastLogin: user.activity.lastLogin,
      lastActiveDate: user.activity.lastActiveDate,
      loginCount: user.activity.loginCount,
      sessionCount: user.activity.sessionCount,
      featureUsage: user.activity.featureUsage
    }
  });
});

// @desc    Get time tracking summary
// @route   GET /api/analytics/time-tracking
// @access  Private
const getTimeTrackingSummary = asyncHandler(async (req, res) => {
  const { period = 'week' } = req.query; // week, month, year
  
  const user = await User.findById(req.user._id);
  
  let startDate = new Date();
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
  }

  // This would typically query time tracking records
  // For now, using the total time tracked from user metrics
  const totalMinutes = user.analytics.metrics.totalTimeTracked;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  res.status(200).json({
    success: true,
    data: {
      period,
      totalMinutes,
      formattedTime: `${hours}h ${minutes}m`,
      avgPerDay: Math.round(totalMinutes / 7), // Simplified calculation
      goalProgress: {
        weekly: user.analytics.goals.weeklyHoursTarget,
        achieved: Math.round(totalMinutes / 60),
        percentage: Math.round((totalMinutes / 60) / user.analytics.goals.weeklyHoursTarget * 100)
      }
    }
  });
});

// @desc    Update user metrics (typically called internally)
// @route   POST /api/analytics/update-metrics
// @access  Private
const updateMetrics = asyncHandler(async (req, res) => {
  const { 
    tasksCompleted = 0, 
    timeTracked = 0, 
    feature = null 
  } = req.body;

  const user = await User.findById(req.user._id);
  
  // Update metrics
  if (tasksCompleted > 0) {
    user.analytics.metrics.totalTasksCompleted += tasksCompleted;
  }
  
  if (timeTracked > 0) {
    user.analytics.metrics.totalTimeTracked += timeTracked;
  }
  
  // Update feature usage
  if (feature && user.activity.featureUsage[feature] !== undefined) {
    user.activity.featureUsage[feature] += 1;
  }
  
  // Update last active
  user.activity.lastActiveDate = new Date();
  
  await user.save();

  res.status(200).json({
    success: true,
    message: "Metrics updated successfully",
    data: {
      totalTasksCompleted: user.analytics.metrics.totalTasksCompleted,
      totalTimeTracked: user.analytics.metrics.totalTimeTracked,
      featureUsage: user.activity.featureUsage
    }
  });
});

// @desc    Get dashboard summary
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardSummary = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  // Update streak before showing dashboard
  await user.updateStreak();
  
  const productivityScore = await user.getProductivityScore(7);
  
  // Calculate today's progress towards daily goal
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // This would typically query actual task completions for today
  // For now, using a simplified calculation
  const todayTasksCompleted = 0; // Would be calculated from actual data
  
  const dailyProgress = user.analytics.goals.dailyTaskTarget > 0 
    ? Math.round((todayTasksCompleted / user.analytics.goals.dailyTaskTarget) * 100)
    : 0;

  res.status(200).json({
    success: true,
    data: {
      productivityScore,
      currentStreak: user.analytics.metrics.streakDays,
      todayProgress: {
        completed: todayTasksCompleted,
        target: user.analytics.goals.dailyTaskTarget,
        percentage: dailyProgress
      },
      recentAchievements: user.analytics.achievements
        .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
        .slice(0, 3),
      timeThisWeek: Math.round(user.analytics.metrics.totalTimeTracked / 60), // Convert to hours
      isOnline: user.isOnline(),
      lastActive: user.activity.lastActiveDate
    }
  });
});

module.exports = {
  getAnalytics,
  getProductivityScore,
  getStreak,
  getAchievements,
  addAchievement,
  updateGoals,
  getActivityMetrics,
  getTimeTrackingSummary,
  updateMetrics,
  getDashboardSummary
};