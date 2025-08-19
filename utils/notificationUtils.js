const User = require("../models/UserModel");
const { 
  sendTaskReminderEmail, 
  sendWeeklyReportEmail,
  sendSubscriptionNotificationEmail 
} = require("./emailUtils");

// Check if user should receive notifications based on their preferences and DND settings
const shouldReceiveNotification = (user, notificationType, channel = 'push') => {
  // Check if user is in do not disturb mode
  if (user.settings.notifications.doNotDisturb.enabled) {
    const now = user.getCurrentTime();
    const currentTime = now.toTimeString().slice(0, 5);
    const dnd = user.settings.notifications.doNotDisturb;
    
    // Check weekend-only setting
    if (dnd.weekendsOnly) {
      const dayOfWeek = now.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        return false;
      }
    }
    
    // Check time range
    if (dnd.start && dnd.end) {
      if (dnd.start <= dnd.end) {
        if (currentTime >= dnd.start && currentTime <= dnd.end) {
          return false;
        }
      } else {
        if (currentTime >= dnd.start || currentTime <= dnd.end) {
          return false;
        }
      }
    }
  }
  
  // Check notification preferences for the specific type and channel
  const notifications = user.settings.notifications;
  
  if (channel === 'email' && notifications.email[notificationType] !== undefined) {
    return notifications.email[notificationType];
  }
  
  if (channel === 'push' && notifications.push[notificationType] !== undefined) {
    return notifications.push[notificationType];
  }
  
  if (channel === 'inApp' && notifications.inApp[notificationType] !== undefined) {
    return notifications.inApp[notificationType];
  }
  
  return true; // Default to sending notification if not explicitly disabled
};

// Send push notification (would integrate with push notification service)
const sendPushNotification = async (user, title, body, data = {}) => {
  try {
    if (!shouldReceiveNotification(user, 'taskReminders', 'push')) {
      return;
    }
    
    // Here you would integrate with a push notification service like:
    // - Firebase Cloud Messaging (FCM)
    // - Apple Push Notification Service (APNS)
    // - OneSignal
    // - Pusher
    
    console.log(`Push notification sent to ${user.email}:`, { title, body, data });
    
    // Example FCM implementation:
    /*
    const admin = require('firebase-admin');
    
    const message = {
      notification: { title, body },
      data,
      token: user.fcmToken // You'd store this in the user model
    };
    
    await admin.messaging().send(message);
    */
    
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

// Send in-app notification (would store in database for real-time display)
const sendInAppNotification = async (userId, notification) => {
  try {
    const user = await User.findById(userId);
    
    if (!shouldReceiveNotification(user, notification.type, 'inApp')) {
      return;
    }
    
    // Here you would typically:
    // 1. Store the notification in a notifications collection
    // 2. Send via WebSocket/Server-Sent Events for real-time delivery
    // 3. Store in Redis for fast retrieval
    
    console.log(`In-app notification for ${user.email}:`, notification);
    
    // Example implementation:
    /*
    const Notification = require('../models/NotificationModel');
    
    await Notification.create({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: false,
      createdAt: new Date()
    });
    
    // Send via WebSocket
    const io = require('../socket');
    io.to(userId).emit('notification', notification);
    */
    
  } catch (error) {
    console.error('Error sending in-app notification:', error);
  }
};

// Send task reminder notifications
const sendTaskReminders = async (userId, tasks) => {
  try {
    const user = await User.findById(userId);
    
    if (!user || tasks.length === 0) {
      return;
    }
    
    // Send email reminder
    if (shouldReceiveNotification(user, 'taskReminders', 'email')) {
      await sendTaskReminderEmail(user, tasks);
    }
    
    // Send push notification
    if (shouldReceiveNotification(user, 'taskReminders', 'push')) {
      const title = "Task Reminders";
      const body = `You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} scheduled for today`;
      
      await sendPushNotification(user, title, body, {
        type: 'task_reminder',
        taskCount: tasks.length
      });
    }
    
    // Send in-app notification
    await sendInAppNotification(userId, {
      type: 'taskReminders',
      title: 'Task Reminders',
      message: `You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} scheduled for today`,
      data: { tasks: tasks.map(t => t._id) }
    });
    
  } catch (error) {
    console.error('Error sending task reminders:', error);
  }
};

// Send deadline warning notifications
const sendDeadlineWarning = async (userId, task, hoursUntilDeadline) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return;
    }
    
    const warningMessage = `Task "${task.title}" is due in ${hoursUntilDeadline} hours`;
    
    // Send email warning
    if (shouldReceiveNotification(user, 'deadlineWarnings', 'email')) {
      // You could create a specific deadline warning email template
      console.log(`Deadline warning email would be sent to ${user.email}`);
    }
    
    // Send push notification
    if (shouldReceiveNotification(user, 'deadlineWarnings', 'push')) {
      await sendPushNotification(user, "Deadline Warning ⚠️", warningMessage, {
        type: 'deadline_warning',
        taskId: task._id,
        hoursUntilDeadline
      });
    }
    
    // Send in-app notification
    await sendInAppNotification(userId, {
      type: 'deadlineWarnings',
      title: 'Deadline Warning',
      message: warningMessage,
      data: { taskId: task._id, hoursUntilDeadline }
    });
    
  } catch (error) {
    console.error('Error sending deadline warning:', error);
  }
};

// Send achievement notification
const sendAchievementNotification = async (userId, achievement) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return;
    }
    
    const message = `🏆 Achievement unlocked: ${achievement.name}!`;
    
    // Send push notification
    if (shouldReceiveNotification(user, 'achievements', 'push')) {
      await sendPushNotification(user, "Achievement Unlocked! 🏆", achievement.name, {
        type: 'achievement',
        achievementId: achievement._id
      });
    }
    
    // Send in-app notification (achievements are usually always shown)
    await sendInAppNotification(userId, {
      type: 'achievements',
      title: 'Achievement Unlocked!',
      message: achievement.name,
      data: { achievement }
    });
    
  } catch (error) {
    console.error('Error sending achievement notification:', error);
  }
};

// Send subscription-related notifications
const sendSubscriptionNotification = async (userId, type, details = {}) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return;
    }
    
    // Send email notification
    await sendSubscriptionNotificationEmail(user, type, details);
    
    // Send in-app notification
    let title = '';
    let message = '';
    
    switch (type) {
      case 'upgraded':
        title = 'Subscription Upgraded';
        message = `Welcome to the ${details.plan} plan!`;
        break;
      case 'cancelled':
        title = 'Subscription Cancelled';
        message = 'Your subscription has been cancelled';
        break;
      case 'trial_ending':
        title = 'Trial Ending Soon';
        message = `Your trial ends in ${details.daysLeft} days`;
        break;
      case 'payment_failed':
        title = 'Payment Failed';
        message = 'Please update your payment method';
        break;
    }
    
    await sendInAppNotification(userId, {
      type: 'subscription',
      title,
      message,
      data: details
    });
    
  } catch (error) {
    console.error('Error sending subscription notification:', error);
  }
};

// Send team-related notifications
const sendTeamNotification = async (userId, type, details = {}) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return;
    }
    
    let title = '';
    let message = '';
    
    switch (type) {
      case 'invited':
        title = 'Team Invitation';
        message = `You've been invited to join ${details.teamName}`;
        break;
      case 'added':
        title = 'Added to Team';
        message = `You've been added to ${details.teamName}`;
        break;
      case 'role_changed':
        title = 'Role Updated';
        message = `Your role in ${details.teamName} has been updated to ${details.newRole}`;
        break;
      case 'removed':
        title = 'Removed from Team';
        message = `You've been removed from ${details.teamName}`;
        break;
    }
    
    // Send email if enabled
    if (shouldReceiveNotification(user, 'teamUpdates', 'email')) {
      console.log(`Team notification email would be sent to ${user.email}`);
    }
    
    // Send push notification
    if (shouldReceiveNotification(user, 'teamUpdates', 'push')) {
      await sendPushNotification(user, title, message, {
        type: 'team',
        ...details
      });
    }
    
    // Send in-app notification
    await sendInAppNotification(userId, {
      type: 'teamUpdates',
      title,
      message,
      data: details
    });
    
  } catch (error) {
    console.error('Error sending team notification:', error);
  }
};

// Send smart suggestions
const sendSmartSuggestion = async (userId, suggestion) => {
  try {
    const user = await User.findById(userId);
    
    if (!user || !user.aiPreferences.features.taskSuggestions) {
      return;
    }
    
    // Send push notification if enabled
    if (shouldReceiveNotification(user, 'smartSuggestions', 'push')) {
      await sendPushNotification(user, "Smart Suggestion 💡", suggestion.message, {
        type: 'smart_suggestion',
        suggestionId: suggestion.id
      });
    }
    
    // Send in-app notification
    await sendInAppNotification(userId, {
      type: 'smartSuggestions',
      title: 'Smart Suggestion',
      message: suggestion.message,
      data: suggestion
    });
    
  } catch (error) {
    console.error('Error sending smart suggestion:', error);
  }
};

// Bulk notification sender for system-wide notifications
const sendBulkNotification = async (userIds, notification) => {
  try {
    const promises = userIds.map(userId => 
      sendInAppNotification(userId, notification)
    );
    
    await Promise.allSettled(promises);
    console.log(`Bulk notification sent to ${userIds.length} users`);
    
  } catch (error) {
    console.error('Error sending bulk notification:', error);
  }
};

// Schedule notifications (would typically use a job queue like Bull or Agenda)
const scheduleNotification = async (userId, notification, scheduledFor) => {
  try {
    // Here you would typically add to a job queue
    console.log(`Notification scheduled for ${scheduledFor}:`, notification);
    
    // Example with node-cron or agenda.js:
    /*
    const agenda = require('../jobs/agenda');
    
    await agenda.schedule(scheduledFor, 'send notification', {
      userId,
      notification
    });
    */
    
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

module.exports = {
  shouldReceiveNotification,
  sendPushNotification,
  sendInAppNotification,
  sendTaskReminders,
  sendDeadlineWarning,
  sendAchievementNotification,
  sendSubscriptionNotification,
  sendTeamNotification,
  sendSmartSuggestion,
  sendBulkNotification,
  scheduleNotification
};