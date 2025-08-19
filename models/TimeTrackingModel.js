const mongoose = require("mongoose");

const timeTrackingSchema = new mongoose.Schema(
  {
    // User who tracked the time
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
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    
    // Time tracking details
    timing: {
      startTime: {
        type: Date,
        required: true,
      },
      endTime: Date,
      duration: {
        type: Number, // in seconds
        required: true,
      },
      // Break time deducted from total
      breaks: [{
        startTime: Date,
        endTime: Date,
        duration: Number, // in seconds
        reason: String,
      }],
      // Net duration after breaks
      netDuration: Number, // in seconds
      
      // Time zone information
      timezone: {
        type: String,
        default: "UTC",
      },
      
      // Auto-tracking vs manual entry
      trackingMethod: {
        type: String,
        enum: ["automatic", "manual", "imported", "estimated"],
        default: "manual",
      },
    },
    
    // Work description and categorization
    work: {
      description: {
        type: String,
        required: true,
        trim: true,
      },
      type: {
        type: String,
        enum: [
          "development",
          "design",
          "testing",
          "documentation",
          "meeting",
          "research",
          "planning",
          "review",
          "support",
          "training",
          "administration",
          "communication",
          "other"
        ],
        default: "other",
      },
      
      // Activity tags for detailed categorization
      activityTags: [String],
      
      // Productivity level during this time
      productivityLevel: {
        type: String,
        enum: ["very_low", "low", "medium", "high", "very_high"],
        default: "medium",
      },
      
      // Focus quality
      focusQuality: {
        type: Number,
        min: 1,
        max: 10,
        default: 7,
      },
      
      // Energy level
      energyLevel: {
        type: String,
        enum: ["very_low", "low", "medium", "high", "very_high"],
        default: "medium",
      },
    },
    
    // Billing and cost information
    billing: {
      // Whether this time is billable
      billable: {
        type: Boolean,
        default: true,
      },
      
      // Hourly rate for this entry
      hourlyRate: {
        amount: Number,
        currency: {
          type: String,
          default: "USD",
        },
      },
      
      // Total billable amount
      billableAmount: Number,
      
      // Client information
      client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client", // Would need a Client model
      },
      
      // Invoice information
      invoice: {
        invoiceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Invoice", // Would need an Invoice model
        },
        invoiced: {
          type: Boolean,
          default: false,
        },
        invoicedAt: Date,
      },
      
      // Approval workflow
      approval: {
        status: {
          type: String,
          enum: ["pending", "approved", "rejected", "requires_revision"],
          default: "pending",
        },
        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        approvedAt: Date,
        rejectionReason: String,
        notes: String,
      },
    },
    
    // Location and context
    context: {
      // Where the work was done
      location: {
        type: {
          type: String,
          enum: ["office", "home", "client_site", "remote", "travel", "other"],
        },
        address: String,
        coordinates: {
          type: [Number], // [longitude, latitude]
          index: "2dsphere",
        },
        name: String, // Location name
      },
      
      // Device/platform used
      device: {
        type: String,
        enum: ["desktop", "laptop", "tablet", "mobile", "other"],
      },
      
      // Applications used during this time
      applications: [{
        name: String,
        category: String,
        timeSpent: Number, // seconds
        productivityScore: Number, // 0-100
      }],
      
      // Environment factors
      environment: {
        noise_level: {
          type: String,
          enum: ["quiet", "moderate", "noisy"],
        },
        interruptions: {
          count: { type: Number, default: 0 },
          totalDuration: { type: Number, default: 0 }, // seconds
          types: [String], // "phone", "email", "colleague", etc.
        },
        mood: {
          type: String,
          enum: ["excellent", "good", "neutral", "poor", "terrible"],
        },
      },
    },
    
    // Automation and smart tracking
    automation: {
      // Auto-detected from computer activity
      autoDetected: {
        type: Boolean,
        default: false,
      },
      
      // AI-suggested categorization
      aiSuggestions: {
        suggestedTask: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Task",
        },
        suggestedCategory: String,
        suggestedTags: [String],
        confidence: {
          type: Number,
          min: 0,
          max: 1,
        },
        accepted: {
          type: Boolean,
          default: false,
        },
      },
      
      // Integration with time tracking tools
      integration: {
        source: String, // "toggl", "harvest", "clockify", etc.
        externalId: String,
        syncedAt: Date,
        metadata: Object,
      },
      
      // Smart rules applied
      rulesApplied: [{
        rule: String,
        action: String,
        result: String,
      }],
    },
    
    // Collaboration and team tracking
    collaboration: {
      // Team members involved
      teamMembers: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["lead", "contributor", "reviewer", "observer"],
        },
        timeSpent: Number, // seconds
      }],
      
      // Meeting information
      meeting: {
        isMeeting: {
          type: Boolean,
          default: false,
        },
        meetingType: {
          type: String,
          enum: ["standup", "planning", "review", "brainstorming", "client", "training"],
        },
        attendees: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        }],
        notes: String,
        outcomes: [String],
      },
      
      // Shared time tracking session
      sharedSession: {
        sessionId: String,
        isLead: {
          type: Boolean,
          default: false,
        },
        participants: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        }],
      },
    },
    
    // Quality and validation
    quality: {
      // Validation status
      validation: {
        status: {
          type: String,
          enum: ["valid", "flagged", "invalid", "pending_review"],
          default: "valid",
        },
        flaggedReasons: [String],
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reviewedAt: Date,
        reviewNotes: String,
      },
      
      // Quality metrics
      metrics: {
        // Time entry accuracy (compared to automatic tracking)
        accuracy: {
          type: Number,
          min: 0,
          max: 100,
        },
        // Consistency with user's patterns
        consistency: {
          type: Number,
          min: 0,
          max: 100,
        },
        // Completeness of information
        completeness: {
          type: Number,
          min: 0,
          max: 100,
        },
      },
      
      // Anomaly detection
      anomalies: [{
        type: {
          type: String,
          enum: ["unusual_duration", "unusual_time", "unusual_productivity", "inconsistent_task"],
        },
        severity: {
          type: String,
          enum: ["low", "medium", "high"],
        },
        description: String,
        confidence: Number, // 0-1
        resolved: {
          type: Boolean,
          default: false,
        },
      }],
    },
    
    // Analytics and insights
    analytics: {
      // Productivity analysis
      productivity: {
        focusTimePercentage: Number, // 0-100
        deepWorkTime: Number, // seconds of uninterrupted work
        shallowWorkTime: Number, // seconds of interrupted/less focused work
        multitaskingScore: Number, // 0-100, lower is better
        efficiencyRating: Number, // 0-10
      },
      
      // Pattern recognition
      patterns: {
        similarSessions: [String], // IDs of similar time tracking sessions
        optimalTimePattern: String,
        productivityTrend: String, // "improving", "stable", "declining"
      },
      
      // Benchmarking
      benchmarks: {
        personalAverage: Number, // User's average for similar tasks
        teamAverage: Number, // Team average for similar tasks
        industryBenchmark: Number, // Industry standard if available
      },
    },
    
    // Status and workflow
    status: {
      type: String,
      enum: ["draft", "active", "completed", "paused", "cancelled", "archived"],
      default: "draft",
    },
    
    // Revisions and history
    revisions: [{
      field: String,
      oldValue: String,
      newValue: String,
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      changedAt: {
        type: Date,
        default: Date.now,
      },
      reason: String,
    }],
    
    // Attachments and evidence
    attachments: [{
      type: {
        type: String,
        enum: ["screenshot", "document", "photo", "video", "audio", "other"],
      },
      filename: String,
      url: String,
      size: Number, // bytes
      description: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    
    // Comments and notes
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      comment: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
      type: {
        type: String,
        enum: ["note", "clarification", "issue", "approval"],
        default: "note",
      },
    }],
    
    // Export and reporting
    reporting: {
      // Report categories
      reportCategories: [String],
      
      // Custom fields for specific reporting needs
      customFields: [{
        name: String,
        value: String,
        type: String,
      }],
      
      // Export status
      exports: [{
        format: String, // "csv", "pdf", "excel"
        exportedAt: Date,
        exportedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        filename: String,
      }],
    },
    
    // Compliance and audit
    compliance: {
      // Compliance requirements met
      requirements: [{
        requirement: String,
        status: {
          type: String,
          enum: ["compliant", "non_compliant", "partial", "not_applicable"],
        },
        notes: String,
      }],
      
      // Audit trail
      auditTrail: [{
        action: String,
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        timestamp: Date,
        details: Object,
        ipAddress: String,
      }],
      
      // Retention policy
      retention: {
        retainUntil: Date,
        retentionReason: String,
        canDelete: {
          type: Boolean,
          default: true,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
timeTrackingSchema.index({ user: 1, "timing.startTime": -1 });
timeTrackingSchema.index({ task: 1 });
timeTrackingSchema.index({ project: 1 });
timeTrackingSchema.index({ "timing.startTime": 1, "timing.endTime": 1 });
timeTrackingSchema.index({ "billing.billable": 1, "billing.invoice.invoiced": 1 });
timeTrackingSchema.index({ status: 1 });
timeTrackingSchema.index({ "context.location.coordinates": "2dsphere" });

// Pre-save middleware to calculate derived fields
timeTrackingSchema.pre('save', function(next) {
  // Calculate net duration (total duration minus breaks)
  if (this.timing.duration) {
    const totalBreakTime = this.timing.breaks.reduce((total, breakTime) => {
      return total + (breakTime.duration || 0);
    }, 0);
    
    this.timing.netDuration = this.timing.duration - totalBreakTime;
  }
  
  // Calculate billable amount
  if (this.billing.billable && this.billing.hourlyRate.amount && this.timing.netDuration) {
    const hours = this.timing.netDuration / 3600; // Convert seconds to hours
    this.billing.billableAmount = hours * this.billing.hourlyRate.amount;
  }
  
  // Auto-calculate end time if not provided
  if (this.timing.startTime && this.timing.duration && !this.timing.endTime) {
    this.timing.endTime = new Date(this.timing.startTime.getTime() + (this.timing.duration * 1000));
  }
  
  // Calculate duration if start and end times are provided
  if (this.timing.startTime && this.timing.endTime && !this.timing.duration) {
    this.timing.duration = Math.round((this.timing.endTime - this.timing.startTime) / 1000);
  }
  
  next();
});

// Virtual for duration in hours
timeTrackingSchema.virtual('durationHours').get(function() {
  return this.timing.netDuration ? (this.timing.netDuration / 3600).toFixed(2) : 0;
});

// Virtual for formatted duration
timeTrackingSchema.virtual('formattedDuration').get(function() {
  if (!this.timing.netDuration) return '0:00:00';
  
  const hours = Math.floor(this.timing.netDuration / 3600);
  const minutes = Math.floor((this.timing.netDuration % 3600) / 60);
  const seconds = this.timing.netDuration % 60;
  
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for is today
timeTrackingSchema.virtual('isToday').get(function() {
  const today = new Date();
  const entryDate = new Date(this.timing.startTime);
  
  return today.toDateString() === entryDate.toDateString();
});

// Method to start time tracking
timeTrackingSchema.statics.startTracking = async function(userId, data) {
  const entry = new this({
    user: userId,
    task: data.task,
    project: data.project,
    category: data.category,
    work: {
      description: data.description || 'Working on task',
      type: data.workType || 'other',
    },
    timing: {
      startTime: new Date(),
      trackingMethod: 'automatic',
    },
    status: 'active',
  });
  
  return entry.save();
};

// Method to stop time tracking
timeTrackingSchema.methods.stopTracking = async function(endTime = new Date()) {
  if (this.status !== 'active') {
    throw new Error('Time tracking session is not active');
  }
  
  this.timing.endTime = endTime;
  this.timing.duration = Math.round((endTime - this.timing.startTime) / 1000);
  this.status = 'completed';
  
  // Auto-calculate productivity metrics
  await this.calculateProductivityMetrics();
  
  return this.save();
};

// Method to pause time tracking
timeTrackingSchema.methods.pauseTracking = async function(reason = 'Break') {
  if (this.status !== 'active') {
    throw new Error('Time tracking session is not active');
  }
  
  const now = new Date();
  this.timing.breaks.push({
    startTime: now,
    reason: reason,
  });
  
  this.status = 'paused';
  return this.save();
};

// Method to resume time tracking
timeTrackingSchema.methods.resumeTracking = async function() {
  if (this.status !== 'paused') {
    throw new Error('Time tracking session is not paused');
  }
  
  const currentBreak = this.timing.breaks[this.timing.breaks.length - 1];
  if (currentBreak && !currentBreak.endTime) {
    const now = new Date();
    currentBreak.endTime = now;
    currentBreak.duration = Math.round((now - currentBreak.startTime) / 1000);
  }
  
  this.status = 'active';
  return this.save();
};

// Method to add manual time entry
timeTrackingSchema.statics.addManualEntry = async function(userId, data) {
  const entry = new this({
    user: userId,
    task: data.task,
    project: data.project,
    category: data.category,
    work: {
      description: data.description,
      type: data.workType || 'other',
      productivityLevel: data.productivityLevel,
      focusQuality: data.focusQuality,
    },
    timing: {
      startTime: data.startTime,
      endTime: data.endTime,
      duration: data.duration,
      trackingMethod: 'manual',
    },
    billing: {
      billable: data.billable !== undefined ? data.billable : true,
      hourlyRate: data.hourlyRate,
    },
    status: 'completed',
  });
  
  return entry.save();
};

// Method to calculate productivity metrics
timeTrackingSchema.methods.calculateProductivityMetrics = async function() {
  // Calculate focus time percentage (time without interruptions)
  const totalInterruptionTime = this.context.environment.interruptions.totalDuration || 0;
  const focusTime = Math.max(0, this.timing.netDuration - totalInterruptionTime);
  this.analytics.productivity.focusTimePercentage = 
    this.timing.netDuration > 0 ? (focusTime / this.timing.netDuration) * 100 : 0;
  
  // Classify as deep work vs shallow work
  const deepWorkThreshold = 25 * 60; // 25 minutes without interruption
  if (focusTime >= deepWorkThreshold) {
    this.analytics.productivity.deepWorkTime = focusTime;
    this.analytics.productivity.shallowWorkTime = this.timing.netDuration - focusTime;
  } else {
    this.analytics.productivity.deepWorkTime = 0;
    this.analytics.productivity.shallowWorkTime = this.timing.netDuration;
  }
  
  // Calculate efficiency rating based on multiple factors
  let efficiencyScore = 5; // Base score
  
  // Adjust based on focus quality
  if (this.work.focusQuality >= 8) efficiencyScore += 2;
  else if (this.work.focusQuality <= 4) efficiencyScore -= 2;
  
  // Adjust based on productivity level
  const productivityScores = {
    'very_high': 2,
    'high': 1,
    'medium': 0,
    'low': -1,
    'very_low': -2,
  };
  efficiencyScore += productivityScores[this.work.productivityLevel] || 0;
  
  // Adjust based on interruptions
  const interruptionPenalty = Math.min(2, this.context.environment.interruptions.count * 0.5);
  efficiencyScore -= interruptionPenalty;
  
  this.analytics.productivity.efficiencyRating = Math.max(1, Math.min(10, efficiencyScore));
};

// Method to detect anomalies
timeTrackingSchema.methods.detectAnomalies = async function() {
  const anomalies = [];
  
  // Check for unusual duration
  if (this.timing.netDuration > 12 * 3600) { // More than 12 hours
    anomalies.push({
      type: 'unusual_duration',
      severity: 'high',
      description: 'Session duration exceeds 12 hours',
      confidence: 0.9,
    });
  } else if (this.timing.netDuration > 8 * 3600) { // More than 8 hours
    anomalies.push({
      type: 'unusual_duration',
      severity: 'medium',
      description: 'Session duration exceeds 8 hours',
      confidence: 0.7,
    });
  }
  
  // Check for unusual time (working at odd hours)
  const hour = this.timing.startTime.getHours();
  if (hour < 6 || hour > 22) {
    anomalies.push({
      type: 'unusual_time',
      severity: 'medium',
      description: 'Work session started outside normal hours',
      confidence: 0.6,
    });
  }
  
  // Check for very low productivity
  if (this.work.productivityLevel === 'very_low' && this.timing.netDuration > 2 * 3600) {
    anomalies.push({
      type: 'unusual_productivity',
      severity: 'medium',
      description: 'Long session with very low productivity',
      confidence: 0.8,
    });
  }
  
  this.quality.anomalies = anomalies;
  return anomalies;
};

// Method to get user statistics
timeTrackingSchema.statics.getUserStats = async function(userId, period = 'week') {
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
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }
  
  const entries = await this.find({
    user: userId,
    'timing.startTime': { $gte: startDate, $lte: endDate },
    status: 'completed',
  });
  
  const stats = {
    totalEntries: entries.length,
    totalDuration: entries.reduce((sum, entry) => sum + (entry.timing.netDuration || 0), 0),
    billableDuration: entries
      .filter(entry => entry.billing.billable)
      .reduce((sum, entry) => sum + (entry.timing.netDuration || 0), 0),
    totalBillableAmount: entries
      .filter(entry => entry.billing.billable)
      .reduce((sum, entry) => sum + (entry.billing.billableAmount || 0), 0),
    averageSessionDuration: 0,
    productivityDistribution: {},
    workTypeDistribution: {},
    dailyAverages: {},
  };
  
  // Calculate averages
  if (entries.length > 0) {
    stats.averageSessionDuration = stats.totalDuration / entries.length;
    
    // Productivity distribution
    const productivityCounts = {};
    entries.forEach(entry => {
      const level = entry.work.productivityLevel;
      productivityCounts[level] = (productivityCounts[level] || 0) + 1;
    });
    
    Object.keys(productivityCounts).forEach(level => {
      stats.productivityDistribution[level] = 
        (productivityCounts[level] / entries.length) * 100;
    });
    
    // Work type distribution
    const workTypeCounts = {};
    entries.forEach(entry => {
      const type = entry.work.type;
      workTypeCounts[type] = (workTypeCounts[type] || 0) + (entry.timing.netDuration || 0);
    });
    
    stats.workTypeDistribution = workTypeCounts;
  }
  
  return stats;
};

// Method to generate time report
timeTrackingSchema.statics.generateReport = async function(filters = {}) {
  const query = {};
  
  // Apply filters
  if (filters.user) query.user = filters.user;
  if (filters.project) query.project = filters.project;
  if (filters.task) query.task = filters.task;
  if (filters.startDate || filters.endDate) {
    query['timing.startTime'] = {};
    if (filters.startDate) query['timing.startTime'].$gte = filters.startDate;
    if (filters.endDate) query['timing.startTime'].$lte = filters.endDate;
  }
  if (filters.billable !== undefined) query['billing.billable'] = filters.billable;
  
  const entries = await this.find(query)
    .populate('user', 'name email')
    .populate('task', 'title')
    .populate('project', 'name')
    .sort({ 'timing.startTime': -1 });
  
  const report = {
    filters,
    summary: {
      totalEntries: entries.length,
      totalDuration: entries.reduce((sum, e) => sum + (e.timing.netDuration || 0), 0),
      billableDuration: entries
        .filter(e => e.billing.billable)
        .reduce((sum, e) => sum + (e.timing.netDuration || 0), 0),
      totalAmount: entries.reduce((sum, e) => sum + (e.billing.billableAmount || 0), 0),
    },
    entries: entries.map(entry => ({
      id: entry._id,
      user: entry.user?.name,
      task: entry.task?.title,
      project: entry.project?.name,
      description: entry.work.description,
      startTime: entry.timing.startTime,
      duration: entry.timing.netDuration,
      billable: entry.billing.billable,
      amount: entry.billing.billableAmount,
    })),
    generatedAt: new Date(),
  };
  
  return report;
};

// Static method to find active sessions
timeTrackingSchema.statics.findActiveSessions = function(userId = null) {
  const query = { status: 'active' };
  if (userId) query.user = userId;
  
  return this.find(query).populate('user task project');
};

// Static method to find recent entries
timeTrackingSchema.statics.findRecent = function(userId, limit = 10) {
  return this.find({ user: userId })
    .sort({ 'timing.startTime': -1 })
    .limit(limit)
    .populate('task project');
};

const TimeTracking = mongoose.model("TimeTracking", timeTrackingSchema);

module.exports = TimeTracking;