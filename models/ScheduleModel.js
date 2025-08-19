const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Associated task
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    // Scheduled time details
    scheduledStart: {
      type: Date,
      required: true,
    },
    scheduledEnd: {
      type: Date,
      required: true,
    },
    // Actual execution times
    actualStart: Date,
    actualEnd: Date,
    // Schedule type
    scheduleType: {
      type: String,
      enum: [
        "ai_suggested",    // AI-optimized scheduling
        "user_defined",    // Manually set by user
        "auto_scheduled",  // Automatically placed in calendar
        "recurring",       // Part of recurring pattern
        "dependency_driven" // Scheduled based on dependencies
      ],
      default: "user_defined",
    },
    // AI scheduling factors
    aiFactors: {
      // Confidence in this scheduling suggestion
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5,
      },
      // Factors considered in scheduling decision
      factorsConsidered: [{
        factor: {
          type: String,
          enum: [
            "user_productivity_pattern",
            "historical_performance",
            "energy_levels",
            "context_switching_cost",
            "deadline_pressure",
            "calendar_availability",
            "location_context",
            "dependency_chain",
            "workload_balance",
            "interruption_likelihood"
          ],
        },
        weight: Number, // 0-1
        score: Number,  // how well this slot matches this factor
      }],
      // Overall scheduling score
      overallScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
      },
    },
    // Context at scheduling time
    context: {
      // Calendar context
      calendar: {
        meetings_before: Number, // minutes before this slot
        meetings_after: Number,  // minutes after this slot
        available_buffer: Number, // available buffer time
        conflict_risk: Number,    // 0-1 probability of conflicts
      },
      // Location context
      location: {
        suggested_location: String,
        location_type: {
          type: String,
          enum: ["home", "office", "remote", "travel", "flexible"],
        },
        travel_time_before: Number, // minutes
        travel_time_after: Number,
      },
      // Environment context
      environment: {
        noise_level: {
          type: String,
          enum: ["quiet", "moderate", "noisy"],
        },
        interruption_likelihood: {
          type: String,
          enum: ["low", "medium", "high"],
        },
        collaboration_opportunities: Boolean,
      },
      // Resource availability
      resources: {
        tools_available: [String],
        people_available: [String],
        internet_quality: {
          type: String,
          enum: ["poor", "good", "excellent"],
        },
      },
    },
    // Time blocking details
    timeBlock: {
      // Type of time block
      blockType: {
        type: String,
        enum: [
          "focus_time",     // Deep work, no interruptions
          "collaboration",  // Meeting/teamwork time
          "admin",          // Administrative tasks
          "creative",       // Creative work
          "learning",       // Study/research time
          "maintenance",    // Routine tasks
          "buffer"          // Buffer time between tasks
        ],
      },
      // Block characteristics
      characteristics: {
        requires_focus: Boolean,
        allows_interruptions: Boolean,
        energy_level_required: {
          type: String,
          enum: ["low", "medium", "high"],
        },
        collaboration_level: {
          type: String,
          enum: ["solo", "paired", "team"],
        },
      },
      // Associated time blocks (for batching similar tasks)
      batchedWith: [{
        task: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Task",
        },
        schedule: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Schedule",
        },
      }],
    },
    // Flexibility settings
    flexibility: {
      // How flexible this schedule is
      flexibilityLevel: {
        type: String,
        enum: ["fixed", "preferred", "flexible", "very_flexible"],
        default: "preferred",
      },
      // Acceptable time windows for rescheduling
      timeWindows: [{
        start: Date,
        end: Date,
        preference: Number, // 0-1, higher = more preferred
      }],
      // Maximum acceptable delay
      maxDelay: Number, // in minutes
      // Minimum notice for changes
      minNotice: Number, // in minutes
    },
    // Status tracking
    status: {
      type: String,
      enum: [
        "scheduled",      // Scheduled but not started
        "in_progress",    // Currently being worked on
        "completed",      // Successfully completed
        "postponed",      // Moved to different time
        "cancelled",      // Cancelled
        "overrun",        // Running longer than scheduled
        "conflict"        // Scheduling conflict detected
      ],
      default: "scheduled",
    },
    // Performance metrics
    performance: {
      // How well the scheduled time worked
      effectiveness: {
        type: Number,
        min: 0,
        max: 100,
      },
      // User satisfaction with this scheduling
      satisfaction: {
        type: Number,
        min: 1,
        max: 5,
      },
      // Actual vs estimated duration variance
      durationVariance: Number, // percentage
      // Whether the task was completed in the scheduled time
      completedOnTime: Boolean,
      // Interruptions during scheduled time
      interruptions: [{
        time: Date,
        duration: Number, // minutes
        type: String,
        impact: {
          type: String,
          enum: ["low", "medium", "high"],
        },
      }],
    },
    // Recurring schedule information
    recurringInfo: {
      isRecurring: {
        type: Boolean,
        default: false,
      },
      pattern: {
        type: String,
        enum: ["daily", "weekly", "monthly", "custom"],
      },
      interval: Number,
      endDate: Date,
      exceptions: [Date], // dates to skip
    },
    // Notifications and reminders
    reminders: [{
      type: {
        type: String,
        enum: ["start_reminder", "prep_reminder", "overrun_warning", "completion_reminder"],
      },
      timeOffset: Number, // minutes before start
      sent: {
        type: Boolean,
        default: false,
      },
      sentAt: Date,
    }],
    // Dependencies and conflicts
    dependencies: [{
      type: {
        type: String,
        enum: ["must_start_after", "must_finish_before", "cannot_overlap"],
      },
      relatedSchedule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Schedule",
      },
      task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    }],
    // Optimization data
    optimization: {
      // Alternative time slots considered
      alternatives: [{
        start: Date,
        end: Date,
        score: Number,
        reasons: [String],
      }],
      // Last optimization run
      lastOptimized: Date,
      // Optimization version (for A/B testing different algorithms)
      algorithmVersion: String,
      // Whether this schedule was changed from original AI suggestion
      userModified: {
        type: Boolean,
        default: false,
      },
      modificationReason: String,
    },
    // Integration data
    integrations: {
      // Google Calendar event ID
      googleCalendarEventId: String,
      // Other calendar system IDs
      outlookEventId: String,
      appleCalendarEventId: String,
      // Sync status
      syncStatus: {
        type: String,
        enum: ["synced", "pending", "failed", "manual"],
        default: "manual",
      },
      lastSyncAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
scheduleSchema.index({ user: 1, scheduledStart: 1 });
scheduleSchema.index({ user: 1, task: 1 });
scheduleSchema.index({ user: 1, status: 1 });
scheduleSchema.index({ scheduledStart: 1, scheduledEnd: 1 });
scheduleSchema.index({ user: 1, "timeBlock.blockType": 1 });

// Compound index for finding conflicts
scheduleSchema.index({ 
  user: 1, 
  scheduledStart: 1, 
  scheduledEnd: 1,
  status: 1 
});

// Method to detect scheduling conflicts
scheduleSchema.methods.detectConflicts = async function() {
  const conflicts = await this.model('Schedule').find({
    user: this.user,
    _id: { $ne: this._id },
    status: { $in: ["scheduled", "in_progress"] },
    $or: [
      // Overlapping schedules
      {
        scheduledStart: { $lt: this.scheduledEnd },
        scheduledEnd: { $gt: this.scheduledStart }
      }
    ]
  });
  
  return conflicts;
};

// Method to calculate scheduling score
scheduleSchema.methods.calculateSchedulingScore = async function() {
  const UserPattern = mongoose.model('UserPattern');
  const userPattern = await UserPattern.findOne({ user: this.user });
  
  if (!userPattern) {
    this.aiFactors.overallScore = 50; // Default score
    return this.save();
  }
  
  let totalScore = 0;
  let totalWeight = 0;
  
  // Analyze each factor
  this.aiFactors.factorsConsidered.forEach(factor => {
    let score = 50; // Default score
    
    switch (factor.factor) {
      case "user_productivity_pattern":
        score = this.calculateProductivityScore(userPattern);
        break;
      case "energy_levels":
        score = this.calculateEnergyScore(userPattern);
        break;
      case "deadline_pressure":
        score = this.calculateDeadlineScore();
        break;
      case "workload_balance":
        score = this.calculateWorkloadScore();
        break;
    }
    
    factor.score = score;
    totalScore += score * factor.weight;
    totalWeight += factor.weight;
  });
  
  this.aiFactors.overallScore = totalWeight > 0 ? totalScore / totalWeight : 50;
  return this.save();
};

// Helper method to calculate productivity score for this time slot
scheduleSchema.methods.calculateProductivityScore = function(userPattern) {
  const hour = this.scheduledStart.getHours();
  const dayOfWeek = this.scheduledStart.getDay();
  
  // Check if this time falls within peak hours
  const peakHours = userPattern.productivityPatterns.peakHours || [];
  let isInPeakHours = false;
  
  for (const peak of peakHours) {
    const startHour = parseInt(peak.start.split(':')[0]);
    const endHour = parseInt(peak.end.split(':')[0]);
    
    if (hour >= startHour && hour <= endHour && peak.days.includes(dayOfWeek)) {
      isInPeakHours = true;
      break;
    }
  }
  
  return isInPeakHours ? 85 : 40;
};

// Helper method to calculate energy score
scheduleSchema.methods.calculateEnergyScore = function(userPattern) {
  const hour = this.scheduledStart.getHours();
  const energyLevels = userPattern.productivityPatterns.energyLevels || [];
  
  const energyData = energyLevels.find(el => el.hour === hour);
  if (energyData) {
    return energyData.energy;
  }
  
  // Default energy patterns (morning high, afternoon dip, evening medium)
  if (hour >= 9 && hour <= 11) return 80;
  if (hour >= 14 && hour <= 16) return 30;
  if (hour >= 19 && hour <= 21) return 60;
  return 50;
};

// Helper method to calculate deadline pressure score
scheduleSchema.methods.calculateDeadlineScore = async function() {
  const Task = mongoose.model('Task');
  const task = await Task.findById(this.task);
  
  if (!task || !task.deadline) return 50;
  
  const timeUntilDeadline = task.deadline.getTime() - this.scheduledStart.getTime();
  const daysUntilDeadline = timeUntilDeadline / (1000 * 60 * 60 * 24);
  
  // Higher score for tasks closer to deadline
  if (daysUntilDeadline <= 1) return 90;
  if (daysUntilDeadline <= 3) return 75;
  if (daysUntilDeadline <= 7) return 60;
  return 40;
};

// Helper method to calculate workload balance score
scheduleSchema.methods.calculateWorkloadScore = async function() {
  const dayStart = new Date(this.scheduledStart);
  dayStart.setHours(0, 0, 0, 0);
  
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  
  // Count other scheduled tasks for this day
  const daySchedules = await this.model('Schedule').find({
    user: this.user,
    scheduledStart: { $gte: dayStart, $lt: dayEnd },
    _id: { $ne: this._id },
    status: { $in: ["scheduled", "in_progress"] }
  });
  
  // Calculate total scheduled time for the day
  const totalScheduledMinutes = daySchedules.reduce((total, schedule) => {
    const duration = (schedule.scheduledEnd - schedule.scheduledStart) / (1000 * 60);
    return total + duration;
  }, 0);
  
  // Score based on workload (lower score for overloaded days)
  if (totalScheduledMinutes < 240) return 80; // Less than 4 hours
  if (totalScheduledMinutes < 480) return 60; // Less than 8 hours
  if (totalScheduledMinutes < 600) return 40; // Less than 10 hours
  return 20; // Overloaded day
};

// Static method to suggest optimal time slots for a task
scheduleSchema.statics.suggestOptimalSlots = async function(userId, taskId, options = {}) {
  const Task = mongoose.model('Task');
  const UserPattern = mongoose.model('UserPattern');
  
  const task = await Task.findById(taskId);
  const userPattern = await UserPattern.findOne({ user: userId });
  
  if (!task) return [];
  
  const {
    startDate = new Date(),
    endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    duration = task.estimatedDuration || 60, // in minutes
    maxSuggestions = 5
  } = options;
  
  const suggestions = [];
  
  // Generate time slots for each day in the range
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const daySlots = await this.generateDaySlots(userId, date, duration, userPattern);
    suggestions.push(...daySlots);
  }
  
  // Score and sort suggestions
  const scoredSuggestions = await Promise.all(
    suggestions.map(async (slot) => {
      const tempSchedule = new this({
        user: userId,
        task: taskId,
        scheduledStart: slot.start,
        scheduledEnd: slot.end,
        aiFactors: {
          factorsConsidered: [
            { factor: "user_productivity_pattern", weight: 0.3, score: 0 },
            { factor: "energy_levels", weight: 0.2, score: 0 },
            { factor: "deadline_pressure", weight: 0.2, score: 0 },
            { factor: "workload_balance", weight: 0.3, score: 0 },
          ]
        }
      });
      
      await tempSchedule.calculateSchedulingScore();
      
      return {
        ...slot,
        score: tempSchedule.aiFactors.overallScore,
        factors: tempSchedule.aiFactors.factorsConsidered
      };
    })
  );
  
  return scoredSuggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions);
};

// Helper method to generate time slots for a specific day
scheduleSchema.statics.generateDaySlots = async function(userId, date, duration, userPattern) {
  const slots = [];
  const workStart = 9; // 9 AM
  const workEnd = 18;  // 6 PM
  
  // Get existing schedules for this day
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  
  const existingSchedules = await this.find({
    user: userId,
    scheduledStart: { $gte: dayStart, $lt: dayEnd },
    status: { $in: ["scheduled", "in_progress"] }
  }).sort({ scheduledStart: 1 });
  
  // Generate potential slots
  for (let hour = workStart; hour < workEnd; hour++) {
    for (let minute = 0; minute < 60; minute += 30) { // 30-minute intervals
      const slotStart = new Date(date);
      slotStart.setHours(hour, minute, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);
      
      // Skip if slot extends beyond work hours
      if (slotEnd.getHours() >= workEnd) continue;
      
      // Check for conflicts with existing schedules
      const hasConflict = existingSchedules.some(schedule => {
        return (slotStart < schedule.scheduledEnd && slotEnd > schedule.scheduledStart);
      });
      
      if (!hasConflict) {
        slots.push({
          start: slotStart,
          end: slotEnd,
          duration: duration
        });
      }
    }
  }
  
  return slots;
};

// Method to optimize schedule
scheduleSchema.methods.optimize = async function() {
  // Get alternative time slots
  const alternatives = await this.model('Schedule').suggestOptimalSlots(
    this.user, 
    this.task, 
    {
      startDate: this.scheduledStart,
      duration: (this.scheduledEnd - this.scheduledStart) / (1000 * 60),
      maxSuggestions: 3
    }
  );
  
  this.optimization.alternatives = alternatives.map(alt => ({
    start: alt.start,
    end: alt.end,
    score: alt.score,
    reasons: alt.factors.map(f => `${f.factor}: ${f.score}`)
  }));
  
  this.optimization.lastOptimized = new Date();
  return this.save();
};

// Method to mark as completed and record performance
scheduleSchema.methods.markCompleted = function(actualEnd = new Date(), effectiveness = null, satisfaction = null) {
  this.status = "completed";
  this.actualEnd = actualEnd;
  
  if (this.actualStart) {
    const actualDuration = (actualEnd - this.actualStart) / (1000 * 60);
    const scheduledDuration = (this.scheduledEnd - this.scheduledStart) / (1000 * 60);
    this.performance.durationVariance = ((actualDuration - scheduledDuration) / scheduledDuration) * 100;
    this.performance.completedOnTime = actualEnd <= this.scheduledEnd;
  }
  
  if (effectiveness !== null) this.performance.effectiveness = effectiveness;
  if (satisfaction !== null) this.performance.satisfaction = satisfaction;
  
  return this.save();
};

const Schedule = mongoose.model("Schedule", scheduleSchema);

module.exports = Schedule;