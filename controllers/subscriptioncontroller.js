const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");

// @desc    Get subscription details
// @route   GET /api/subscription
// @access  Private
const getSubscription = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  res.status(200).json({
    success: true,
    data: {
      plan: user.subscription.plan,
      status: user.subscription.status,
      currentPeriodStart: user.subscription.currentPeriodStart,
      currentPeriodEnd: user.subscription.currentPeriodEnd,
      trialEndsAt: user.subscription.trialEndsAt,
      cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
      limits: user.subscription.limits,
      usage: user.subscription.usage,
      isActive: user.isSubscriptionActive
    }
  });
});

// @desc    Get subscription usage stats
// @route   GET /api/subscription/usage
// @access  Private
const getUsageStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  const usagePercentages = {};
  Object.keys(user.subscription.limits).forEach(resource => {
    const limit = user.subscription.limits[resource];
    const usage = user.subscription.usage[resource] || 0;
    usagePercentages[resource] = limit > 0 ? Math.round((usage / limit) * 100) : 0;
  });

  res.status(200).json({
    success: true,
    data: {
      usage: user.subscription.usage,
      limits: user.subscription.limits,
      usagePercentages,
      lastResetDate: user.subscription.usage.lastResetDate
    }
  });
});

// @desc    Check if user can perform action based on limits
// @route   POST /api/subscription/check-limit
// @access  Private
const checkLimit = asyncHandler(async (req, res) => {
  const { resource } = req.body;
  
  if (!resource) {
    res.status(400);
    throw new Error("Resource type is required");
  }

  const user = await User.findById(req.user._id);
  const canPerform = user.checkLimit(resource);
  
  const currentUsage = user.subscription.usage[resource] || 0;
  const limit = user.subscription.limits[resource];

  res.status(200).json({
    success: true,
    data: {
      canPerform,
      currentUsage,
      limit,
      remaining: limit - currentUsage,
      resource
    }
  });
});

// @desc    Increment usage counter
// @route   POST /api/subscription/increment-usage
// @access  Private
const incrementUsage = asyncHandler(async (req, res) => {
  const { resource, amount = 1 } = req.body;
  
  if (!resource) {
    res.status(400);
    throw new Error("Resource type is required");
  }

  const user = await User.findById(req.user._id);
  
  // Check if user can perform the action
  if (!user.checkLimit(resource)) {
    res.status(403);
    throw new Error(`Usage limit exceeded for ${resource}`);
  }

  await user.incrementUsage(resource, amount);
  
  res.status(200).json({
    success: true,
    message: `Usage incremented for ${resource}`,
    data: {
      resource,
      newUsage: user.subscription.usage[resource],
      limit: user.subscription.limits[resource]
    }
  });
});

// @desc    Upgrade subscription plan
// @route   PUT /api/subscription/upgrade
// @access  Private
const upgradePlan = asyncHandler(async (req, res) => {
  const { plan, customerId, subscriptionId } = req.body;
  
  const validPlans = ['free', 'pro', 'team', 'enterprise'];
  if (!validPlans.includes(plan)) {
    res.status(400);
    throw new Error("Invalid subscription plan");
  }

  // Define plan limits
  const planLimits = {
    free: {
      tasks: 1000,
      projects: 10,
      teamMembers: 1,
      storage: 1024,
      integrations: 3,
      aiSuggestions: 100
    },
    pro: {
      tasks: 10000,
      projects: 100,
      teamMembers: 5,
      storage: 10240,
      integrations: 10,
      aiSuggestions: 1000
    },
    team: {
      tasks: 50000,
      projects: 500,
      teamMembers: 35,
      storage: 51200,
      integrations: 25,
      aiSuggestions: 5000
    },
    enterprise: {
      tasks: -1, // unlimited
      projects: -1,
      teamMembers: -1,
      storage: -1,
      integrations: -1,
      aiSuggestions: -1
    }
  };

  const updates = {
    'subscription.plan': plan,
    'subscription.status': 'active',
    'subscription.currentPeriodStart': new Date(),
    'subscription.limits': planLimits[plan]
  };

  if (customerId) updates['subscription.customerId'] = customerId;
  if (subscriptionId) updates['subscription.subscriptionId'] = subscriptionId;

  // Set period end based on plan (monthly for now)
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  updates['subscription.currentPeriodEnd'] = periodEnd;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: `Successfully upgraded to ${plan} plan`,
    data: user.subscription
  });
});

// @desc    Cancel subscription
// @route   PUT /api/subscription/cancel
// @access  Private
const cancelSubscription = asyncHandler(async (req, res) => {
  const { cancelImmediately = false } = req.body;
  
  const updates = {};
  
  if (cancelImmediately) {
    updates['subscription.status'] = 'canceled';
    updates['subscription.plan'] = 'free';
    updates['subscription.currentPeriodEnd'] = new Date();
  } else {
    updates['subscription.cancelAtPeriodEnd'] = true;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: cancelImmediately 
      ? "Subscription canceled immediately" 
      : "Subscription will be canceled at the end of current period",
    data: user.subscription
  });
});

// @desc    Reactivate canceled subscription
// @route   PUT /api/subscription/reactivate
// @access  Private
const reactivateSubscription = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (user.subscription.status !== 'canceled' && !user.subscription.cancelAtPeriodEnd) {
    res.status(400);
    throw new Error("Subscription is not canceled");
  }

  const updates = {
    'subscription.cancelAtPeriodEnd': false,
    'subscription.status': 'active'
  };

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: "Subscription reactivated successfully",
    data: updatedUser.subscription
  });
});

// @desc    Reset monthly usage counters (typically called by cron job)
// @route   POST /api/subscription/reset-usage
// @access  Private
const resetMonthlyUsage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  await user.resetMonthlyUsage();
  
  res.status(200).json({
    success: true,
    message: "Monthly usage counters reset successfully",
    data: user.subscription.usage
  });
});

// @desc    Get billing history (placeholder - would integrate with payment provider)
// @route   GET /api/subscription/billing-history
// @access  Private
const getBillingHistory = asyncHandler(async (req, res) => {
  // This would typically fetch from Stripe or other payment provider
  const user = await User.findById(req.user._id);
  
  // Placeholder data
  const billingHistory = [
    {
      id: "inv_123",
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      amount: 9.99,
      plan: user.subscription.plan,
      status: "paid"
    }
  ];

  res.status(200).json({
    success: true,
    data: billingHistory
  });
});

module.exports = {
  getSubscription,
  getUsageStats,
  checkLimit,
  incrementUsage,
  upgradePlan,
  cancelSubscription,
  reactivateSubscription,
  resetMonthlyUsage,
  getBillingHistory
};