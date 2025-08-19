const mongoose = require("mongoose");

const userPatternSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Productivity patterns
    productivityPatterns: {
      // Peak performance hours
      peakHours: [{
        start: String,
        end: String,
        productivity_score: Number, // 0-100
        days: [Number] // 0-6 for Sunday-Saturday
      }],
      // Preferred work sessions
      preferredSessionLength: Number, // in minutes
      breakFrequency: Number, // minutes between breaks
        // Energy levels throughout the day
      energyLevels: [{
        hour: Number, // 0-23
        energy: Number, // 0-100
        focus: Number, // 0-100
      }],
    },
    // Task completion patterns
    completionPatterns: {
      // Average time to complete tasks by priority
      avgCompletionTime: {
        low: Number,    // in minutes
        medium: Number,
        high: Number,
        urgent: Number,
      },
      // Completion rate by day of week
      weeklyCompletionRate: [{
        day: Number, // 0-6
        rate: Number, // 0-100 percentage
      }],
      // Completion rate by time of day
      hourlyCompletionRate: [{
        hour: Number, // 0-23
        rate: Number, // 0-100 percentage
      }],
      // Procrastination patterns
      procrastination: {
        avgDelay: Number, // average days tasks are delayed
        triggerKeywords: [String], // words in tasks that cause delays
        patterns: [{
          condition: String, // "deadline_within_hours"
          value: Number,     // 24
          delay_probability: Number, // 0-1
        }],
      },
    },
    // Category and tag preferences
    preferences: {
      // Frequently used categories
      favoriteCategories: [{
        category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
        usage_frequency: Number,
        avg_completion_time: Number,
        preference_score: Number, // 0-1
      }],
      // Frequently used tags
      favoriteTags: [{
        tag: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Tag",
        },
        usage_frequency: Number,
        context_score: Number, // how often used in productive contexts
      }],
      // Priority distribution
      priorityDistribution: {
        low: Number,    // percentage of tasks
        medium: Number,
        high: Number,
        urgent: Number,
      },
    },
    // Location-based patterns
    locationPatterns: {
      productiveLocations: [{
        name: String,
        coordinates: [Number], // [longitude, latitude]
        productivity_score: Number, // 0-100
        task_types: [String], // categories/tags commonly used here
        visit_frequency: Number,
      }],
      travelPatterns: [{
        from: [Number], 
        to: [Number],   
        avg_travel_time: Number, // minutes
        frequency: Number, // times per week
      }],
    },
    // Task estimation accuracy
    estimationAccuracy: {
      overall_accuracy: Number, // 0-100 percentage
      bias: String, // "underestimate", "overestimate", "accurate"
      accuracy_by_category: [{
        category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
        accuracy: Number, // 0-100
        avg_estimation_error: Number, // percentage off
      }],
      improvement_trend: Number, // improving/declining over time
    },
    // Interruption patterns
    interruptionPatterns: {
      frequent_interruption_times: [{
        start: String, // "14:00"
        end: String,   // "15:00"
        interruption_rate: Number, // 0-1
        common_sources: [String], // "email", "calls", "meetings"
      }],
      recovery_time: Number, // minutes to refocus after interruption
      interruption_tolerance: Number, // 0-100
    },
    // Collaboration patterns
    collaborationPatterns: {
      preferred_collaboration_times: [{
        start: String,
        end: String,
        days: [Number],
      }],
      team_productivity: [{
        team_member: String,
        productivity_score: Number,
        communication_frequency: Number,
      }],
      delegation_patterns: {
        delegates_frequently: Boolean,
        delegation_success_rate: Number, // 0-100
        preferred_delegate_types: [String],
      },
    },
    // Learning and adaptation
    adaptationMetrics: {
      suggestion_acceptance_rate: Number, // 0-100
      manual_override_frequency: Number,
      pattern_stability: Number, // how consistent patterns are
      last_pattern_update: Date,
      learning_velocity: Number, // how quickly patterns adapt
    },
    // Stress and workload patterns
    workloadPatterns: {
      optimal_daily_tasks: Number,
      optimal_weekly_tasks: Number,
      stress_indicators: [{
        metric: String, // "task_completion_rate", "postponement_rate"
        threshold: Number,
        current_value: Number,
      }],
      burnout_risk: Number, // 0-100
      recovery_patterns: [{
        trigger: String, // "low_completion_rate"
        action: String,  // "reduce_daily_tasks"
        effectiveness: Number, // 0-100
      }],
    },
    // Context switching patterns
    contextSwitching: {
      avg_switches_per_day: Number,
      cost_per_switch: Number, // minutes lost
      optimal_batching: [{
        category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
        optimal_batch_size: Number,
        optimal_time_blocks: Number, // minutes
      }],
    },
    // Data collection settings
    dataCollection: {
      enabled: {
        type: Boolean,
        default: true,
      },
      last_analysis: Date,
      analysis_frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
        default: "weekly",
      },
      privacy_level: {
        type: String,
        enum: ["full", "limited", "minimal"],
        default: "full",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userPatternSchema.index({ user: 1 });
userPatternSchema.index({ "dataCollection.last_analysis": 1 });

// Method to update patterns based on recent task data
userPatternSchema.methods.updatePatterns = async function(daysBack = 30) {
  const Task = mongoose.model('Task');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  
  // Get recent tasks for analysis
  const recentTasks = await Task.find({
    user: this.user,
    createdAt: { $gte: startDate },
  }).populate('category tags');
  
  // Update completion patterns
  this.updateCompletionPatterns(recentTasks);
  
  // Update productivity patterns
  this.updateProductivityPatterns(recentTasks);
  
  // Update estimation accuracy
  this.updateEstimationAccuracy(recentTasks);
  
  this.dataCollection.last_analysis = new Date();
  return this.save();
};

// Helper method to update completion patterns
userPatternSchema.methods.updateCompletionPatterns = function(tasks) {
  const completedTasks = tasks.filter(t => t.completed);
  
  // Calculate average completion times by priority
  const priorityGroups = {
    low: completedTasks.filter(t => t.priority === 'low'),
    medium: completedTasks.filter(t => t.priority === 'medium'),
    high: completedTasks.filter(t => t.priority === 'high'),
    urgent: completedTasks.filter(t => t.priority === 'urgent'),
  };
  
  for (const [priority, taskList] of Object.entries(priorityGroups)) {
    if (taskList.length > 0) {
      const avgTime = taskList.reduce((sum, task) => {
        const duration = task.actualDuration || task.estimatedDuration || 60;
        return sum + duration;
      }, 0) / taskList.length;
      
      this.completionPatterns.avgCompletionTime[priority] = avgTime;
    }
  }
  
  // Calculate weekly completion rates
  const weeklyRates = new Array(7).fill(0);
  const weeklyCounts = new Array(7).fill(0);
  
  completedTasks.forEach(task => {
    const dayOfWeek = task.completedAt.getDay();
    weeklyRates[dayOfWeek]++;
    weeklyCounts[dayOfWeek]++;
  });
  
  tasks.forEach(task => {
    const dayOfWeek = task.createdAt.getDay();
    weeklyCounts[dayOfWeek]++;
  });
  
  this.completionPatterns.weeklyCompletionRate = weeklyRates.map((completed, index) => ({
    day: index,
    rate: weeklyCounts[index] > 0 ? (completed / weeklyCounts[index]) * 100 : 0,
  }));
};

// Helper method to update productivity patterns
userPatternSchema.methods.updateProductivityPatterns = function(tasks) {
  const completedTasks = tasks.filter(t => t.completed && t.completedAt);
  
  // Analyze peak hours
  const hourlyProductivity = new Array(24).fill(0);
  const hourlyCounts = new Array(24).fill(0);
  
  completedTasks.forEach(task => {
    const hour = task.completedAt.getHours();
    hourlyProductivity[hour]++;
    hourlyCounts[hour]++;
  });
  
  // Find peak hours (top 25% of productive hours)
  const productivityScores = hourlyProductivity.map((count, hour) => ({
    hour,
    score: hourlyCounts[hour] > 0 ? (count / hourlyCounts[hour]) * 100 : 0,
  }));
  
  productivityScores.sort((a, b) => b.score - a.score);
  const topHours = productivityScores.slice(0, 6); // Top 6 hours
  
  // Group consecutive hours into peak periods
  this.productivityPatterns.peakHours = [];
  let currentPeak = null;
  
  topHours.sort((a, b) => a.hour - b.hour).forEach(({ hour, score }) => {
    if (!currentPeak || hour !== currentPeak.end + 1) {
      if (currentPeak) {
        this.productivityPatterns.peakHours.push(currentPeak);
      }
      currentPeak = {
        start: `${hour.toString().padStart(2, '0')}:00`,
        end: hour,
        productivity_score: score,
        days: [0, 1, 2, 3, 4, 5, 6], // All days for now
      };
    } else {
      currentPeak.end = hour;
      currentPeak.productivity_score = (currentPeak.productivity_score + score) / 2;
    }
  });
  
  if (currentPeak) {
    currentPeak.end = `${currentPeak.end.toString().padStart(2, '0')}:59`;
    this.productivityPatterns.peakHours.push(currentPeak);
  }
};

// Helper method to update estimation accuracy
userPatternSchema.methods.updateEstimationAccuracy = function(tasks) {
  const tasksWithEstimates = tasks.filter(t => 
    t.estimatedDuration && t.actualDuration && t.completed
  );
  
  if (tasksWithEstimates.length === 0) return;
  
  let totalAccuracy = 0;
  let underestimates = 0;
  let overestimates = 0;
  
  tasksWithEstimates.forEach(task => {
    const error = Math.abs(task.actualDuration - task.estimatedDuration) / task.estimatedDuration;
    const accuracy = Math.max(0, 100 - (error * 100));
    totalAccuracy += accuracy;
    
    if (task.actualDuration > task.estimatedDuration) {
      underestimates++;
    } else if (task.actualDuration < task.estimatedDuration) {
      overestimates++;
    }
  });
  
  this.estimationAccuracy.overall_accuracy = totalAccuracy / tasksWithEstimates.length;
  
  if (underestimates > overestimates) {
    this.estimationAccuracy.bias = "underestimate";
  } else if (overestimates > underestimates) {
    this.estimationAccuracy.bias = "overestimate";
  } else {
    this.estimationAccuracy.bias = "accurate";
  }
};

// Method to get smart scheduling suggestions
userPatternSchema.methods.getSchedulingSuggestions = function(task) {
  const suggestions = [];
  
  // Suggest peak productivity hours
  if (this.productivityPatterns.peakHours) {
    this.productivityPatterns.peakHours.forEach(peak => {
      suggestions.push({
        type: "peak_hour",
        timeSlot: peak,
        reason: `You're most productive during ${peak.start}-${peak.end}`,
        confidence: peak.productivity_score / 100,
      });
    });
  }
  
  // Suggest based on task category patterns
  if (task.category && this.preferences.favoriteCategories) {
    const categoryPref = this.preferences.favoriteCategories.find(
      cat => cat.category.toString() === task.category.toString()
    );
    
    if (categoryPref) {
      suggestions.push({
        type: "category_pattern",
        estimatedDuration: categoryPref.avg_completion_time,
        reason: `Similar tasks typically take ${Math.round(categoryPref.avg_completion_time)} minutes`,
        confidence: categoryPref.preference_score,
      });
    }
  }
  
  return suggestions.sort((a, b) => b.confidence - a.confidence);
};

// Method to predict task completion time
userPatternSchema.methods.predictCompletionTime = function(task) {
  let prediction = 60; // Default 1 hour
  
  // Use priority-based average
  if (this.completionPatterns.avgCompletionTime[task.priority]) {
    prediction = this.completionPatterns.avgCompletionTime[task.priority];
  }
  
  // Adjust based on category patterns
  if (task.category && this.preferences.favoriteCategories) {
    const categoryPref = this.preferences.favoriteCategories.find(
      cat => cat.category.toString() === task.category.toString()
    );
    
    if (categoryPref && categoryPref.avg_completion_time) {
      prediction = (prediction + categoryPref.avg_completion_time) / 2;
    }
  }
  
  // Adjust based on estimation bias
  if (this.estimationAccuracy.bias === "underestimate") {
    prediction *= 1.2; // Add 20% buffer
  } else if (this.estimationAccuracy.bias === "overestimate") {
    prediction *= 0.8; // Reduce by 20%
  }
  
  return Math.round(prediction);
};

const UserPattern = mongoose.model("UserPattern", userPatternSchema);

module.exports = UserPattern;