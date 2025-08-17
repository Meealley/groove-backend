const express = require("express");
const router = express.Router();
const {
  getSubscription,
  getUsageStats,
  checkLimit,
  incrementUsage,
  upgradePlan,
  cancelSubscription,
  reactivateSubscription,
  resetMonthlyUsage,
  getBillingHistory
} = require("../controllers/subscriptioncontroller");
const { protect } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(protect);

// @route   GET /api/subscription
// @desc    Get subscription details
// @access  Private
router.get("/", getSubscription);

// @route   GET /api/subscription/usage
// @desc    Get usage statistics
// @access  Private
router.get("/usage", getUsageStats);

// @route   POST /api/subscription/check-limit
// @desc    Check if user can perform action based on limits
// @access  Private
router.post("/check-limit", checkLimit);

// @route   POST /api/subscription/increment-usage
// @desc    Increment usage counter
// @access  Private
router.post("/increment-usage", incrementUsage);

// @route   PUT /api/subscription/upgrade
// @desc    Upgrade subscription plan
// @access  Private
router.put("/upgrade", upgradePlan);

// @route   PUT /api/subscription/cancel
// @desc    Cancel subscription
// @access  Private
router.put("/cancel", cancelSubscription);

// @route   PUT /api/subscription/reactivate
// @desc    Reactivate canceled subscription
// @access  Private
router.put("/reactivate", reactivateSubscription);

// @route   POST /api/subscription/reset-usage
// @desc    Reset monthly usage counters
// @access  Private
router.post("/reset-usage", resetMonthlyUsage);

// @route   GET /api/subscription/billing-history
// @desc    Get billing history
// @access  Private
router.get("/billing-history", getBillingHistory);

module.exports = router;