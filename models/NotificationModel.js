const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Related entities
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
    },
    // Notification type and category
    type: {
      type: String,
      enum: [
        "task_reminder",
        "deadline_warning",
        "task_overdue",
        "schedule_reminder",
        "dependency_ready",
        "smart_suggestion",
        "achievement",
        "weekly_summary",
        "location_reminder",
        "context_suggestion",
        "collaboration_update",
        "system_notification"
      ],
      required: true,
    },
    category: {
      type: String,
      enum: ["reminder", "warning", "information", "achievement", "urgent"],
      default: "information",
    },
    // Notification content
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    // Rich content for enhanced notifications
    richContent: {
      // Action buttons
      actions: [{
        label: String,
        action: {
          type: String,
          enum: ["complete_task", "snooze", "reschedule", "view_task", "dismiss", "custom"],
        },
        actionData: Object, // Additional data for the action
        style: {
          type: String,
          enum: ["primary", "secondary", "danger", "success"],
          default: "secondary",
        },
      }],
      // Progress information
      progress: {
        current: Number,
        total: Number,
        unit: String,
      },
      // Visual elements
      visual: {
        icon: String,
        color: String,
        image: String,
      },
      // Data for interactive elements
      interactive: {
        canSnooze: Boolean,
        snoozeOptions: [Number], // minutes
        canReschedule: Boolean,
        quickActions: [String],
      },
    },
    // Scheduling and timing
    scheduledFor: {
      type: Date,
      required: true,
    },
    sentAt: Date,
    // Delivery preferences
    delivery: {
      // Delivery channels
      channels: [{
        type: {
          type: String,
          enum: ["in_app", "email", "push", "sms", "webhook"],
        },
        enabled: {
          type: Boolean,
          default: true,
        },
        delivered: {
          type: Boolean,
          default: false,
        },
        deliveredAt: Date,
        failureReason: String,
      }],
      // Priority affects delivery method
      priority: {
        type: String,
        enum: ["low", "normal", "high", "urgent"],
        default: "normal",
      },
      // Retry configuration
      retryConfig: {
        maxRetries: {
          type: Number,
          default: 3,
        },
        retryInterval: {
          type: Number,
          default: 300, // 5 minutes
        },
        currentRetries: {
          type: Number,
          default: 0,
        },
      },
    },
    // Location-based notifications
    location: {
      enabled: {
        type: Boolean,
        default: false,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere",
      },
      radius: {
        type: Number,
        default: 100, // meters
      },
      triggerType: {
        type: String,
        enum: ["enter", "exit", "both"],
        default: "enter",
      },
      triggered: {
        type: Boolean,
        default: false,
      },
    },
    // Context-aware settings
    context: {
      // Time-based conditions
      timeConditions: {
        allowedHours: {
          start: String, // "09:00"
          end: String,   // "18:00"
        },
        allowedDays: [Number], // 0-6 for Sunday-Saturday
        timezone: String,
      },
      // User state conditions
      userConditions: {
        onlyWhenActive: Boolean,
        respectDoNotDisturb: Boolean,
        skipIfInMeeting: Boolean,
      },
      // Device conditions
      deviceConditions: {
        preferredDevices: [String],
        requireOnline: Boolean,
      },
    },
    // Smart features
    smart: {
      // AI-generated content
      isAIGenerated: {
        type: Boolean,
        default: false,
      },
      // Personalization score
      personalizationScore: {
        type: Number,
        min: 0,
        max: 1,
      },
      // Learning from user interactions
      interactionLearning: {
        opened: {
          type: Boolean,
          default: false,
        },
        openedAt: Date,
        clicked: {
          type: Boolean,
          default: false,
        },
        dismissed: {
          type: Boolean,
          default: false,
        },
        dismissedAt: Date,
        snoozed: {
          type: Boolean,
          default: false,
        },
        snoozeCount: {
          type: Number,
          default: 0,
        },
        actionTaken: String,
      },
      // Effectiveness tracking
      effectiveness: {
        led_to_action: Boolean,
        user_satisfaction: Number, // 1-5
        timing_score: Number, // How well-timed was this notification
      },
    },
    // Status and state
    status: {
      type: String,
      enum: [
        "scheduled",   // Waiting to be sent
        "sent",        // Successfully sent
        "delivered",   // Confirmed delivery
        "read",        // User opened/read
        "acted_upon",  // User took action
        "dismissed",   // User dismissed
        "failed",      // Delivery failed
        "cancelled",   // Cancelled before sending
        "expired"      // Expired without delivery
      ],
      default: "scheduled",
    },
    // Recurring notifications
    recurring: {
      isRecurring: {
        type: Boolean,
        default: false,
      },
      pattern: {
        type: String,
        enum: ["daily", "weekly", "monthly", "custom"],
      },
      interval: Number,
      nextScheduled: Date,
      endDate: Date,
      maxOccurrences: Number,
      currentOccurrence: {
        type: Number,
        default: 1,
      },
    },
    // Grouping and batching
    grouping: {
      // Group ID for batching related notifications
      groupId: String,
      // Whether this can be batched with others
      batchable: {
        type: Boolean,
        default: true,
      },
      // Batching preferences
      batchSettings: {
        maxBatchSize: {
          type: Number,
          default: 5,
        },
        batchDelay: {
          type: Number,
          default: 300, // 5 minutes
        },
      },
    },
    // Error handling and debugging
    errors: [{
      timestamp: Date,
      error: String,
      channel: String,
      retryCount: Number,
    }],
    // Metadata for analytics
    metadata: {
      source: String, // Where this notification originated
      campaign: String, // For A/B testing different notification strategies
      version: String, // Notification template version
      tags: [String], // For categorization and filtering
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ user: 1, scheduledFor: 1 });
notificationSchema.index({ user: 1, status: 1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });
notificationSchema.index({ "location.coordinates": "2dsphere" });
notificationSchema.index({ "grouping.groupId": 1 });

// Method to schedule a notification
notificationSchema.statics.scheduleNotification = async function(notificationData) {
  const notification = new this(notificationData);
  
  // Set default channels based on priority
  if (!notification.delivery.channels || notification.delivery.channels.length === 0) {
    notification.delivery.channels = [];
    
    switch (notification.delivery.priority) {
      case "urgent":
        notification.delivery.channels.push(
          { type: "push", enabled: true },
          { type: "in_app", enabled: true },
          { type: "email", enabled: true }
        );
        break;
      case "high":
        notification.delivery.channels.push(
          { type: "push", enabled: true },
          { type: "in_app", enabled: true }
        );
        break;
      case "normal":
        notification.delivery.channels.push(
          { type: "in_app", enabled: true }
        );
        break;
      case "low":
        notification.delivery.channels.push(
          { type: "in_app", enabled: true }
        );
        break;
    }
  }
  
  await notification.save();
  return notification;
};

// Method to send notification
notificationSchema.methods.send = async function() {
  if (this.status !== "scheduled") {
    throw new Error("Notification is not in scheduled status");
  }
  
  // Check time conditions
  if (!this.checkTimeConditions()) {
    // Reschedule for next available time
    await this.rescheduleForNextAvailableTime();
    return;
  }
  
  // Check user conditions
  if (!await this.checkUserConditions()) {
    // Delay by 15 minutes and retry
    this.scheduledFor = new Date(Date.now() + 15 * 60 * 1000);
    return this.save();
  }
  
  let allDelivered = true;
  
  // Send through each enabled channel
  for (const channel of this.delivery.channels) {
    if (!channel.enabled) continue;
    
    try {
      await this.sendToChannel(channel);
      channel.delivered = true;
      channel.deliveredAt = new Date();
    } catch (error) {
      channel.failureReason = error.message;
      allDelivered = false;
      
      this.errors.push({
        timestamp: new Date(),
        error: error.message,
        channel: channel.type,
        retryCount: this.delivery.retryConfig.currentRetries,
      });
    }
  }
  
  if (allDelivered) {
    this.status = "sent";
    this.sentAt = new Date();
  } else {
    // Schedule retry if not exceeded max retries
    if (this.delivery.retryConfig.currentRetries < this.delivery.retryConfig.maxRetries) {
      this.delivery.retryConfig.currentRetries++;
      this.scheduledFor = new Date(Date.now() + this.delivery.retryConfig.retryInterval * 1000);
    } else {
      this.status = "failed";
    }
  }
  
  return this.save();
};

// Helper method to send to specific channel
notificationSchema.methods.sendToChannel = async function(channel) {
  switch (channel.type) {
    case "in_app":
      // In-app notifications are stored in database and shown in UI
      return true;
      
    case "push":
      // Integrate with push notification service (Firebase, etc.)
      return this.sendPushNotification();
      
    case "email":
      // Integrate with email service
      return this.sendEmailNotification();
      
    case "sms":
      // Integrate with SMS service
      return this.sendSMSNotification();
      
    case "webhook":
      // Send to webhook URL
      return this.sendWebhookNotification();
      
    default:
      throw new Error(`Unsupported channel type: ${channel.type}`);
  }
};

// Method to check time conditions
notificationSchema.methods.checkTimeConditions = function() {
  if (!this.context.timeConditions) return true;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  
  // Check allowed hours
  if (this.context.timeConditions.allowedHours) {
    const startHour = parseInt(this.context.timeConditions.allowedHours.start.split(':')[0]);
    const endHour = parseInt(this.context.timeConditions.allowedHours.end.split(':')[0]);
    
    if (currentHour < startHour || currentHour >= endHour) {
      return false;
    }
  }
  
  // Check allowed days
  if (this.context.timeConditions.allowedDays && 
      this.context.timeConditions.allowedDays.length > 0) {
    if (!this.context.timeConditions.allowedDays.includes(currentDay)) {
      return false;
    }
  }
  
  return true;
};

// Method to check user conditions
notificationSchema.methods.checkUserConditions = async function() {
  if (!this.context.userConditions) return true;
  
  // Check if user is in do-not-disturb mode
  if (this.context.userConditions.respectDoNotDisturb) {
    const User = mongoose.model('User');
    const user = await User.findById(this.user);
    
    if (user && user.settings && user.settings.doNotDisturb) {
      return false;
    }
  }
  
  // Check if user is in a meeting
  if (this.context.userConditions.skipIfInMeeting) {
    const Schedule = mongoose.model('Schedule');
    const now = new Date();
    
    const currentMeeting = await Schedule.findOne({
      user: this.user,
      scheduledStart: { $lte: now },
      scheduledEnd: { $gte: now },
      'timeBlock.blockType': 'collaboration',
    });
    
    if (currentMeeting) {
      return false;
    }
  }
  
  return true;
};

// Method to reschedule for next available time
notificationSchema.methods.rescheduleForNextAvailableTime = async function() {
  if (!this.context.timeConditions || !this.context.timeConditions.allowedHours) {
    // Default to 1 hour later
    this.scheduledFor = new Date(Date.now() + 60 * 60 * 1000);
    return this.save();
  }
  
  const startHour = parseInt(this.context.timeConditions.allowedHours.start.split(':')[0]);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(startHour, 0, 0, 0);
  
  this.scheduledFor = tomorrow;
  return this.save();
};

// Method to handle user interaction
notificationSchema.methods.recordInteraction = function(interactionType, data = {}) {
  this.smart.interactionLearning[interactionType] = true;
  
  switch (interactionType) {
    case "opened":
      this.smart.interactionLearning.openedAt = new Date();
      this.status = "read";
      break;
    case "clicked":
      this.smart.interactionLearning.actionTaken = data.action;
      this.status = "acted_upon";
      break;
    case "dismissed":
      this.smart.interactionLearning.dismissedAt = new Date();
      this.status = "dismissed";
      break;
    case "snoozed":
      this.smart.interactionLearning.snoozeCount++;
      this.scheduledFor = new Date(Date.now() + (data.snoozeMinutes || 15) * 60 * 1000);
      this.status = "scheduled";
      break;
  }
  
  return this.save();
};

// Method to generate smart suggestions for notification content
notificationSchema.statics.generateSmartContent = async function(userId, type, entityId) {
  const Task = mongoose.model('Task');
  const UserPattern = mongoose.model('UserPattern');
  
  const userPattern = await UserPattern.findOne({ user: userId });
  
  let content = {};
  
  switch (type) {
    case "task_reminder":
      const task = await Task.findById(entityId);
      content = {
        title: `Time to work on: ${task.title}`,
        message: `Your task "${task.title}" is scheduled now.`,
        richContent: {
          actions: [
            {
              label: "Start Task",
              action: "view_task",
              actionData: { taskId: entityId },
              style: "primary",
            },
            {
              label: "Snooze 15m",
              action: "snooze",
              actionData: { minutes: 15 },
              style: "secondary",
            },
          ],
          interactive: {
            canSnooze: true,
            snoozeOptions: [15, 30, 60, 120],
            quickActions: ["complete_task", "reschedule"],
          },
        },
      };
      break;
      
    case "deadline_warning":
      const deadlineTask = await Task.findById(entityId);
      const hoursUntilDeadline = Math.ceil((deadlineTask.deadline - new Date()) / (1000 * 60 * 60));
      
      content = {
        title: `Deadline Alert: ${deadlineTask.title}`,
        message: `Your task "${deadlineTask.title}" is due in ${hoursUntilDeadline} hours.`,
        richContent: {
          visual: {
            icon: "warning",
            color: "#ff9500",
          },
          actions: [
            {
              label: "Work on it now",
              action: "view_task",
              actionData: { taskId: entityId },
              style: "danger",
            },
            {
              label: "Reschedule",
              action: "reschedule",
              actionData: { taskId: entityId },
              style: "secondary",
            },
          ],
        },
      };
      break;
      
    case "smart_suggestion":
      content = {
        title: "Smart Suggestion",
        message: "Based on your patterns, now might be a good time for focused work.",
        richContent: {
          visual: {
            icon: "lightbulb",
            color: "#007bff",
          },
          actions: [
            {
              label: "Show suggestions",
              action: "view_suggestions",
              style: "primary",
            },
            {
              label: "Not now",
              action: "dismiss",
              style: "secondary",
            },
          ],
        },
      };
      break;
  }
  
  return content;
};

// Method to batch notifications
notificationSchema.statics.batchNotifications = async function(userId, groupId) {
  const notifications = await this.find({
    user: userId,
    'grouping.groupId': groupId,
    'grouping.batchable': true,
    status: 'scheduled',
  }).limit(5);
  
  if (notifications.length <= 1) return notifications;
  
  // Create a batched notification
  const batchedContent = {
    title: `${notifications.length} pending notifications`,
    message: notifications.map(n => n.title).join(', '),
    richContent: {
      actions: [
        {
          label: "View all",
          action: "view_notifications",
          style: "primary",
        },
        {
          label: "Dismiss all",
          action: "dismiss",
          style: "secondary",
        },
      ],
    },
  };
  
  const batchNotification = new this({
    user: userId,
    type: 'system_notification',
    ...batchedContent,
    scheduledFor: new Date(),
    metadata: {
      source: 'batch_processor',
      batchedNotificationIds: notifications.map(n => n._id),
    },
  });
  
  await batchNotification.save();
  
  // Cancel individual notifications
  await this.updateMany(
    { _id: { $in: notifications.map(n => n._id) } },
    { status: 'cancelled' }
  );
  
  return [batchNotification];
};

// Static method to clean up old notifications
notificationSchema.statics.cleanup = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: { $in: ['delivered', 'read', 'dismissed', 'failed', 'expired'] },
  });
  
  return result.deletedCount;
};

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;