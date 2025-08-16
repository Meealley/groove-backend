const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");

// @desc Get work preference
// @route GET /api/preferences/work
// @access Private
const getWorkPreference = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({
    success: true,
    data: user.workPreferences,
  });
});

// @desc Update work preference
// @route PUT /api/preferences/work
// @access Private
const updateWorkPreference = asyncHandler(async (req, res) => {
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
const getSetting = asyncHandler(async (req, res) => {
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
