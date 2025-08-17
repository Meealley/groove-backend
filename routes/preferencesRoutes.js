const express = require("express");
const router = express.Router();
const {
  getWorkPreferences,
  updateWorkPreferences,
  getSettings,
  updateNotificationSettings,
  updatePrivacySettings,
  updateInterfaceSettings,
  updateAdvancedSettings,
  getAIPreferences,
  updateAIPreferences,
  resetPreferences
} = require("../controllers/preferencecontroller");
const { protect } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(protect);

// Work Preferences Routes
// @route   GET /api/preferences/work
// @desc    Get work preferences
// @access  Private
router.get("/work", getWorkPreferences);

// @route   PUT /api/preferences/work
// @desc    Update work preferences
// @access  Private
router.put("/work", updateWorkPreferences);

// Settings Routes
// @route   GET /api/preferences/settings
// @desc    Get all app settings
// @access  Private
router.get("/settings", getSettings);

// @route   PUT /api/preferences/settings/notifications
// @desc    Update notification settings
// @access  Private
router.put("/settings/notifications", updateNotificationSettings);

// @route   PUT /api/preferences/settings/privacy
// @desc    Update privacy settings
// @access  Private
router.put("/settings/privacy", updatePrivacySettings);

// @route   PUT /api/preferences/settings/interface
// @desc    Update interface settings
// @access  Private
router.put("/settings/interface", updateInterfaceSettings);

// @route   PUT /api/preferences/settings/advanced
// @desc    Update advanced settings
// @access  Private
router.put("/settings/advanced", updateAdvancedSettings);

// AI Preferences Routes
// @route   GET /api/preferences/ai
// @desc    Get AI preferences
// @access  Private
router.get("/ai", getAIPreferences);

// @route   PUT /api/preferences/ai
// @desc    Update AI preferences
// @access  Private
router.put("/ai", updateAIPreferences);

// Reset Preferences
// @route   POST /api/preferences/reset
// @desc    Reset preferences to default
// @access  Private
router.post("/reset", resetPreferences);

module.exports = router;