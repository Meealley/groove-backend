const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");
const crypto = require('crypto');

// @desc    Get all connected integrations
// @route   GET /api/integrations
// @access  Private
const getIntegrations = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  // Filter out sensitive data
  const integrations = user.integrations.connectedServices.map(service => ({
    service: service.service,
    serviceId: service.serviceId,
    connectedAt: service.connectedAt,
    lastSync: service.lastSync,
    status: service.status
  }));

  res.status(200).json({
    success: true,
    data: {
      connectedServices: integrations,
      apiAccess: {
        enabled: user.integrations.apiAccess.enabled,
        keyCount: user.integrations.apiAccess.keys.filter(key => key.active).length
      },
      webhookCount: user.integrations.webhooks.filter(webhook => webhook.active).length
    }
  });
});

// @desc    Connect a new service
// @route   POST /api/integrations/connect
// @access  Private
const connectService = asyncHandler(async (req, res) => {
  const { service, serviceId, accessToken } = req.body;
  
  if (!service || !serviceId) {
    res.status(400);
    throw new Error("Service and service ID are required");
  }

  const user = await User.findById(req.user._id);
  
  // Check integration limits
  if (!user.checkLimit('integrations')) {
    res.status(403);
    throw new Error("Integration limit reached for your subscription plan");
  }

  // Check if service is already connected
  const existingService = user.integrations.connectedServices.find(
    s => s.service === service && s.serviceId === serviceId
  );

  if (existingService) {
    res.status(400);
    throw new Error("This service is already connected");
  }

  // Add the new service
  user.integrations.connectedServices.push({
    service,
    serviceId,
    connectedAt: new Date(),
    lastSync: new Date(),
    status: 'active'
  });

  // Increment usage
  await user.incrementUsage('integrations');
  await user.save();

  res.status(201).json({
    success: true,
    message: `${service} connected successfully`,
    data: {
      service,
      serviceId,
      connectedAt: new Date()
    }
  });
});

// @desc    Disconnect a service
// @route   DELETE /api/integrations/:serviceId
// @access  Private
const disconnectService = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  
  const user = await User.findById(req.user._id);
  
  const serviceIndex = user.integrations.connectedServices.findIndex(
    s => s.serviceId === serviceId
  );

  if (serviceIndex === -1) {
    res.status(404);
    throw new Error("Connected service not found");
  }

  const service = user.integrations.connectedServices[serviceIndex];
  user.integrations.connectedServices.splice(serviceIndex, 1);
  
  await user.save();

  res.status(200).json({
    success: true,
    message: `${service.service} disconnected successfully`,
    data: {
      service: service.service,
      serviceId
    }
  });
});

// @desc    Sync service data
// @route   POST /api/integrations/:serviceId/sync
// @access  Private
const syncService = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  
  const user = await User.findById(req.user._id);
  
  const service = user.integrations.connectedServices.find(
    s => s.serviceId === serviceId
  );

  if (!service) {
    res.status(404);
    throw new Error("Connected service not found");
  }

  if (service.status !== 'active') {
    res.status(400);
    throw new Error("Service is not active");
  }

  // Update last sync time
  service.lastSync = new Date();
  await user.save();

  // Here you would implement actual sync logic for each service
  // For now, we'll just simulate a successful sync

  res.status(200).json({
    success: true,
    message: `${service.service} synced successfully`,
    data: {
      service: service.service,
      serviceId,
      lastSync: service.lastSync
    }
  });
});

// @desc    Get API keys
// @route   GET /api/integrations/api-keys
// @access  Private
const getAPIKeys = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user.integrations.apiAccess.enabled) {
    res.status(403);
    throw new Error("API access is not enabled");
  }

  // Filter out the actual key values and only show metadata
  const keys = user.integrations.apiAccess.keys
    .filter(key => key.active)
    .map(key => ({
      name: key.name,
      permissions: key.permissions,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
      keyPreview: key.key.substring(0, 8) + '...' // Show only first 8 characters
    }));

  res.status(200).json({
    success: true,
    data: {
      enabled: user.integrations.apiAccess.enabled,
      keys
    }
  });
});

// @desc    Create API key
// @route   POST /api/integrations/api-keys
// @access  Private
const createAPIKey = asyncHandler(async (req, res) => {
  const { name, permissions = ['read'] } = req.body;
  
  if (!name || name.trim().length === 0) {
    res.status(400);
    throw new Error("API key name is required");
  }

  const user = await User.findById(req.user._id);
  
  if (!user.integrations.apiAccess.enabled) {
    res.status(403);
    throw new Error("API access is not enabled. Enable it first.");
  }

  // Check if we've reached the limit of API keys
  const activeKeys = user.integrations.apiAccess.keys.filter(key => key.active);
  if (activeKeys.length >= 5) { // Limit of 5 API keys per user
    res.status(400);
    throw new Error("Maximum number of API keys reached");
  }

  // Generate a secure API key
  const apiKey = 'ak_' + crypto.randomBytes(32).toString('hex');
  const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

  // Add the new API key
  user.integrations.apiAccess.keys.push({
    name: name.trim(),
    key: hashedKey,
    permissions,
    createdAt: new Date(),
    lastUsed: null,
    active: true
  });

  await user.save();

  res.status(201).json({
    success: true,
    message: "API key created successfully",
    data: {
      name,
      key: apiKey, // Only return the actual key once, during creation
      permissions,
      warning: "This is the only time you'll see this key. Store it securely."
    }
  });
});

// @desc    Enable API access
// @route   PUT /api/integrations/api-access/enable
// @access  Private
const enableAPIAccess = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user.checkLimit('integrations')) {
    res.status(403);
    throw new Error("API access requires a premium subscription");
  }

  user.integrations.apiAccess.enabled = true;
  await user.save();

  res.status(200).json({
    success: true,
    message: "API access enabled successfully",
    data: {
      enabled: true
    }
  });
});

// @desc    Disable API access
// @route   PUT /api/integrations/api-access/disable
// @access  Private
const disableAPIAccess = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  // Deactivate all API keys
  user.integrations.apiAccess.keys.forEach(key => {
    key.active = false;
  });
  
  user.integrations.apiAccess.enabled = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: "API access disabled and all keys deactivated",
    data: {
      enabled: false
    }
  });
});

// @desc    Revoke API key
// @route   DELETE /api/integrations/api-keys/:keyName
// @access  Private
const revokeAPIKey = asyncHandler(async (req, res) => {
  const { keyName } = req.params;
  
  const user = await User.findById(req.user._id);
  
  const keyIndex = user.integrations.apiAccess.keys.findIndex(
    key => key.name === keyName && key.active
  );

  if (keyIndex === -1) {
    res.status(404);
    throw new Error("API key not found");
  }

  user.integrations.apiAccess.keys[keyIndex].active = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: "API key revoked successfully",
    data: {
      keyName
    }
  });
});

// @desc    Get webhooks
// @route   GET /api/integrations/webhooks
// @access  Private
const getWebhooks = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  const webhooks = user.integrations.webhooks.map(webhook => ({
    url: webhook.url,
    events: webhook.events,
    active: webhook.active,
    createdAt: webhook.createdAt,
    lastTriggered: webhook.lastTriggered
  }));

  res.status(200).json({
    success: true,
    data: webhooks
  });
});

// @desc    Create webhook
// @route   POST /api/integrations/webhooks
// @access  Private
const createWebhook = asyncHandler(async (req, res) => {
  const { url, events = ['task.created', 'task.completed'] } = req.body;
  
  if (!url) {
    res.status(400);
    throw new Error("Webhook URL is required");
  }

  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    res.status(400);
    throw new Error("Invalid webhook URL");
  }

  const user = await User.findById(req.user._id);
  
  // Check if webhook already exists
  const existingWebhook = user.integrations.webhooks.find(
    webhook => webhook.url === url && webhook.active
  );

  if (existingWebhook) {
    res.status(400);
    throw new Error("Webhook with this URL already exists");
  }

  // Generate webhook secret
  const secret = crypto.randomBytes(32).toString('hex');

  // Add webhook
  user.integrations.webhooks.push({
    url,
    events,
    secret,
    active: true,
    createdAt: new Date(),
    lastTriggered: null
  });

  await user.save();

  res.status(201).json({
    success: true,
    message: "Webhook created successfully",
    data: {
      url,
      events,
      secret, // Return secret only during creation
      active: true
    }
  });
});

// @desc    Update webhook
// @route   PUT /api/integrations/webhooks/:webhookUrl
// @access  Private
const updateWebhook = asyncHandler(async (req, res) => {
  const { webhookUrl } = req.params;
  const { events, active } = req.body;
  
  const user = await User.findById(req.user._id);
  
  const webhook = user.integrations.webhooks.find(
    w => w.url === decodeURIComponent(webhookUrl)
  );

  if (!webhook) {
    res.status(404);
    throw new Error("Webhook not found");
  }

  if (events) webhook.events = events;
  if (active !== undefined) webhook.active = active;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Webhook updated successfully",
    data: {
      url: webhook.url,
      events: webhook.events,
      active: webhook.active
    }
  });
});

// @desc    Delete webhook
// @route   DELETE /api/integrations/webhooks/:webhookUrl
// @access  Private
const deleteWebhook = asyncHandler(async (req, res) => {
  const { webhookUrl } = req.params;
  
  const user = await User.findById(req.user._id);
  
  const webhookIndex = user.integrations.webhooks.findIndex(
    webhook => webhook.url === decodeURIComponent(webhookUrl)
  );

  if (webhookIndex === -1) {
    res.status(404);
    throw new Error("Webhook not found");
  }

  user.integrations.webhooks.splice(webhookIndex, 1);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Webhook deleted successfully"
  });
});

module.exports = {
  getIntegrations,
  connectService,
  disconnectService,
  syncService,
  getAPIKeys,
  createAPIKey,
  enableAPIAccess,
  disableAPIAccess,
  revokeAPIKey,
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook
};