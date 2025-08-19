const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please add a title"],
    },
    description: {
      type: String,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    // Smart prioritization score (calculated by algorithm)
    priorityScore: {
      type: Number,
      default: 0,
    },
    // Categories and tags
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    tags: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
    }],
    // Progress tracking
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    // Subtasks for detailed progress tracking
    subtasks: [{
      title: {
        type: String,
        required: true,
      },
      completed: {
        type: Boolean,
        default: false,
      },
      completedAt: Date,
    }],
    // Task dependencies
    dependencies: [{
      task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
      type: {
        type: String,
        enum: ["blocks", "subtask_of", "related"],
        default: "blocks",
      },
    }],
    dependents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    }],
    // Recurring task support
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      type: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly", "custom"],
      },
      interval: Number, // every X days/weeks/months
      daysOfWeek: [Number], // 0-6 for Sunday-Saturday
      dayOfMonth: Number, // 1-31
      endDate: Date,
      maxOccurrences: Number,
    },
    parentRecurringTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    // Time tracking and estimation
    estimatedDuration: {
      type: Number, // in minutes
    },
    actualDuration: {
      type: Number, // in minutes
    },
    timeSpent: {
      type: Number,
      default: 0, // in minutes
    },
    // Smart scheduling
    suggestedStartTime: Date,
    suggestedDuration: Number, // in minutes
    schedulingScore: Number,
    // Reminders with enhanced features
    reminders: [{
      date: Date,
      type: {
        type: String,
        enum: ["time", "location", "smart"],
        default: "time",
      },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          required: false,
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: false,
        },
        name: String, // location name
        radius: Number, // in meters
      },
      message: String,
      sent: {
        type: Boolean,
        default: false,
      },
    }],
    // Deadlines and dates
    deadline: Date,
    dueDate: Date,
    startDate: Date,
    // Context for AI suggestions
    context: {
      location: String,
      weather: String,
      timeOfDay: String,
      energy_level: String,
    },
    // Natural language processing
    naturalLanguageInput: String,
    parsedAttributes: {
      extractedDate: Date,
      extractedTime: String,
      extractedLocation: String,
      extractedPriority: String,
    },
    // Completion tracking
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
    // Analytics
    views: {
      type: Number,
      default: 0,
    },
    modifications: {
      type: Number,
      default: 0,
    },
    postponements: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// taskSchema.set('strictPopulate', false);
taskSchema.index({ user: 1, completed: 1 });
taskSchema.index({ user: 1, priority: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, category: 1 });
taskSchema.index({ "reminders.location": "2dsphere" });
taskSchema.index({ priorityScore: -1 });
taskSchema.index({ deadline: 1 });

// Middleware to update progress based on subtasks
taskSchema.pre('save', function(next) {
  if (this.subtasks && this.subtasks.length > 0) {
    const completedSubtasks = this.subtasks.filter(subtask => subtask.completed).length;
    this.progress = Math.round((completedSubtasks / this.subtasks.length) * 100);
  }
  
  // Mark as completed if progress is 100%
  if (this.progress === 100 && !this.completed) {
    this.completed = true;
    this.completedAt = new Date();
  }
  
  next();
});

// Method to calculate priority score
taskSchema.methods.calculatePriorityScore = function() {
  let score = 0;
  
  // Base priority weight
  const priorityWeights = { low: 1, medium: 2, high: 3, urgent: 4 };
  score += priorityWeights[this.priority] * 25;
  
  // Deadline urgency
  if (this.deadline) {
    const daysUntilDeadline = Math.ceil((this.deadline - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilDeadline <= 1) score += 40;
    else if (daysUntilDeadline <= 3) score += 30;
    else if (daysUntilDeadline <= 7) score += 20;
    else if (daysUntilDeadline <= 14) score += 10;
  }
  
  // Dependencies weight
  score += this.dependents.length * 5;
  
  // Postponement penalty
  score += this.postponements * 5;
  
  this.priorityScore = Math.min(score, 100);
  return this.priorityScore;
};

// Method to check if task can be started (dependencies met)
taskSchema.methods.canStart = async function() {
  if (!this.dependencies.length) return true;
  
  for (const dep of this.dependencies) {
    const dependentTask = await this.model('Task').findById(dep.task);
    if (!dependentTask || !dependentTask.completed) {
      return false;
    }
  }
  return true;
};

// Method to generate next recurring instance
taskSchema.methods.generateNextRecurrence = function() {
  if (!this.isRecurring || !this.recurringPattern) return null;
  
  const nextTask = this.toObject();
  delete nextTask._id;
  delete nextTask.createdAt;
  delete nextTask.updatedAt;
  
  const pattern = this.recurringPattern;
  let nextDate = new Date(this.dueDate || this.createdAt);
  
  switch (pattern.type) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + (pattern.interval || 1));
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + ((pattern.interval || 1) * 7));
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + (pattern.interval || 1));
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + (pattern.interval || 1));
      break;
  }
  
  nextTask.dueDate = nextDate;
  nextTask.completed = false;
  nextTask.completedAt = null;
  nextTask.progress = 0;
  nextTask.subtasks = nextTask.subtasks.map(st => ({ ...st, completed: false, completedAt: null }));
  nextTask.parentRecurringTask = this._id;
  
  return nextTask;
};

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;