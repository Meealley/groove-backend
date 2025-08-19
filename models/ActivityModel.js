const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    // Actor who performed the action
    actor: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: String, // Cached name for performance
      avatar: String, // Cached avatar for performance
      role: String, // Role at time of action
    },
    
    // Action details
    action: {
      type: {
        type: String,
        enum: [
          // Task actions
          "task_created",
          "task_updated", 
          "task_completed",
          "task_deleted",
          "task_assigned",
          "task_unassigned",
          "task_priority_changed",
          "task_status_changed",
          "task_deadline_changed",
          "task_moved",
          "task_commented",
          "task_subtask_added",
          "task_attachment_added",
          
          // Project actions
          "project_created",
          "project_updated",
          "project_completed",
          "project_archived",
          "project_member_added",
          "project_member_removed",
          "project_milestone_completed",
          "project_budget_updated",
          "project_risk_added",
          
          // Goal actions
          "goal_created",
          "goal_updated",
          "goal_completed",
          "goal_progress_updated",
          "goal_milestone_reached",
          
          // Team actions
          "team_created",
          "team_member_joined",
          "team_member_left",
          "team_role_changed",
          
          // Time tracking actions
          "time_started",
          "time_stopped",
          "time_logged",
          
          // Collaboration actions
          "comment_added",
          "comment_updated",
          "comment_deleted",
          "mention_created",
          "reaction_added",
          "file_shared",
          
          // System actions
          "user_login",
          "user_logout",
          "integration_connected",
          "workflow_triggered",
          "notification_sent",
          "report_generated",
          
          // Custom actions
          "custom_action"
        ],
        required: true,
      },
      
      // Human-readable description
      description: {
        type: String,
        required: true,
      },
      
      // Action category for grouping
      category: {
        type: String,
        enum: [
          "task_management",
          "project_management",
          "goal_tracking",
          "team_collaboration", 
          "time_tracking",
          "communication",
          "system",
          "user",
          "integration",
          "custom"
        ],
        required: true,
      },
      
      // Severity/importance of the action
      severity: {
        type: String,
        enum: ["info", "low", "medium", "high", "critical"],
        default: "info",
      },
    },
    
    // Target entity that was acted upon
    target: {
      entityType: {
        type: String,
        enum: [
          "task",
          "project", 
          "goal",
          "team",
          "user",
          "comment",
          "file",
          "time_entry",
          "notification",
          "integration",
          "workflow",
          "category",
          "tag",
          "template",
          "custom"
        ],
        required: true,
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      entityName: String, // Cached name for performance
      
      // Parent entity context
      parent: {
        entityType: String,
        entityId: mongoose.Schema.Types.ObjectId,
        entityName: String,
      },
    },
    
    // Changes made (for update actions)
    changes: [{
      field: {
        type: String,
        required: true,
      },
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
      // Display-friendly versions
      oldValueDisplay: String,
      newValueDisplay: String,
    }],
    
    // Context and metadata
    context: {
      // Request context
      request: {
        ip: String,
        userAgent: String,
        platform: String, // web, mobile, api
        source: String, // which part of app triggered this
        sessionId: String,
      },
      
      // Business context
      business: {
        workspace: String,
        team: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Team",
        },
        project: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Project",
        },
        tags: [String],
      },
      
      // Technical context
      technical: {
        version: String, // App version
        feature: String, // Feature that triggered action
        integration: String, // If triggered by integration
        automationRule: String, // If triggered by automation
        apiVersion: String,
      },
    },
    
    // Rich content for activities
    content: {
      // Comment/message content
      message: {
        text: String,
        html: String,
        markdown: String,
        mentions: [{
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          name: String,
          position: Number, // Position in text
        }],
        hashtags: [String],
        links: [{
          url: String,
          title: String,
          description: String,
          image: String,
        }],
      },
      
      // File attachments
      attachments: [{
        filename: String,
        url: String,
        size: Number, // bytes
        type: String, // MIME type
        thumbnailUrl: String,
        description: String,
      }],
      
      // Embedded data
      embeds: [{
        type: String, // "image", "video", "document", "chart"
        url: String,
        title: String,
        description: String,
        metadata: Object,
      }],
      
      // Reactions/emoji responses
      reactions: [{
        emoji: String,
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      }],
    },
    
    // Threading for conversations
    thread: {
      // Parent activity (for replies)
      parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Activity",
      },
      
      // Root activity in thread
      root: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Activity",
      },
      
      // Reply count
      replyCount: {
        type: Number,
        default: 0,
      },
      
      // Last reply timestamp
      lastReplyAt: Date,
      
      // Thread participants
      participants: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        joinedAt: Date,
        lastReadAt: Date,
      }],
    },
    
    // Visibility and permissions
    visibility: {
      // Who can see this activity
      level: {
        type: String,
        enum: ["public", "team", "project", "private", "system"],
        default: "team",
      },
      
      // Specific users who can see (if private)
      users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
      
      // Teams who can see
      teams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      }],
      
      // Whether this appears in activity feeds
      showInFeed: {
        type: Boolean,
        default: true,
      },
      
      // Whether this generates notifications
      generateNotifications: {
        type: Boolean,
        default: true,
      },
    },
    
    // Status and lifecycle
    status: {
      type: String,
      enum: ["active", "edited", "deleted", "archived", "hidden"],
      default: "active",
    },
    
    // Edit history
    editHistory: [{
      editedAt: Date,
      editedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reason: String,
      changes: [{
        field: String,
        oldValue: String,
        newValue: String,
      }],
    }],
    
    // Flags and moderation
    flags: [{
      type: {
        type: String,
        enum: ["spam", "inappropriate", "off_topic", "duplicate", "other"],
      },
      flaggedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      flaggedAt: {
        type: Date,
        default: Date.now,
      },
      reason: String,
      resolved: {
        type: Boolean,
        default: false,
      },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      resolvedAt: Date,
    }],
    
    // Analytics and metrics
    analytics: {
      // Engagement metrics
      views: {
        count: {
          type: Number,
          default: 0,
        },
        uniqueUsers: [{
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          viewedAt: Date,
          viewCount: {
            type: Number,
            default: 1,
          },
        }],
      },
      
      // Interaction metrics
      interactions: {
        likes: {
          type: Number,
          default: 0,
        },
        shares: {
          type: Number,
          default: 0,
        },
        bookmarks: {
          type: Number,
          default: 0,
        },
        replies: {
          type: Number,
          default: 0,
        },
      },
      
      // Performance metrics
      performance: {
        impact_score: Number, // How impactful this activity was
        engagement_rate: Number, // Engagement relative to visibility
        viral_coefficient: Number, // How much it was shared
      },
    },
    
    // Integration and synchronization
    integration: {
      // External service this activity came from
      source: {
        service: String, // "slack", "github", "jira", etc.
        id: String, // External ID
        url: String, // External URL
        syncedAt: Date,
      },
      
      // Where this activity should be synced to
      syncTo: [{
        service: String,
        enabled: Boolean,
        lastSynced: Date,
        status: {
          type: String,
          enum: ["pending", "synced", "failed"],
          default: "pending",
        },
        error: String,
      }],
    },
    
    // AI and automation
    ai: {
      // AI-generated activity
      isGenerated: {
        type: Boolean,
        default: false,
      },
      
      // AI analysis of the activity
      analysis: {
        sentiment: {
          type: String,
          enum: ["positive", "neutral", "negative"],
        },
        confidence: Number, // 0-1
        topics: [String],
        keywords: [String],
        importance: Number, // 0-100
      },
      
      // AI suggestions based on this activity
      suggestions: [{
        type: String,
        suggestion: String,
        confidence: Number,
        accepted: {
          type: Boolean,
          default: false,
        },
      }],
    },
    
    // Workflow and automation triggers
    triggers: {
      // Workflows triggered by this activity
      triggeredWorkflows: [{
        workflow: String,
        triggeredAt: Date,
        status: String,
        result: String,
      }],
      
      // Whether this activity can trigger workflows
      canTriggerWorkflows: {
        type: Boolean,
        default: true,
      },
      
      // Custom trigger data
      customTriggers: [{
        name: String,
        condition: String,
        action: String,
        executed: Boolean,
        executedAt: Date,
      }],
    },
    
    // Compliance and audit
    compliance: {
      // Retention requirements
      retention: {
        required: Boolean,
        retainUntil: Date,
        reason: String,
      },
      
      // Audit requirements
      audit: {
        required: Boolean,
        auditLevel: {
          type: String,
          enum: ["basic", "detailed", "comprehensive"],
        },
        complianceStandard: String, // GDPR, SOX, etc.
      },
      
      // Privacy considerations
      privacy: {
        containsPII: Boolean,
        dataClassification: {
          type: String,
          enum: ["public", "internal", "confidential", "restricted"],
        },
        anonymizeAfter: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
activitySchema.index({ "actor.user": 1, createdAt: -1 });
activitySchema.index({ "target.entityType": 1, "target.entityId": 1, createdAt: -1 });
activitySchema.index({ "action.type": 1 });
activitySchema.index({ "action.category": 1, createdAt: -1 });
activitySchema.index({ "context.business.team": 1, createdAt: -1 });
activitySchema.index({ "context.business.project": 1, createdAt: -1 });
activitySchema.index({ "thread.parent": 1 });
activitySchema.index({ "thread.root": 1 });
activitySchema.index({ "visibility.level": 1, "visibility.showInFeed": 1 });
activitySchema.index({ status: 1, createdAt: -1 });

// Virtual for formatted timestamp
activitySchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Virtual for engagement score
activitySchema.virtual('engagementScore').get(function() {
  const interactions = this.analytics.interactions;
  const views = this.analytics.views.count || 1;
  
  const totalInteractions = (interactions.likes || 0) + 
                           (interactions.shares || 0) + 
                           (interactions.replies || 0);
  
  return views > 0 ? (totalInteractions / views) * 100 : 0;
});

// Static method to create activity
activitySchema.statics.createActivity = async function(data) {
  // Enrich data with cached values
  const User = mongoose.model('User');
  const actor = await User.findById(data.actor.user).select('name profile.avatar');
  
  if (actor) {
    data.actor.name = actor.name;
    data.actor.avatar = actor.profile?.avatar;
  }
  
  // Generate description if not provided
  if (!data.action.description) {
    data.action.description = this.generateDescription(data);
  }
  
  const activity = new this(data);
  await activity.save();
  
  // Post-creation actions
  await activity.postCreate();
  
  return activity;
};

// Static method to generate activity description
activitySchema.statics.generateDescription = function(data) {
  const actorName = data.actor.name || 'Someone';
  const actionType = data.action.type;
  const entityName = data.target.entityName || 'item';
  
  const templates = {
    task_created: `${actorName} created task "${entityName}"`,
    task_completed: `${actorName} completed task "${entityName}"`,
    task_assigned: `${actorName} assigned task "${entityName}"`,
    project_created: `${actorName} created project "${entityName}"`,
    comment_added: `${actorName} commented on ${data.target.entityType} "${entityName}"`,
    team_member_joined: `${actorName} joined the team`,
    time_logged: `${actorName} logged time on "${entityName}"`,
    goal_completed: `${actorName} completed goal "${entityName}"`,
  };
  
  return templates[actionType] || `${actorName} performed ${actionType} on ${entityName}`;
};

// Method to handle post-creation actions
activitySchema.methods.postCreate = async function() {
  // Update reply count for threaded activities
  if (this.thread.parent) {
    await this.model('Activity').findByIdAndUpdate(
      this.thread.parent,
      { 
        $inc: { 'thread.replyCount': 1 },
        $set: { 'thread.lastReplyAt': new Date() }
      }
    );
  }
  
  // Generate notifications if enabled
  if (this.visibility.generateNotifications) {
    await this.generateNotifications();
  }
  
  // Trigger workflows if enabled
  if (this.triggers.canTriggerWorkflows) {
    await this.triggerWorkflows();
  }
  
  // Sync to external services
  await this.syncToExternalServices();
};

// Method to generate notifications
activitySchema.methods.generateNotifications = async function() {
  const Notification = mongoose.model('Notification');
  const recipients = await this.getNotificationRecipients();
  
  for (const recipient of recipients) {
    if (recipient.toString() === this.actor.user.toString()) {
      continue; // Don't notify the actor
    }
    
    const notificationData = {
      user: recipient,
      type: this.getNotificationType(),
      title: this.getNotificationTitle(),
      message: this.action.description,
      scheduledFor: new Date(),
      richContent: {
        actions: this.getNotificationActions(),
        visual: {
          icon: this.getNotificationIcon(),
          color: this.getNotificationColor(),
        },
      },
      metadata: {
        source: 'activity',
        activityId: this._id,
        entityType: this.target.entityType,
        entityId: this.target.entityId,
      },
    };
    
    await Notification.scheduleNotification(notificationData);
  }
};

// Method to get notification recipients
activitySchema.methods.getNotificationRecipients = async function() {
  const recipients = new Set();
  
  // Add mentioned users
  if (this.content.message?.mentions) {
    this.content.message.mentions.forEach(mention => {
      recipients.add(mention.user.toString());
    });
  }
  
  // Add target entity owner/assignees
  await this.addEntityStakeholders(recipients);
  
  // Add team members based on visibility
  if (this.visibility.level === 'team' && this.context.business.team) {
    const Team = mongoose.model('Team');
    const team = await Team.findById(this.context.business.team);
    if (team) {
      team.members.forEach(member => {
        if (member.status === 'active') {
          recipients.add(member.user.toString());
        }
      });
    }
  }
  
  return Array.from(recipients);
};

// Method to add entity stakeholders
activitySchema.methods.addEntityStakeholders = async function(recipients) {
  const Model = mongoose.model(this.target.entityType.charAt(0).toUpperCase() + 
                               this.target.entityType.slice(1));
  
  if (!Model) return;
  
  try {
    const entity = await Model.findById(this.target.entityId);
    if (entity) {
      // Add owner
      if (entity.owner) recipients.add(entity.owner.toString());
      if (entity.user) recipients.add(entity.user.toString());
      
      // Add assignees
      if (entity.assignees) {
        entity.assignees.forEach(assignee => recipients.add(assignee.toString()));
      }
      
      // Add team members
      if (entity.teamMembers) {
        entity.teamMembers.forEach(member => recipients.add(member.user.toString()));
      }
    }
  } catch (error) {
    console.error('Error adding entity stakeholders:', error);
  }
};

// Helper methods for notifications
activitySchema.methods.getNotificationType = function() {
  const typeMap = {
    task_assigned: 'task_reminder',
    comment_added: 'collaboration_update',
    mention_created: 'collaboration_update',
    project_member_added: 'team_update',
    deadline_approaching: 'deadline_warning',
  };
  
  return typeMap[this.action.type] || 'system_notification';
};

activitySchema.methods.getNotificationTitle = function() {
  const titleMap = {
    task_created: 'New Task Created',
    task_assigned: 'Task Assigned to You',
    comment_added: 'New Comment',
    mention_created: 'You were mentioned',
    project_completed: 'Project Completed',
  };
  
  return titleMap[this.action.type] || 'New Activity';
};

activitySchema.methods.getNotificationActions = function() {
  const actions = [];
  
  if (this.target.entityType === 'task') {
    actions.push({
      label: 'View Task',
      action: 'view_task',
      actionData: { taskId: this.target.entityId },
      style: 'primary',
    });
  }
  
  if (this.action.type === 'comment_added') {
    actions.push({
      label: 'Reply',
      action: 'reply_comment',
      actionData: { activityId: this._id },
      style: 'secondary',
    });
  }
  
  return actions;
};

activitySchema.methods.getNotificationIcon = function() {
  const iconMap = {
    task_created: 'task',
    comment_added: 'comment',
    project_completed: 'check-circle',
    team_member_joined: 'user-plus',
    time_logged: 'clock',
  };
  
  return iconMap[this.action.type] || 'bell';
};

activitySchema.methods.getNotificationColor = function() {
  const colorMap = {
    task_created: '#007bff',
    task_completed: '#28a745',
    comment_added: '#6f42c1',
    project_completed: '#28a745',
    error: '#dc3545',
  };
  
  return colorMap[this.action.type] || '#6c757d';
};

// Method to trigger workflows
activitySchema.methods.triggerWorkflows = async function() {
  // This would integrate with your workflow engine
  // For now, we'll just log the trigger opportunity
  
  const triggerData = {
    event: this.action.type,
    entity: this.target,
    actor: this.actor.user,
    context: this.context,
    timestamp: this.createdAt,
  };
  
  // Placeholder for workflow triggering logic
  console.log('Workflow trigger:', triggerData);
};

// Method to sync to external services
activitySchema.methods.syncToExternalServices = async function() {
  for (const sync of this.integration.syncTo) {
    if (sync.enabled && sync.status === 'pending') {
      try {
        // Placeholder for actual sync logic
        await this.syncToService(sync.service);
        sync.status = 'synced';
        sync.lastSynced = new Date();
      } catch (error) {
        sync.status = 'failed';
        sync.error = error.message;
      }
    }
  }
  
  if (this.integration.syncTo.length > 0) {
    await this.save();
  }
};

// Method to add reaction
activitySchema.methods.addReaction = async function(userId, emoji) {
  // Check if user already reacted with this emoji
  const existingReaction = this.content.reactions.find(
    r => r.user.toString() === userId.toString() && r.emoji === emoji
  );
  
  if (existingReaction) {
    throw new Error('User already reacted with this emoji');
  }
  
  this.content.reactions.push({
    emoji,
    user: userId,
  });
  
  // Update analytics
  this.analytics.interactions.likes = this.content.reactions.length;
  
  return this.save();
};

// Method to remove reaction
activitySchema.methods.removeReaction = async function(userId, emoji) {
  this.content.reactions = this.content.reactions.filter(
    r => !(r.user.toString() === userId.toString() && r.emoji === emoji)
  );
  
  // Update analytics
  this.analytics.interactions.likes = this.content.reactions.length;
  
  return this.save();
};

// Method to edit activity
activitySchema.methods.edit = async function(updates, editedBy, reason = '') {
  const changes = [];
  
  // Track changes
  Object.keys(updates).forEach(field => {
    if (this[field] !== updates[field]) {
      changes.push({
        field,
        oldValue: this[field],
        newValue: updates[field],
      });
    }
  });
  
  // Apply updates
  Object.assign(this, updates);
  
  // Add to edit history
  this.editHistory.push({
    editedAt: new Date(),
    editedBy,
    reason,
    changes,
  });
  
  this.status = 'edited';
  
  return this.save();
};

// Static method to get activity feed
activitySchema.statics.getActivityFeed = async function(userId, options = {}) {
  const {
    limit = 20,
    skip = 0,
    entityType,
    entityId,
    teamId,
    projectId,
    actionTypes,
    since,
  } = options;
  
  // Build query
  const query = {
    status: { $in: ['active', 'edited'] },
    'visibility.showInFeed': true,
  };
  
  // Add visibility filters
  const User = mongoose.model('User');
  const user = await User.findById(userId).populate('team.teams.teamId');
  const userTeams = user.team.teams.map(t => t.teamId._id);
  
  query.$or = [
    { 'visibility.level': 'public' },
    { 'visibility.level': 'team', 'context.business.team': { $in: userTeams } },
    { 'visibility.users': userId },
    { 'actor.user': userId },
  ];
  
  // Add filters
  if (entityType && entityId) {
    query['target.entityType'] = entityType;
    query['target.entityId'] = entityId;
  }
  
  if (teamId) {
    query['context.business.team'] = teamId;
  }
  
  if (projectId) {
    query['context.business.project'] = projectId;
  }
  
  if (actionTypes && actionTypes.length > 0) {
    query['action.type'] = { $in: actionTypes };
  }
  
  if (since) {
    query.createdAt = { $gte: since };
  }
  
  return this.find(query)
    .populate('actor.user', 'name profile.avatar')
    .populate('thread.parent', 'action.description actor.user')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get activity stats
activitySchema.statics.getActivityStats = async function(userId, period = 'week') {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'day':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
  }
  
  const activities = await this.find({
    'actor.user': userId,
    createdAt: { $gte: startDate, $lte: endDate },
  });
  
  const stats = {
    totalActivities: activities.length,
    byType: {},
    byCategory: {},
    engagement: {
      totalReactions: 0,
      totalReplies: 0,
    },
  };
  
  activities.forEach(activity => {
    // Count by type
    const type = activity.action.type;
    stats.byType[type] = (stats.byType[type] || 0) + 1;
    
    // Count by category
    const category = activity.action.category;
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    
    // Count engagement
    stats.engagement.totalReactions += activity.content.reactions.length;
    stats.engagement.totalReplies += activity.thread.replyCount;
  });
  
  return stats;
};

const Activity = mongoose.model("Activity", activitySchema);

module.exports = Activity;