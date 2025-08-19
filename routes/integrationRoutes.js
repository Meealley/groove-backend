const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/integrationcontroller");
const { protect, checkSubscription, checkUsageLimit } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(protect);

// Main Integration Routes
// @route   GET /api/integrations
// @desc    Get all connected integrations
// @access  Private
router.get("/", getIntegrations);

// Service Connection Management
// @route   POST /api/integrations/connect
// @desc    Connect a new service
// @access  Private
router.post("/connect", checkUsageLimit("integrations"), connectService);

// @route   DELETE /api/integrations/:serviceId
// @desc    Disconnect a service
// @access  Private
router.delete("/:serviceId", disconnectService);

// @route   POST /api/integrations/:serviceId/sync
// @desc    Sync service data
// @access  Private
router.post("/:serviceId/sync", syncService);

// API Access Management
// @route   PUT /api/integrations/api-access/enable
// @desc    Enable API access (requires pro plan)
// @access  Private
router.put("/api-access/enable", checkSubscription("pro"), enableAPIAccess);

// @route   PUT /api/integrations/api-access/disable
// @desc    Disable API access
// @access  Private
router.put("/api-access/disable", disableAPIAccess);

// API Key Management
// @route   GET /api/integrations/api-keys
// @desc    Get API keys
// @access  Private
router.get("/api-keys", getAPIKeys);

// @route   POST /api/integrations/api-keys
// @desc    Create API key
// @access  Private
router.post("/api-keys", createAPIKey);

// @route   DELETE /api/integrations/api-keys/:keyName
// @desc    Revoke API key
// @access  Private
router.delete("/api-keys/:keyName", revokeAPIKey);

// Webhook Management
// @route   GET /api/integrations/webhooks
// @desc    Get webhooks
// @access  Private
router.get("/webhooks", getWebhooks);

// @route   POST /api/integrations/webhooks
// @desc    Create webhook (requires pro plan)
// @access  Private
router.post("/webhooks", checkSubscription("pro"), createWebhook);

// @route   PUT /api/integrations/webhooks/:webhookUrl
// @desc    Update webhook
// @access  Private
router.put("/webhooks/:webhookUrl", updateWebhook);

// @route   DELETE /api/integrations/webhooks/:webhookUrl
// @desc    Delete webhook
// @access  Private
router.delete("/webhooks/:webhookUrl", deleteWebhook);

module.exports = router;