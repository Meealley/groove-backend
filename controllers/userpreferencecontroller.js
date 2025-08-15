const asyncHandler = require('express-async-handler');
const UserPreference = require('../models/UserPreferenceModel');

// @desc    Get user preferences
// @route   GET /api/preferences
// @access  Private
const getUserPreferences = asyncHandler(async (req, res) => {
  let preferences = await UserPreference.findOne({ user: req.user.id });
  
  // Create default preferences if they don't exist
  if (!preferences) {
    preferences = await UserPreference.createDefaultPreferences(req.user.id);
    preferences = await UserPreference.findOne({ user: req.user.id });
  }
  
  res.json(preferences);
});

// @desc    Update user preferences
// @route   PUT /api/preferences
// @access  Private
const updateUserPreferences = asyncHandler(async (req, res) => {
  let preferences = await UserPreference.findOne({ user: req.user.id });
  
  if (!preferences) {
    // Create with provided data
    preferences = await UserPreference.create({
      user: req.user.id,
      ...req.body
    });
  } else {
    // Update existing preferences
    Object.assign(preferences, req.body);
    await preferences.save();
  }
  
  res.json(preferences);
});

// @desc    Update specific preference category
// @route   PUT /api/preferences/:category
// @access  Private
const updatePreferenceCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  
  let preferences = await UserPreference.findOne({ user: req.user.id });
  
  if (!preferences) {
    preferences = await UserPreference.create({ user: req.user.id });
  }
  
  try {
    await preferences.updateCategory(category, req.body);
    res.json({
      success: true,
      message: `${category} preferences updated`,
      [category]: preferences[category]
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Set productive hours for user
// @route   POST /api/preferences/productive-hours
// @access  Private
const setProductiveHours = asyncHandler(async (req, res) => {
  const { day, hours } = req.body;
  
  if (day < 0 || day > 6) {
    res.status(400);
    throw new Error('Day must be between 0 (Sunday) and 6 (Saturday)');
  }
  
  let preferences = await UserPreference.findOne({ user: req.user.id });
  
  if (!preferences) {
    preferences = await UserPreference.create({ user: req.user.id });
  }
  
  // Find existing day or create new one
  const existingDayIndex = preferences.productiveHours.findIndex(p => p.day === day);
  
  if (existingDayIndex !== -1) {
    preferences.productiveHours[existingDayIndex].hours = hours;
  } else {
    preferences.productiveHours.push({ day, hours });
  }
  
  await preferences.save();
  
  res.json({
    success: true,
    message: 'Productive hours updated',
    productiveHours: preferences.productiveHours
  });
});

// @desc    Get user's current productive hours
// @route   GET /api/preferences/productive-hours/:day
// @access  Private
const getProductiveHours = asyncHandler(async (req, res) => {
  const day = parseInt(req.params.day);
  
  const preferences = await UserPreference.findOne({ user: req.user.id });
  
  if (!preferences) {
    return res.json({ day, hours: [] });
  }
  
  const productiveHours = preferences.getProductiveHours(day);
  
  res.json({
    day,
    hours: productiveHours,
    isWorkingDay: preferences.workingDays.includes(day)
  });
});

// @desc    Check if current time is working time
// @route   GET /api/preferences/is-working-time
// @access  Private
const checkWorkingTime = asyncHandler(async (req, res) => {
  const preferences = await UserPreference.findOne({ user: req.user.id });
  
  if (!preferences) {
    return res.json({ isWorkingTime: true }); // Default to true
  }
  
  const isWorkingTime = preferences.isWorkingTime();
  const now = new Date();
  
  res.json({
    isWorkingTime,
    currentTime: now.toISOString(),
    workingHours: preferences.workingHours,
    workingDays: preferences.workingDays
  });
});

module.exports = {
  getUserPreferences,
  updateUserPreferences,
  updatePreferenceCategory,
  setProductiveHours,
  getProductiveHours,
  checkWorkingTime
};