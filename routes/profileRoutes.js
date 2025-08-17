const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateUserProfile,
  uploadAvatar,
  deleteAvatar,
  getCurrentTime
} = require("../controllers/profilecontroller");
const { protect } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(protect);

// @route   GET /api/profile
// @desc    Get user profile
// @access  Private
router.get("/", getProfile);

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put("/", updateUserProfile);

// @route   POST /api/profile/avatar
// @desc    Upload profile avatar
// @access  Private
router.post("/avatar", uploadAvatar);

// @route   DELETE /api/profile/avatar
// @desc    Delete profile avatar
// @access  Private
router.delete("/avatar", deleteAvatar);

// @route   GET /api/profile/current-time
// @desc    Get user's current time in their timezone
// @access  Private
router.get("/current-time", getCurrentTime);

module.exports = router;