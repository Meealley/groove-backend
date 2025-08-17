const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");

// @desc Get work preference
// @route GET /api/preferences/work
// @access Private
const getWorkPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({
    success: true,
    data: user.workPreferences,
  });
});

// @desc Update work preference
// @route PUT /api/preferences/work
// @access Private
const updateWorkPreferences = asyncHandler(async (req, res) => {
  const { workingHours, breaks, focus, tasks } = req.body;

  const updates = {};

  if (workingHours) updates["workingPreferences.workingHours"] = workingHours;
  if (breaks) updates["workingPreferences.breaks"] = breaks;
  if (focus) updates["workingPreferences.focus"] = focus;
  if (tasks) updates["workingPreferences.tasks"] = tasks;

  const user = await User.findByIdAndUpdate(
    req.user._id,

    { $set: updates },
    { new: true, runValidators: true }
  );
});

// @desc Get app settings
// @routes GET api/preferences/settings
// @access Private
const getSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: user.settings,
  });
});

// @desc Update notification settings
// @route PUT api/preferences/notifications
// @access Private
const updateNotificationSettings = asyncHandler(async (req, res) => {
  const { email, push, inApp, doNotDisturb } = req.body;

  const updates = {};

  if (email) updates["settings.notifications.email"] = email;
  if (push) updates["settings.notifications.push"] = push;
  if (inApp) updates["settings.notifications.inApp"] = inApp;
  if (doNotDisturb)
    updates["settings.notifications.doNotDisturb"] = doNotDisturb;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "Notification Settings Updated Successfully",
    data: user.settings.notifications,
  });
});

// @desc Update privacy settings
// @route PUT/api/preferences/setting/privacy
// @access Private
const updatePrivacySettings = asyncHandler(async (req, res, next) => {
  const allowedFields = [
    "shareAnalytics",
    "shareUsageData",
    "allowAILearning",
    "dataRetention",
  ];

  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[`settings.privacy.${field}`] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "Privacy Settings Updated Successfully",
    data: user.settings.interface,
  });
});

// @desc    Update interface settings
// @route   PUT /api/preferences/settings/interface
// @access  Private
const updateInterfaceSettings = asyncHandler(async (req, res) => {
  const allowedFields = [
    "theme",
    "density",
    "primaryColor",
    "showCompletedTasks",
    "defaultView",
    "sidebarCollapsed",
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[`settings.interface.${field}`] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "Interface settings updated successfully",
    data: user.settings.interface,
  });
});

// @desc Update advanced settings
// @route PUT /api/preferences/settings/advanced
// @access Private
const updateAdvancedSettings = asyncHandler(async (req, res) => {
  const allowFields = [
    "enableBetaFeatures",
    "debugMode",
    "autoBackup",
    "offlineMode",
    "analyticsLevel",
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[`settings.advanced.${field}`] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "Advanced Settings Updated Successfully",
    data: user.settings.advanced,
  });
});

// @desc Get AI preferences
// @route GET /api/preferences/ai
// @access Private
const getAIPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: user.aiPreferences,
  });
});

// @desc Update AI Preferences
// @route PUT /api/preferences/ai
// @access Private
const updateAIPreferences = asyncHandler(async (req, res) => {
  const { assistanceLevel, features, learning } = req.body;

  const updates = {};
  if (assistanceLevel)
    updates["aiPreferences.assistanceLevel"] = assistanceLevel;
  if (features) updates["aiPreferences.features"] = features;
  if (learning) updates["aiPreferences.learning"] = learning;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "AI preferences updated successfully",
    data: user.aiPreferences,
  });
});

// @desc    Reset preferences to default
// @route   POST /api/preferences/reset
// @access  Private
const resetPreferences = asyncHandler(async (req, res) => {
  const { section } = req.body; // 'work', 'settings', 'ai', or 'all'

  const updates = {};

  if (section === "work" || section === "all") {
    updates["workPreferences"] = {
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
    };
  }

  if (section === "ai" || section === "all") {
    updates["aiPreferences"] = {
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
    };
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: `${
      section === "all" ? "All preferences" : section + " preferences"
    } reset to default`,
    data: {
      workPreferences: user.workPreferences,
      settings: user.settings,
      aiPreferences: user.aiPreferences,
    },
  });
});

module.exports = {
  getWorkPreferences,
  updateWorkPreferences,
  getSettings,
  updateNotificationSettings,
  updatePrivacySettings,
  updateInterfaceSettings,
  updateAdvancedSettings,
  getAIPreferences,
  updateAIPreferences,
  resetPreferences,
};
