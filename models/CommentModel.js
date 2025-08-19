const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    // Author of the comment
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Entity this comment belongs to
    entity: {
      entityType: {
        type: String,
        enum: ["task", "project", "goal", "team", "time_entry", "template", "comment"],
        required: true,
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
    },
    
    // Comment content
    content: {
      // Raw text content
      text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 10000,
      },
      
      // Formatted content
      html: String,
      markdown: String,
      
      // Content type
      type: {
        type: String,
        enum: ["text", "markdown", "html"],
        default: "text",
      },
      
      // Mentions in the comment
      mentions: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: String,
        position: Number, // Character position in text
        length: Number,   // Length of mention text
      }],
      
      // Hashtags
      hashtags: [String],
      
      // External links
      links: [{
        url: String,
        title: String,
        description: String,
        image: String,
        domain: String,
      }],
      
      // Code blocks
      codeBlocks: [{
        language: String,
        code: String,
        startPosition: Number,
        endPosition: Number,
      }],
    },
    
    // Threading and replies
    thread: {
      // Parent comment (for nested replies)
      parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
      
      // Root comment in thread
      root: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
      
      // Nesting level (0 = top level)
      level: {
        type: Number,
        default: 0,
        max: 5, // Limit nesting depth
      },
      
      // Reply count
      replyCount: {
        type: Number,
        default: 0,
      },
      
      // Last reply timestamp
      lastReplyAt: Date,
      
      // Path for efficient querying (e.g., "1/2/3")
      path: String,
    },
    
    // Attachments
    attachments: [{
      filename: String,
      originalName: String,
      url: String,
      size: Number, // bytes
      mimeType: String,
      thumbnailUrl: String,
      description: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    
    // Reactions and interactions
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
    
    // Comment status and visibility
    status: {
      type: String,
      enum: ["active", "edited", "deleted", "hidden", "flagged"],
      default: "active",
    },
    
    visibility: {
      level: {
        type: String,
        enum: ["public", "team", "project", "private"],
        default: "project",
      },
      users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
    },
    
    // Edit history
    editHistory: [{
      editedAt: Date,
      previousContent: String,
      reason: String,
      editedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    }],
    
    // Moderation and flags
    moderation: {
      flags: [{
        type: {
          type: String,
          enum: ["spam", "inappropriate", "off_topic", "harassment", "other"],
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
        action: {
          type: String,
          enum: ["none", "hide", "delete", "warn_user"],
        },
      }],
      
      // Auto-moderation results
      autoModeration: {
        toxicityScore: Number, // 0-1
        spamScore: Number,     // 0-1
        flagged: Boolean,
        reasons: [String],
        confidence: Number,    // 0-1
      },
    },
    
    // Analytics
    analytics: {
      views: {
        count: {
          type: Number,
          default: 0,
        },
        uniqueViews: {
          type: Number,
          default: 0,
        },
        lastViewed: Date,
      },
      
      engagement: {
        reactionCount: {
          type: Number,
          default: 0,
        },
        replyCount: {
          type: Number,
          default: 0,
        },
        shareCount: {
          type: Number,
          default: 0,
        },
        bookmarkCount: {
          type: Number,
          default: 0,
        },
      },
      
      // Performance metrics
      performance: {
        engagementRate: Number,  // Engagements / Views
        viralCoefficient: Number, // Shares / Views
        qualityScore: Number,     // Overall quality rating
      },
    },
    
    // AI and automation
    ai: {
      // AI-assisted features
      suggestions: [{
        type: {
          type: String,
          enum: ["grammar", "tone", "clarity", "length", "relevance"],
        },
        suggestion: String,
        confidence: Number,
        applied: {
          type: Boolean,
          default: false,
        },
      }],
      
      // Content analysis
      analysis: {
        sentiment: {
          type: String,
          enum: ["positive", "neutral", "negative"],
        },
        emotion: String, // joy, anger, sadness, etc.
        topics: [String],
        keywords: [String],
        language: String,
        readabilityScore: Number, // 0-100
        urgency: {
          type: String,
          enum: ["low", "medium", "high"],
        },
      },
      
      // Auto-categorization
      categorization: {
        category: {
          type: String,
          enum: ["question", "feedback", "suggestion", "issue", "approval", "update"],
        },
        confidence: Number,
        tags: [String],
      },
    },
    
    // Integration data
    integration: {
      // External source (if imported)
      source: {
        platform: String, // "slack", "teams", "email"
        id: String,       // External ID
        url: String,      // External URL
        timestamp: Date,  // Original timestamp
      },
      
      // Sync status
      sync: {
        synced: {
          type: Boolean,
          default: false,
        },
        syncedAt: Date,
        syncError: String,
      },
    },
    
    // Workflow and automation
    workflow: {
      // Triggered actions
      triggers: [{
        event: String,
        condition: String,
        action: String,
        executed: Boolean,
        executedAt: Date,
        result: String,
      }],
      
      // Approval workflow
      approval: {
        required: {
          type: Boolean,
          default: false,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "approved",
        },
        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        approvedAt: Date,
        rejectionReason: String,
      },
    },
    
    // Collaboration features
    collaboration: {
      // Co-authors (for collaborative editing)
      coAuthors: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        addedAt: Date,
        permissions: {
          type: String,
          enum: ["view", "edit", "admin"],
          default: "edit",
        },
      }],
      
      // Real-time editing
      realTimeEdit: {
        isBeingEdited: {
          type: Boolean,
          default: false,
        },
        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        editStarted: Date,
        lockExpires: Date,
      },
      
      // Version control
      versions: [{
        version: Number,
        content: String,
        createdAt: Date,
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        changes: String,
      }],
    },
    
    // Notifications and alerts
    notifications: {
      // Who to notify
      notifyUsers: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: String, // "mentioned", "watching", "assigned"
        notified: {
          type: Boolean,
          default: false,
        },
        notifiedAt: Date,
      }],
      
      // Notification settings
      settings: {
        notifyOnReply: {
          type: Boolean,
          default: true,
        },
        notifyOnReaction: {
          type: Boolean,
          default: false,
        },
        notifyOnEdit: {
          type: Boolean,
          default: false,
        },
      },
    },
    
    // Rich media content
    media: {
      // Embedded images
      images: [{
        url: String,
        alt: String,
        caption: String,
        width: Number,
        height: Number,
        position: Number, // Position in text
      }],
      
      // Embedded videos
      videos: [{
        url: String,
        thumbnailUrl: String,
        title: String,
        duration: Number, // seconds
        platform: String, // "youtube", "vimeo", etc.
      }],
      
      // Audio recordings
      audio: [{
        url: String,
        duration: Number, // seconds
        transcript: String,
        waveform: [Number], // Audio waveform data
      }],
    },
    
    // Search and indexing
    search: {
      // Full-text search index
      searchText: String,
      
      // Search keywords
      keywords: [String],
      
      // Search boost factors
      boost: {
        type: Number,
        default: 1,
      },
      
      // Last indexed
      lastIndexed: Date,
    },
    
    // Compliance and audit
    compliance: {
      // Data retention
      retention: {
        retainUntil: Date,
        reason: String,
        canDelete: {
          type: Boolean,
          default: true,
        },
      },
      
      // Privacy considerations
      privacy: {
        containsPII: {
          type: Boolean,
          default: false,
        },
        dataClassification: {
          type: String,
          enum: ["public", "internal", "confidential", "restricted"],
          default: "internal",
        },
      },
      
      // Audit trail
      auditLog: [{
        action: String,
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        timestamp: Date,
        details: Object,
        ipAddress: String,
      }],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
commentSchema.index({ "entity.entityType": 1, "entity.entityId": 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ "thread.parent": 1 });
commentSchema.index({ "thread.root": 1 });
commentSchema.index({ "thread.path": 1 });
commentSchema.index({ status: 1 });
commentSchema.index({ "content.mentions.user": 1 });
commentSchema.index({ "search.searchText": "text" });

// Pre-save middleware
commentSchema.pre('save', function(next) {
  // Generate thread path
  if (this.thread.parent && !this.thread.path) {
    this.generateThreadPath();
  }
  
  // Update search text
  this.updateSearchText();
  
  // Count reactions
  this.analytics.engagement.reactionCount = this.reactions.length;
  
  // Extract mentions and hashtags
  this.extractMentionsAndHashtags();
  
  next();
});

// Virtual for time ago
commentSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'now';
});

// Virtual for formatted content
commentSchema.virtual('formattedContent').get(function() {
  if (this.content.type === 'markdown') {
    return this.content.markdown;
  } else if (this.content.type === 'html') {
    return this.content.html;
  }
  return this.content.text;
});

// Method to generate thread path
commentSchema.methods.generateThreadPath = async function() {
  if (!this.thread.parent) {
    this.thread.path = this._id.toString();
    return;
  }
  
  const parent = await this.model('Comment').findById(this.thread.parent);
  if (parent) {
    this.thread.path = `${parent.thread.path}/${this._id}`;
    this.thread.level = parent.thread.level + 1;
    this.thread.root = parent.thread.root || parent._id;
  }
};

// Method to update search text
commentSchema.methods.updateSearchText = function() {
  const parts = [
    this.content.text,
    this.content.hashtags?.join(' '),
    this.attachments?.map(a => a.description).join(' '),
  ].filter(Boolean);
  
  this.search.searchText = parts.join(' ').toLowerCase();
  this.search.lastIndexed = new Date();
};

// Method to extract mentions and hashtags
commentSchema.methods.extractMentionsAndHashtags = function() {
  const text = this.content.text;
  
  // Extract hashtags
  const hashtagRegex = /#\w+/g;
  const hashtags = text.match(hashtagRegex) || [];
  this.content.hashtags = hashtags.map(tag => tag.substring(1));
  
  // Extract @mentions (this would need to be more sophisticated in production)
  const mentionRegex = /@\w+/g;
  const mentions = text.match(mentionRegex) || [];
  // This is simplified - in production you'd look up actual users
  this.content.mentions = mentions.map((mention, index) => ({
    name: mention.substring(1),
    position: text.indexOf(mention),
    length: mention.length,
  }));
};

// Method to add reaction
commentSchema.methods.addReaction = async function(userId, emoji) {
  // Check if user already reacted with this emoji
  const existingReaction = this.reactions.find(
    r => r.user.toString() === userId.toString() && r.emoji === emoji
  );
  
  if (existingReaction) {
    throw new Error('User already reacted with this emoji');
  }
  
  this.reactions.push({
    emoji,
    user: userId,
  });
  
  // Create activity
  const Activity = mongoose.model('Activity');
  await Activity.createActivity({
    actor: { user: userId },
    action: {
      type: 'reaction_added',
      description: `reacted with ${emoji}`,
      category: 'communication',
    },
    target: {
      entityType: 'comment',
      entityId: this._id,
      entityName: this.content.text.substring(0, 50),
    },
  });
  
  return this.save();
};

// Method to remove reaction
commentSchema.methods.removeReaction = async function(userId, emoji) {
  this.reactions = this.reactions.filter(
    r => !(r.user.toString() === userId.toString() && r.emoji === emoji)
  );
  
  return this.save();
};

// Method to edit comment
commentSchema.methods.edit = async function(newContent, editedBy, reason = '') {
  // Save edit history
  this.editHistory.push({
    editedAt: new Date(),
    previousContent: this.content.text,
    reason,
    editedBy,
  });
  
  // Update content
  this.content.text = newContent;
  this.status = 'edited';
  
  // Create activity
  const Activity = mongoose.model('Activity');
  await Activity.createActivity({
    actor: { user: editedBy },
    action: {
      type: 'comment_updated',
      description: 'edited a comment',
      category: 'communication',
    },
    target: {
      entityType: 'comment',
      entityId: this._id,
      entityName: newContent.substring(0, 50),
    },
  });
  
  return this.save();
};

// Method to soft delete
commentSchema.methods.softDelete = async function(deletedBy, reason = '') {
  this.status = 'deleted';
  
  // Add to edit history
  this.editHistory.push({
    editedAt: new Date(),
    previousContent: this.content.text,
    reason: `Deleted: ${reason}`,
    editedBy: deletedBy,
  });
  
  // Create activity
  const Activity = mongoose.model('Activity');
  await Activity.createActivity({
    actor: { user: deletedBy },
    action: {
      type: 'comment_deleted',
      description: 'deleted a comment',
      category: 'communication',
    },
    target: {
      entityType: 'comment',
      entityId: this._id,
      entityName: 'deleted comment',
    },
  });
  
  return this.save();
};

// Method to add reply
commentSchema.methods.addReply = async function(replyData) {
  const Comment = this.model('Comment');
  
  const reply = new Comment({
    ...replyData,
    thread: {
      parent: this._id,
      root: this.thread.root || this._id,
      level: this.thread.level + 1,
    },
  });
  
  await reply.save();
  
  // Update reply count
  this.thread.replyCount++;
  this.thread.lastReplyAt = new Date();
  await this.save();
  
  // Update root comment if this isn't the root
  if (this.thread.root) {
    await Comment.findByIdAndUpdate(
      this.thread.root,
      {
        $inc: { 'thread.replyCount': 1 },
        $set: { 'thread.lastReplyAt': new Date() }
      }
    );
  }
  
  return reply;
};

// Static method to get comment thread
commentSchema.statics.getThread = async function(rootCommentId, options = {}) {
  const { limit = 50, sort = 'createdAt' } = options;
  
  const comments = await this.find({
    $or: [
      { _id: rootCommentId },
      { 'thread.root': rootCommentId }
    ],
    status: { $in: ['active', 'edited'] }
  })
  .populate('author', 'name profile.avatar')
  .sort({ [sort]: 1 })
  .limit(limit);
  
  // Build nested structure
  const commentMap = new Map();
  const rootComments = [];
  
  comments.forEach(comment => {
    commentMap.set(comment._id.toString(), { ...comment.toObject(), replies: [] });
  });
  
  comments.forEach(comment => {
    if (comment.thread.parent) {
      const parent = commentMap.get(comment.thread.parent.toString());
      if (parent) {
        parent.replies.push(commentMap.get(comment._id.toString()));
      }
    } else {
      rootComments.push(commentMap.get(comment._id.toString()));
    }
  });
  
  return rootComments;
};

// Static method to get comments for entity
commentSchema.statics.getForEntity = async function(entityType, entityId, options = {}) {
  const { 
    limit = 20, 
    skip = 0, 
    sort = '-createdAt',
    includeReplies = true 
  } = options;
  
  const query = {
    'entity.entityType': entityType,
    'entity.entityId': entityId,
    status: { $in: ['active', 'edited'] }
  };
  
  if (!includeReplies) {
    query['thread.parent'] = { $exists: false };
  }
  
  return this.find(query)
    .populate('author', 'name profile.avatar')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to search comments
commentSchema.statics.searchComments = async function(searchQuery, options = {}) {
  const {
    entityType,
    entityId,
    authorId,
    limit = 20,
    skip = 0
  } = options;
  
  const query = {
    'search.searchText': { $regex: searchQuery, $options: 'i' },
    status: { $in: ['active', 'edited'] }
  };
  
  if (entityType) query['entity.entityType'] = entityType;
  if (entityId) query['entity.entityId'] = entityId;
  if (authorId) query.author = authorId;
  
  return this.find(query)
    .populate('author', 'name profile.avatar')
    .populate('entity.entityId')
    .sort({ 'analytics.performance.qualityScore': -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get analytics
commentSchema.statics.getAnalytics = async function(entityType, entityId, period = 'month') {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
  }
  
  const pipeline = [
    {
      $match: {
        'entity.entityType': entityType,
        'entity.entityId': new mongoose.Types.ObjectId(entityId),
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['active', 'edited'] }
      }
    },
    {
      $group: {
        _id: null,
        totalComments: { $sum: 1 },
        totalReactions: { $sum: '$analytics.engagement.reactionCount' },
        totalReplies: { $sum: '$analytics.engagement.replyCount' },
        avgEngagement: { $avg: '$analytics.performance.engagementRate' },
        topAuthors: { $addToSet: '$author' }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalComments: 0,
    totalReactions: 0,
    totalReplies: 0,
    avgEngagement: 0,
    topAuthors: []
  };
};

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;