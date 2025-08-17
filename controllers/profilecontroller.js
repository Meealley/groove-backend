const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -security.twoFactorAuth.secret -security.passwordReset');
  
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    data: user.profile
  });
});

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    "firstName",
    "lastName",
    "avatar",
    "bio",
    "title",
    "company",
    "department",
    "timezone",
    "language",
    "country",
    "city",
    "dateOfBirth",
    "phone",
  ];
  const updates = {};

  // Only include allowed fields
  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      updates[`profile.${key}`] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select("-password -security.twoFactorAuth.secret -security.passwordReset");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json(user.profile);
});

// @desc upload profile avatar
// @route POST /api/profile/avatar
// @access Private
const uploadAvatar = asyncHandler(async (req, res) => {
  const { avatarUrl } = req.body;

  // If no avatar provided, fallback to default
  const finalAvatar =
    avatarUrl ||
    "https://res.cloudinary.com/dvflv8rwy/image/upload/v1755329017/kkks1sprvv0ppnh6zoxy.png";

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { "profile.avatar": finalAvatar } },
    { new: true }
  ).select("profile.avatar");

  res.status(200).json({
    success: true,
    message: avatarUrl
      ? "Avatar updated successfully"
      : "No avatar provided — default applied",
    data: { avatar: user.profile.avatar },
  });
});

// @desc Delete profile avatar
// @route DELETE /api/profile/avatar
// @access Private
const deleteAvatar = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { "profile.avatar": "" },
  });

  res.status(200).json({
    message: "Avatar deleted successfully",
  });
});

// @desc Get users current time in their timezone
// @route GET/api/profile/current-time
// @access Private

const getCurrentTime = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const currentTime = user.getCurrentTime();

  res.status(200).json({
    success: true,
    data: {
      currentTime,
      timezone: user.profile.timezone || "UTC",
    }
  });
});

module.exports = {
  getProfile,
  updateUserProfile,
  uploadAvatar,
  deleteAvatar,
  getCurrentTime,
};
