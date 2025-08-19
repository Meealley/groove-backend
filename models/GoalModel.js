const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Goal basic information
    title: {
      type: String,
      required: [true, "Please add a goal title"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Goal categorization
    type: {
      type: String,
      enum: [
        "personal",
        "professional", 
        "health",
        "learning",
        "financial",
        "relationship",
        "hobby",
        "travel",
        "productivity",
        "habit",
        "project",
        "custom"
      ],
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    tags: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
    }],
    // Goal scope and timeline
    scope: {
      type: String,
      enum: ["daily", "weekly", "monthly", "quarterly", "yearly", "lifetime"],
      required: true,
    },
    timeframe: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
      duration: Number, // calculated duration in days
    },
    // Goal measurement and tracking
    measurement: {
      // How to measure progress
      type: {
        type: String,
        enum: [
          "binary",           // Yes/No completion
          "numeric",          // Number-based (e.g., lose 10 pounds)
          "percentage",       // Percentage-based completion
          "task_completion",  // Based on linked tasks
          "habit_frequency",  // Based on habit tracking
          "time_based",       // Based on time spent
          "milestone_based",  // Based on milestone completion
          "qualitative"       // Subjective assessment
        ],
        required: true,
      },
      // Target values
      target: {
        value: Number,       // Target numeric value
        unit: String,        // Unit of measurement (kg, hours, tasks, etc.)
        description: String, // Text description for qualitative goals
      },
      // Current progress
      current: {
        value: {
          type: Number,
          default: 0,
        },
        lastUpdated: Date,
        updateMethod: {
          type: String,
          enum: ["manual", "automatic", "calculated"],
          default: "manual",
        },
      },
      // Progress calculation
      progress: {
        percentage: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        trend: {
          type: String,
          enum: ["improving", "stable", "declining", "unknown"],
          default: "unknown",
        },
        velocity: Number, // Rate of progress (units per day)
        projectedCompletion: Date,
      },
    },
    // Goal structure and breakdown
    structure: {
      // Parent-child relationships
      parentGoal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Goal",
      },
      subGoals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Goal",
      }],
      // Linked tasks
      linkedTasks: [{
        task: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Task",
        },
        weight: {
          type: Number,
          min: 0,
          max: 1,
          default: 1,
        }, // How much this task contributes to goal completion
        required: {
          type: Boolean,
          default: false,
        },
      }],
      // Milestones
      milestones: [{
        title: String,
        description: String,
        targetDate: Date,
        targetValue: Number,
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: Date,
        reward: String,
      }],
    },
    // Goal priority and importance
    priority: {
      level: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "medium",
      },
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
      },
      // Strategic importance
      strategic: {
        alignment: String, // How this aligns with life/business strategy
        impact: {
          type: String,
          enum: ["low", "medium", "high", "transformative"],
          default: "medium",
        },
        urgency: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          default: "medium",
        },
      },
    },
    // Motivation and psychology
    motivation: {
      // Why this goal matters
      reasons: [String],
      // Expected benefits
      benefits: [String],
      // Potential obstacles
      obstacles: [String],
      // Strategies to overcome obstacles
      strategies: [String],
      // Accountability partners
      accountability: [{
        person: String,
        role: {
          type: String,
          enum: ["mentor", "peer", "coach", "family", "friend"],
        },
        contact: String,
      }],
      // Rewards and consequences
      rewards: [{
        milestone: String,
        reward: String,
        type: {
          type: String,
          enum: ["intrinsic", "extrinsic"],
        },
      }],
    },
    // Habit tracking (for habit-type goals)
    habitTracking: {
      enabled: {
        type: Boolean,
        default: false,
      },
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
        default: "daily",
      },
      targetFrequency: Number, // e.g., 5 times per week
      currentStreak: {
        type: Number,
        default: 0,
      },
      longestStreak: {
        type: Number,
        default: 0,
      },
      // Daily tracking data
      entries: [{
        date: Date,
        completed: Boolean,
        value: Number, // for quantitative habits
        note: String,
        mood: {
          type: String,
          enum: ["great", "good", "okay", "difficult", "terrible"],
        },
      }],
    },
    // Status and lifecycle
    status: {
      type: String,
      enum: [
        "draft",           // Still being planned
        "active",          // Currently working on
        "paused",          // Temporarily suspended
        "completed",       // Successfully achieved
        "abandoned",       // Given up on
        "archived",        // Moved to archive
        "overdue"          // Past due date without completion
      ],
      default: "draft",
    },
    // Completion tracking
    completion: {
      completedAt: Date,
      completionMethod: {
        type: String,
        enum: ["full_achievement", "partial_completion", "milestone_based", "time_expired"],
      },
      finalValue: Number,
      achievementRate: Number, // Percentage of target achieved
      notes: String,
      reflection: String, // What was learned
      celebrationPlan: String,
    },
    // Review and reflection
    reviews: [{
      date: Date,
      type: {
        type: String,
        enum: ["weekly", "monthly", "quarterly", "milestone", "final"],
      },
      progress: Number, // Progress at time of review
      insights: String,
      adjustments: String, // What was changed
      challenges: String,
      successes: String,
      nextSteps: String,
      confidence: {
        type: Number,
        min: 1,
        max: 10,
      }, // Confidence in achieving goal
    }],
    // AI and smart features
    smartFeatures: {
      // AI-generated suggestions
      suggestions: [{
        type: {
          type: String,
          enum: [
            "adjust_target",
            "change_timeline", 
            "break_down_goal",
            "add_milestone",
            "link_task",
            "increase_frequency",
            "find_accountability",
            "strategy_suggestion"
          ],
        },
        suggestion: String,
        reasoning: String,
        confidence: {
          type: Number,
          min: 0,
          max: 1,
        },
        accepted: {
          type: Boolean,
          default: false,
        },
        createdAt: Date,
      }],
      // Predictive analytics
      predictions: {
        completionProbability: Number, // 0-1
        projectedEndDate: Date,
        riskFactors: [String],
        successFactors: [String],
        adjustmentRecommendations: [String],
      },
    },
    // Reminders and notifications
    reminders: [{
      type: {
        type: String,
        enum: ["progress_check", "milestone_due", "review_scheduled", "motivation_boost"],
      },
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "custom"],
      },
      customSchedule: String, // Cron expression for custom frequency
      enabled: {
        type: Boolean,
        default: true,
      },
      lastSent: Date,
      nextDue: Date,
    }],
    // Collaboration and sharing
    collaboration: {
      // Sharing settings
      sharing: {
        level: {
          type: String,
          enum: ["private", "team", "public"],
          default: "private",
        },
        allowComments: {
          type: Boolean,
          default: false,
        },
        allowSupport: {
          type: Boolean,
          default: false,
        },
      },
      // Collaborators
      collaborators: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["viewer", "supporter", "co-owner"],
          default: "viewer",
        },
        addedAt: Date,
      }],
      // Comments and support
      comments: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        message: String,
        type: {
          type: String,
          enum: ["encouragement", "advice", "question", "update"],
        },
        createdAt: Date,
        replies: [{
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          message: String,
          createdAt: Date,
        }],
      }],
    },
    // Analytics and insights
    analytics: {
      // Progress tracking
      progressHistory: [{
        date: Date,
        value: Number,
        percentage: Number,
        note: String,
      }],
      // Time analytics
      timeSpent: {
        total: {
          type: Number,
          default: 0,
        }, // minutes
        byDay: [{
          date: Date,
          minutes: Number,
        }],
        byWeek: [{
          weekStart: Date,
          minutes: Number,
        }],
      },
      // Performance metrics
      performance: {
        averageDailyProgress: Number,
        consistencyScore: Number, // 0-100
        momentumScore: Number,    // 0-100
        efficiencyScore: Number,  // 0-100
        adherenceRate: Number,    // 0-100
      },
      // Behavioral insights
      insights: [{
        type: {
          type: String,
          enum: [
            "peak_performance_time",
            "progress_pattern",
            "obstacle_pattern",
            "motivation_trigger",
            "success_factor"
          ],
        },
        insight: String,
        confidence: Number,
        discoveredAt: Date,
        actionable: Boolean,
      }],
    },
    // Templates and reusability
    template: {
      isTemplate: {
        type: Boolean,
        default: false,
      },
      templateName: String,
      templateDescription: String,
      templateCategory: String,
      usageCount: {
        type: Number,
        default: 0,
      },
      rating: {
        average: Number,
        count: Number,
      },
      createdFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Goal",
      },
    },
    // Metadata
    metadata: {
      source: {
        type: String,
        enum: ["manual", "template", "ai_generated", "imported"],
        default: "manual",
      },
      difficulty: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
      },
      estimatedTimeCommitment: String, // "30 min/day", "5 hours/week"
      requiredResources: [String],
      skillsRequired: [String],
      skillsToGain: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
goalSchema.index({ user: 1, status: 1 });
goalSchema.index({ user: 1, type: 1 });
goalSchema.index({ user: 1, scope: 1 });
goalSchema.index({ "timeframe.endDate": 1, status: 1 });
goalSchema.index({ "priority.level": 1, "priority.score": -1 });
goalSchema.index({ "template.isTemplate": 1, "template.templateCategory": 1 });

// Pre-save middleware to calculate duration and validate dates
goalSchema.pre('save', function(next) {
  // Calculate duration
  if (this.timeframe.startDate && this.timeframe.endDate) {
    const diffTime = Math.abs(this.timeframe.endDate - this.timeframe.startDate);
    this.timeframe.duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // Update progress percentage
  if (this.measurement.type === 'numeric' && this.measurement.target.value > 0) {
    this.measurement.progress.percentage = Math.min(100, 
      (this.measurement.current.value / this.measurement.target.value) * 100
    );
  }
  
  // Update status based on dates and completion
  if (this.measurement.progress.percentage >= 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completion.completedAt = new Date();
    this.completion.achievementRate = 100;
  } else if (new Date() > this.timeframe.endDate && this.status === 'active') {
    this.status = 'overdue';
  }
  
  next();
});

// Method to update progress
goalSchema.methods.updateProgress = async function(value, method = 'manual', note = '') {
  this.measurement.current.value = value;
  this.measurement.current.lastUpdated = new Date();
  this.measurement.current.updateMethod = method;
  
  // Add to progress history
  this.analytics.progressHistory.push({
    date: new Date(),
    value: value,
    percentage: this.measurement.progress.percentage,
    note: note,
  });
  
  // Keep only last 100 progress entries
  if (this.analytics.progressHistory.length > 100) {
    this.analytics.progressHistory = this.analytics.progressHistory.slice(-100);
  }
  
  // Calculate velocity and projected completion
  await this.calculateVelocityAndProjection();
  
  // Update habit streak if applicable
  if (this.habitTracking.enabled) {
    await this.updateHabitStreak();
  }
  
  return this.save();
};

// Method to calculate velocity and projection
goalSchema.methods.calculateVelocityAndProjection = async function() {
  const history = this.analytics.progressHistory.slice(-30); // Last 30 entries
  
  if (history.length < 2) return;
  
  // Calculate velocity (progress per day)
  const firstEntry = history[0];
  const lastEntry = history[history.length - 1];
  const daysDiff = (lastEntry.date - firstEntry.date) / (1000 * 60 * 60 * 24);
  
  if (daysDiff > 0) {
    const progressDiff = lastEntry.value - firstEntry.value;
    this.measurement.progress.velocity = progressDiff / daysDiff;
    
    // Project completion date
    if (this.measurement.progress.velocity > 0) {
      const remainingProgress = this.measurement.target.value - this.measurement.current.value;
      const daysToCompletion = remainingProgress / this.measurement.progress.velocity;
      
      this.measurement.progress.projectedCompletion = new Date(
        Date.now() + daysToCompletion * 24 * 60 * 60 * 1000
      );
    }
  }
  
  // Update trend
  if (history.length >= 5) {
    const recentEntries = history.slice(-5);
    const trend = this.calculateTrend(recentEntries);
    this.measurement.progress.trend = trend;
  }
};

// Helper method to calculate trend
goalSchema.methods.calculateTrend = function(entries) {
  if (entries.length < 2) return 'unknown';
  
  let increases = 0;
  let decreases = 0;
  
  for (let i = 1; i < entries.length; i++) {
    if (entries[i].value > entries[i - 1].value) {
      increases++;
    } else if (entries[i].value < entries[i - 1].value) {
      decreases++;
    }
  }
  
  if (increases > decreases) return 'improving';
  if (decreases > increases) return 'declining';
  return 'stable';
};

// Method to update habit streak
goalSchema.methods.updateHabitStreak = async function() {
  if (!this.habitTracking.enabled) return;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayEntry = this.habitTracking.entries.find(entry => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });
  
  if (todayEntry && todayEntry.completed) {
    // Check if yesterday was also completed for streak calculation
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayEntry = this.habitTracking.entries.find(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === yesterday.getTime();
    });
    
    if (yesterdayEntry && yesterdayEntry.completed) {
      this.habitTracking.currentStreak++;
    } else {
      this.habitTracking.currentStreak = 1;
    }
    
    this.habitTracking.longestStreak = Math.max(
      this.habitTracking.longestStreak,
      this.habitTracking.currentStreak
    );
  } else if (todayEntry && !todayEntry.completed) {
    this.habitTracking.currentStreak = 0;
  }
};

// Method to add habit entry
goalSchema.methods.addHabitEntry = async function(date, completed, value = null, note = '', mood = null) {
  const entryDate = new Date(date);
  entryDate.setHours(0, 0, 0, 0);
  
  // Remove existing entry for this date
  this.habitTracking.entries = this.habitTracking.entries.filter(entry => {
    const existingDate = new Date(entry.date);
    existingDate.setHours(0, 0, 0, 0);
    return existingDate.getTime() !== entryDate.getTime();
  });
  
  // Add new entry
  this.habitTracking.entries.push({
    date: entryDate,
    completed,
    value,
    note,
    mood,
  });
  
  // Sort entries by date
  this.habitTracking.entries.sort((a, b) => a.date - b.date);
  
  // Update progress based on habit completion
  if (this.measurement.type === 'habit_frequency') {
    await this.updateHabitProgress();
  }
  
  return this.save();
};

// Method to update progress based on habit frequency
goalSchema.methods.updateHabitProgress = async function() {
  const now = new Date();
  const periodStart = new Date(this.timeframe.startDate);
  
  // Calculate expected and actual completions
  let expectedCompletions = 0;
  let actualCompletions = 0;
  
  const daysSinceStart = Math.floor((now - periodStart) / (1000 * 60 * 60 * 24));
  
  switch (this.habitTracking.frequency) {
    case 'daily':
      expectedCompletions = daysSinceStart;
      break;
    case 'weekly':
      expectedCompletions = Math.floor(daysSinceStart / 7) * this.habitTracking.targetFrequency;
      break;
    case 'monthly':
      expectedCompletions = Math.floor(daysSinceStart / 30) * this.habitTracking.targetFrequency;
      break;
  }
  
  actualCompletions = this.habitTracking.entries.filter(entry => 
    entry.completed && entry.date >= periodStart && entry.date <= now
  ).length;
  
  // Update current value
  this.measurement.current.value = actualCompletions;
  
  // If target is set, update progress percentage
  if (this.measurement.target.value > 0) {
    this.measurement.progress.percentage = Math.min(100,
      (actualCompletions / this.measurement.target.value) * 100
    );
  }
};

// Method to add milestone
goalSchema.methods.addMilestone = async function(milestoneData) {
  this.structure.milestones.push({
    ...milestoneData,
    completed: false,
  });
  
  // Sort milestones by target date
  this.structure.milestones.sort((a, b) => a.targetDate - b.targetDate);
  
  return this.save();
};

// Method to complete milestone
goalSchema.methods.completeMilestone = async function(milestoneId) {
  const milestone = this.structure.milestones.id(milestoneId);
  if (!milestone) throw new Error('Milestone not found');
  
  milestone.completed = true;
  milestone.completedAt = new Date();
  
  // Check if this milestone completion affects overall progress
  if (this.measurement.type === 'milestone_based') {
    const completedMilestones = this.structure.milestones.filter(m => m.completed).length;
    const totalMilestones = this.structure.milestones.length;
    
    this.measurement.progress.percentage = (completedMilestones / totalMilestones) * 100;
    this.measurement.current.value = completedMilestones;
  }
  
  return this.save();
};

// Method to add review
goalSchema.methods.addReview = async function(reviewData) {
  this.reviews.push({
    ...reviewData,
    date: new Date(),
    progress: this.measurement.progress.percentage,
  });
  
  // Generate AI suggestions based on review
  await this.generateSmartSuggestions();
  
  return this.save();
};

// Method to generate smart suggestions
goalSchema.methods.generateSmartSuggestions = async function() {
  const suggestions = [];
  
  // Analyze progress and generate suggestions
  const progress = this.measurement.progress.percentage;
  const timeElapsed = (new Date() - this.timeframe.startDate) / (this.timeframe.endDate - this.timeframe.startDate);
  const expectedProgress = timeElapsed * 100;
  
  // If behind schedule
  if (progress < expectedProgress * 0.8) {
    suggestions.push({
      type: 'adjust_target',
      suggestion: 'Consider adjusting your target or timeline to make the goal more achievable',
      reasoning: 'Current progress is significantly behind schedule',
      confidence: 0.8,
      createdAt: new Date(),
    });
    
    suggestions.push({
      type: 'break_down_goal',
      suggestion: 'Break this goal into smaller, more manageable milestones',
      reasoning: 'Smaller milestones can help maintain momentum and motivation',
      confidence: 0.7,
      createdAt: new Date(),
    });
  }
  
  // If habit-based goal with low consistency
  if (this.habitTracking.enabled && this.habitTracking.currentStreak < 3) {
    suggestions.push({
      type: 'increase_frequency',
      suggestion: 'Try starting with a smaller, more consistent habit',
      reasoning: 'Current streak is low, suggesting the habit might be too ambitious',
      confidence: 0.9,
      createdAt: new Date(),
    });
  }
  
  // If no accountability partners
  if (this.motivation.accountability.length === 0) {
    suggestions.push({
      type: 'find_accountability',
      suggestion: 'Consider finding an accountability partner to increase success rate',
      reasoning: 'Goals with accountability partners have higher completion rates',
      confidence: 0.6,
      createdAt: new Date(),
    });
  }
  
  this.smartFeatures.suggestions.push(...suggestions);
  
  // Keep only last 10 suggestions
  if (this.smartFeatures.suggestions.length > 10) {
    this.smartFeatures.suggestions = this.smartFeatures.suggestions.slice(-10);
  }
};

// Method to calculate success probability
goalSchema.methods.calculateSuccessProbability = function() {
  let probability = 0.5; // Base probability
  
  // Factor in current progress
  const progressFactor = this.measurement.progress.percentage / 100;
  probability += progressFactor * 0.3;
  
  // Factor in consistency (for habit goals)
  if (this.habitTracking.enabled) {
    const consistency = this.habitTracking.entries.filter(e => e.completed).length / 
                       Math.max(1, this.habitTracking.entries.length);
    probability += consistency * 0.2;
  }
  
  // Factor in time remaining
  const timeRemaining = (this.timeframe.endDate - new Date()) / 
                       (this.timeframe.endDate - this.timeframe.startDate);
  if (timeRemaining > 0) {
    probability += Math.min(timeRemaining, 0.2);
  } else {
    probability -= 0.3; // Penalty for overdue goals
  }
  
  // Factor in milestone completion
  if (this.structure.milestones.length > 0) {
    const milestoneCompletion = this.structure.milestones.filter(m => m.completed).length / 
                               this.structure.milestones.length;
    probability += milestoneCompletion * 0.2;
  }
  
  this.smartFeatures.predictions.completionProbability = Math.max(0, Math.min(1, probability));
  return this.smartFeatures.predictions.completionProbability;
};

// Static method to find goals by status
goalSchema.statics.findByStatus = function(userId, status) {
  return this.find({ user: userId, status: status });
};

// Static method to find active goals
goalSchema.statics.findActive = function(userId) {
  return this.find({ 
    user: userId, 
    status: 'active',
    'timeframe.endDate': { $gte: new Date() }
  });
};

// Static method to find overdue goals
goalSchema.statics.findOverdue = function(userId) {
  return this.find({
    user: userId,
    status: { $in: ['active', 'overdue'] },
    'timeframe.endDate': { $lt: new Date() },
    'measurement.progress.percentage': { $lt: 100 }
  });
};

// Static method to get goal templates
goalSchema.statics.getTemplates = function(category = null) {
  const query = { 'template.isTemplate': true };
  if (category) {
    query['template.templateCategory'] = category;
  }
  
  return this.find(query).sort({ 'template.rating.average': -1, 'template.usageCount': -1 });
};

// Virtual for completion percentage
goalSchema.virtual('completionPercentage').get(function() {
  return this.measurement.progress.percentage;
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const endDate = new Date(this.timeframe.endDate);
  
  if (endDate < now) return 0;
  
  return Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
});

// Virtual for is overdue
goalSchema.virtual('isOverdue').get(function() {
  return new Date() > this.timeframe.endDate && this.status !== 'completed';
});

const Goal = mongoose.model("Goal", goalSchema);

module.exports = Goal;