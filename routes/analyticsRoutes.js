const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/analyticscontroller");
const { protect } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(protect);

// Main Analytics
// @route   GET /api/analytics
// @desc    Get user analytics overview
// @access  Private
router.get("/", getAnalytics);

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard summary
// @access  Private
router.get("/dashboard", getDashboardSummary);

// Productivity & Performance
// @route   GET /api/analytics/productivity-score
// @desc    Get productivity score
// @access  Private
router.get("/productivity-score", getProductivityScore);

// @route   GET /api/analytics/streak
// @desc    Get user streak information
// @access  Private
router.get("/streak", getStreak);

// Achievements
// @route   GET /api/analytics/achievements
// @desc    Get user achievements
// @access  Private
router.get("/achievements", getAchievements);

// @route   POST /api/analytics/achievements
// @desc    Add achievement (for testing or admin)
// @access  Private
router.post("/achievements", addAchievement);

// Goals
// @route   PUT /api/analytics/goals
// @desc    Update user goals
// @access  Private
router.put("/goals", updateGoals);

// Activity & Time Tracking
// @route   GET /api/analytics/activity
// @desc    Get activity metrics
// @access  Private
router.get("/activity", getActivityMetrics);

// @route   GET /api/analytics/time-tracking
// @desc    Get time tracking summary
// @access  Private
router.get("/time-tracking", getTimeTrackingSummary);

// @route   POST /api/analytics/update-metrics
// @desc    Update user metrics (internal use)
// @access  Private
router.post("/update-metrics", updateMetrics);

module.exports = router;