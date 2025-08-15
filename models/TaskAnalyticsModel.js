const mongoose = require("mongoose");

const taskAnalyticsSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // AI-calculated fields
    aiPriorityScore: { type: Number, min: 0, max: 100 },
    estimatedDuration: { type: Number }, // in minutes
    suggestedSchedule: Date,

    // Categorization and context
    category: String,
    tags: [String],
    contextTags: [String], // AI-generated context

    // Dependencies
    dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    dependents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],

    // Recurring task info
    recurring: {
      isRecurring: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
      },
      interval: { type: Number, default: 1 },
      daysOfWeek: [Number], // 0-6 for weekly recurring
      endDate: Date,
      nextOccurrence: Date,
      parentTaskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    },

    // Progress tracking
    subtasks: [
      {
        title: String,
        completed: { type: Boolean, default: false },
        completedAt: Date,
      },
    ],
    progressPercentage: { type: Number, min: 0, max: 100, default: 0 },

    // Completion analytics
    actualDuration: Number,
    completionHistory: [
      {
        completedAt: Date,
        duration: Number,
        location: {
          name: String,
          coordinates: [Number],
        },
        context: {
          timeOfDay: String,
          dayOfWeek: Number,
          wasOnTime: Boolean,
        },
      },
    ],

    // Natural language processing
    naturalLanguageInput: String,
    extractedEntities: {
      dateTime: [String],
      location: [String],
      people: [String],
      urgencyKeywords: [String],
    },
  },
  { timestamps: true }
);

const TaskAnalytics = mongoose.model("TaskAnalytics", taskAnalyticsSchema);

module.exports = TaskAnalytics;
