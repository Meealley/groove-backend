const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  addUserNote,
  getUserAnalytics,
  getSystemStats,
  bulkUpdateUsers,
  exportUserData
} = require("../controllers/admincontroller");
const {
  getQueueStatus,
  processEmailQueueManually
} = require("../controllers/emailMonitoringcontroller");
const { protect, admin, superAdmin } = require("../middleware/authMiddleware");

// Apply authentication and admin middleware to all routes
router.use(protect);
router.use(admin);

// User Management
// @route   GET /api/admin/users
// @desc    Get all users with pagination and filtering
// @access  Private/Admin
router.get("/users", getAllUsers);

// @route   GET /api/admin/users/:userId
// @desc    Get user by ID
// @access  Private/Admin
router.get("/users/:userId", getUserById);

// @route   PUT /api/admin/users/:userId/status
// @desc    Update user status
// @access  Private/Admin
router.put("/users/:userId/status", updateUserStatus);

// @route   PUT /api/admin/users/:userId/role
// @desc    Update user role (super admin only)
// @access  Private/SuperAdmin
router.put("/users/:userId/role", superAdmin, updateUserRole);

// @route   POST /api/admin/users/:userId/notes
// @desc    Add admin note to user
// @access  Private/Admin
router.post("/users/:userId/notes", addUserNote);

// @route   GET /api/admin/users/:userId/analytics
// @desc    Get user analytics for admin
// @access  Private/Admin
router.get("/users/:userId/analytics", getUserAnalytics);

// System Statistics
// @route   GET /api/admin/stats
// @desc    Get system statistics
// @access  Private/Admin
router.get("/stats", getSystemStats);

// Email Queue Management
// @route   GET /api/admin/email-queue
// @desc    Get email queue status
// @access  Private/Admin
router.get("/email-queue", getQueueStatus);

// @route   POST /api/admin/email-queue/process
// @desc    Process email queue manually
// @access  Private/Admin
router.post("/email-queue/process", processEmailQueueManually);

// Bulk Operations
// @route   PUT /api/admin/users/bulk-update
// @desc    Bulk update users (super admin only)
// @access  Private/SuperAdmin
router.put("/users/bulk-update", superAdmin, bulkUpdateUsers);

// Data Export
// @route   GET /api/admin/users/export
// @desc    Export user data
// @access  Private/Admin
router.get("/users/export", exportUserData);

module.exports = router;