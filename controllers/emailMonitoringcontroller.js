const asyncHandler = require("express-async-handler");
const { getEmailQueueStatus, processEmailQueue } = require("../utils/emailUtils");

// @desc    Get email queue status
// @route   GET /api/admin/email-queue
// @access  Private/Admin
const getQueueStatus = asyncHandler(async (req, res) => {
  const status = getEmailQueueStatus();
  
  res.status(200).json({
    success: true,
    data: status
  });
});

// @desc    Process email queue manually
// @route   POST /api/admin/email-queue/process
// @access  Private/Admin
const processEmailQueueManually = asyncHandler(async (req, res) => {
  try {
    await processEmailQueue();
    
    res.status(200).json({
      success: true,
      message: "Email queue processing triggered"
    });
  } catch (error) {
    res.status(500);
    throw new Error("Failed to process email queue");
  }
});

module.exports = {
  getQueueStatus,
  processEmailQueueManually
};