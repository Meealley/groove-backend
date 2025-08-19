const asyncHandler = require("express-async-handler");

// ===================================================================
// TASK VALIDATION MIDDLEWARE
// ===================================================================

// Validate task creation
const taskValidation = asyncHandler(async (req, res, next) => {
  const { title, description, estimatedDuration, deadline, dueDate } = req.body;
  const errors = {};

  // Title validation
  if (!title || title.trim().length === 0) {
    errors.title = "Task title is required";
  } else if (title.trim().length > 200) {
    errors.title = "Task title must be less than 200 characters";
  }

  // Description validation
  if (description && description.length > 2000) {
    errors.description = "Description must be less than 2000 characters";
  }

  // Duration validation
  if (estimatedDuration && (estimatedDuration < 1 || estimatedDuration > 1440)) {
    errors.estimatedDuration = "Estimated duration must be between 1 and 1440 minutes (24 hours)";
  }

  // Date validations
  if (deadline && new Date(deadline) < new Date()) {
    errors.deadline = "Deadline cannot be in the past";
  }

  if (dueDate && new Date(dueDate) < new Date()) {
    errors.dueDate = "Due date cannot be in the past";
  }

  // Check if both deadline and dueDate are provided and deadline is before dueDate
  if (deadline && dueDate && new Date(deadline) > new Date(dueDate)) {
    errors.dates = "Deadline cannot be after due date";
  }

  // If there are validation errors, return them
  if (Object.keys(errors).length > 0) {
    res.status(400);
    const errorMessage = Object.values(errors).join(", ");
    throw new Error(errorMessage);
  }

  // Sanitize and enhance data
  req.body.title = title.trim();
  if (description) req.body.description = description.trim();
  
  // Add AI enhancement flag if user has AI enabled
  if (req.user && req.user.aiPreferences?.features?.taskSuggestions) {
    req.body.enableAIEnhancement = true;
  }

  next();
});

// Validate task updates
const validateTaskUpdate = asyncHandler(async (req, res, next) => {
  const { title, description, estimatedDuration, progress } = req.body;
  const errors = {};

  // Title validation (if provided)
  if (title !== undefined) {
    if (!title || title.trim().length === 0) {
      errors.title = "Task title cannot be empty";
    } else if (title.trim().length > 200) {
      errors.title = "Task title must be less than 200 characters";
    } else {
      req.body.title = title.trim();
    }
  }

  // Description validation (if provided)
  if (description !== undefined && description.length > 2000) {
    errors.description = "Description must be less than 2000 characters";
  }

  // Duration validation (if provided)
  if (estimatedDuration !== undefined && (estimatedDuration < 1 || estimatedDuration > 1440)) {
    errors.estimatedDuration = "Estimated duration must be between 1 and 1440 minutes";
  }

  // Progress validation (if provided)
  if (progress !== undefined && (progress < 0 || progress > 100)) {
    errors.progress = "Progress must be between 0 and 100";
  }

  // If there are validation errors, return them
  if (Object.keys(errors).length > 0) {
    res.status(400);
    const errorMessage = Object.values(errors).join(", ");
    throw new Error(errorMessage);
  }

  next();
});

// Validate bulk operations
const validateBulkOperation = asyncHandler(async (req, res, next) => {
  const { task_ids, operation, data } = req.body;
  const errors = {};

  // Task IDs validation
  if (!task_ids || !Array.isArray(task_ids) || task_ids.length === 0) {
    errors.task_ids = "At least one task ID is required";
  } else if (task_ids.length > 50) {
    errors.task_ids = "Cannot update more than 50 tasks at once";
  }

  // Operation validation
  const allowedOperations = [
    'update_priority', 
    'update_category', 
    'update_status', 
    'add_tags', 
    'remove_tags',
    'mark_complete',
    'update_deadline',
    'archive'
  ];
  
  if (!operation || !allowedOperations.includes(operation)) {
    errors.operation = `Operation must be one of: ${allowedOperations.join(', ')}`;
  }

  // Data validation based on operation
  if (operation === 'update_priority' && (!data.priority || !['low', 'medium', 'high', 'urgent'].includes(data.priority))) {
    errors.data = "Priority must be one of: low, medium, high, urgent";
  }

  if (operation === 'update_deadline' && (!data.deadline || new Date(data.deadline) < new Date())) {
    errors.data = "Deadline must be a valid future date";
  }

  // If there are validation errors, return them
  if (Object.keys(errors).length > 0) {
    res.status(400);
    const errorMessage = Object.values(errors).join(", ");
    throw new Error(errorMessage);
  }

  next();
});

// Validate reminder creation
const validateReminder = asyncHandler(async (req, res, next) => {
  const { date, type, message, location } = req.body;
  const errors = {};

  // Date validation
  if (!date || new Date(date) < new Date()) {
    errors.date = "Reminder date must be in the future";
  }

  // Type validation
  const allowedTypes = ['time', 'location', 'smart'];
  if (!type || !allowedTypes.includes(type)) {
    errors.type = `Reminder type must be one of: ${allowedTypes.join(', ')}`;
  }

  // Location validation for location-based reminders
  if (type === 'location') {
    if (!location || !location.coordinates || location.coordinates.length !== 2) {
      errors.location = "Location reminders require valid coordinates [longitude, latitude]";
    }
    
    if (!location.name || location.name.trim().length === 0) {
      errors.location = "Location reminders require a location name";
    }
  }

  // Message validation
  if (message && message.length > 500) {
    errors.message = "Reminder message must be less than 500 characters";
  }

  // If there are validation errors, return them
  if (Object.keys(errors).length > 0) {
    res.status(400);
    const errorMessage = Object.values(errors).join(", ");
    throw new Error(errorMessage);
  }

  next();
});

// Validate AI feedback
const validateAIFeedback = asyncHandler(async (req, res, next) => {
  const { feedback_type, rating, suggestion_id } = req.body;
  const errors = {};

  // Suggestion ID validation
  if (!suggestion_id) {
    errors.suggestion_id = "Suggestion ID is required";
  }

  // Feedback type validation
  const allowedFeedbackTypes = ['accept', 'dismiss', 'helpful', 'not_helpful', 'irrelevant'];
  if (!feedback_type || !allowedFeedbackTypes.includes(feedback_type)) {
    errors.feedback_type = `Feedback type must be one of: ${allowedFeedbackTypes.join(', ')}`;
  }

  // Rating validation (if provided)
  if (rating !== undefined && (rating < 1 || rating > 5 || !Number.isInteger(rating))) {
    errors.rating = "Rating must be an integer between 1 and 5";
  }

  // If there are validation errors, return them
  if (Object.keys(errors).length > 0) {
    res.status(400);
    const errorMessage = Object.values(errors).join(", ");
    throw new Error(errorMessage);
  }

  next();
});

// Validate export parameters
const validateExport = asyncHandler(async (req, res, next) => {
  const { format, date_range, include_completed } = req.query;
  const errors = {};

  // Format validation
  const allowedFormats = ['json', 'csv', 'xlsx', 'pdf'];
  if (format && !allowedFormats.includes(format.toLowerCase())) {
    errors.format = `Export format must be one of: ${allowedFormats.join(', ')}`;
  }

  // Date range validation
  if (date_range) {
    const allowedRanges = ['7days', '30days', '90days', '1year', 'all'];
    if (!allowedRanges.includes(date_range)) {
      errors.date_range = `Date range must be one of: ${allowedRanges.join(', ')}`;
    }
  }

  // Include completed validation
  if (include_completed && !['true', 'false'].includes(include_completed.toLowerCase())) {
    errors.include_completed = "include_completed must be 'true' or 'false'";
  }

  // If there are validation errors, return them
  if (Object.keys(errors).length > 0) {
    res.status(400);
    const errorMessage = Object.values(errors).join(", ");
    throw new Error(errorMessage);
  }

  next();
});

// ===================================================================
// MIDDLEWARE FOR CHECKING TASK OWNERSHIP
// ===================================================================

const checkTaskOwnership = asyncHandler(async (req, res, next) => {
  const Task = require("../models/TaskModel");
  
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      res.status(404);
      throw new Error("Task not found");
    }
    
    // Check if user owns the task or has permission to access it
    if (task.user.toString() !== req.user._id.toString()) {
      // Check if user has team access to this task
      const hasTeamAccess = req.user.team.teams.some(team => 
        team.permissions.includes('view_all_tasks') || 
        team.permissions.includes('edit_all_tasks')
      );
      
      if (!hasTeamAccess) {
        res.status(403);
        throw new Error("Not authorized to access this task");
      }
    }
    
    // Attach task to request for use in controller
    req.task = task;
    next();
    
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(400);
      throw new Error("Invalid task ID format");
    }
    throw error;
  }
});

// ===================================================================
// RATE LIMITING FOR AI FEATURES
// ===================================================================

const checkAIUsageLimit = asyncHandler(async (req, res, next) => {
  const user = req.user;
  
  // Check if user has exceeded AI usage limits
  const currentMonth = new Date().getMonth();
  const lastResetMonth = user.subscription.usage.lastResetDate ? 
    new Date(user.subscription.usage.lastResetDate).getMonth() : currentMonth;
  
  // Reset monthly usage if it's a new month
  if (currentMonth !== lastResetMonth) {
    await user.resetMonthlyUsage();
  }
  
  // Check AI suggestions limit
  const aiLimit = user.subscription.limits.aiSuggestions;
  const aiUsed = user.subscription.usage.aiSuggestionsUsed;
  
  if (aiUsed >= aiLimit) {
    return res.status(429).json({
      success: false,
      message: "AI usage limit reached for this month",
      data: {
        limit: aiLimit,
        used: aiUsed,
        reset_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        upgrade_suggestion: "Consider upgrading your plan for more AI features"
      }
    });
  }
  
  // Increment usage counter
  user.subscription.usage.aiSuggestionsUsed += 1;
  await user.save();
  
  next();
});

// ===================================================================
// SMART VALIDATION BASED ON USER PREFERENCES
// ===================================================================

const enhanceWithUserPreferences = asyncHandler(async (req, res, next) => {
  const user = req.user;
  
  // Auto-fill missing fields based on user preferences
  if (!req.body.priority) {
    req.body.priority = user.workPreferences.tasks.defaultPriority;
  }
  
  // Apply estimation buffer if user has it configured
  if (req.body.estimatedDuration && user.workPreferences.tasks.defaultEstimationBuffer) {
    const buffer = user.workPreferences.tasks.defaultEstimationBuffer / 100;
    req.body.suggestedDuration = Math.round(req.body.estimatedDuration * (1 + buffer));
  }
  
  // Set auto-schedule preference
  if (user.workPreferences.tasks.autoSchedule && !req.body.hasOwnProperty('autoSchedule')) {
    req.body.autoSchedule = true;
  }
  
  next();
});

module.exports = {
  taskValidation,
  validateTaskUpdate,
  validateBulkOperation,
  validateReminder,
  validateAIFeedback,
  validateExport,
  checkTaskOwnership,
  checkAIUsageLimit,
  enhanceWithUserPreferences
};