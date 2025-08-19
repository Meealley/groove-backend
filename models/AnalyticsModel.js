const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Time period for this analytics record
    period: {
      type: {
        type: String,
        enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
        required: true,
      },
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    // Task completion metrics
    taskMetrics: {
      // Basic counts
      totalTasks: {
        type: Number,
        default: 0,
      },
      completedTasks: {
        type: Number,
        default: 0,
      },
      overdueTasks: {
        type: Number,
        default: 0,
      },
      cancelledTasks: {
        type: Number,
        default: 0,
      },
      // Completion rate
      completionRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      // Task distribution by priority
      byPriority: {
        low: {
          total: { type: Number, default: 0 },
          completed: { type: Number, default: 0 },
          completionRate: { type: Number, default: 0 },
        },
        medium: {
          total: { type: Number, default: 0 },
          completed: { type: Number, default: 0 },
          completionRate: { type: Number, default: 0 },
        },
        high: {
          total: { type: Number, default: 0 },
          completed: { type: Number, default: 0 },
          completionRate: { type: Number, default: 0 },
        },
        urgent: {
          total: { type: Number, default: 0 },
          completed: { type: Number, default: 0 },
          completionRate: { type: Number, default: 0 },
        },
      },
      // Task distribution by category
      byCategory: [{
        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
        categoryName: String,
        total: Number,
        completed: Number,
        completionRate: Number,
        avgCompletionTime: Number, // in minutes
      }],
      // Average completion times
      avgCompletionTime: {
        overall: { type: Number, default: 0 }, // in minutes
        byPriority: {
          low: { type: Number, default: 0 },
          medium: { type: Number, default: 0 },
          high: { type: Number, default: 0 },
          urgent: { type: Number, default: 0 },
        },
      },
    },
    // Productivity metrics
    productivityMetrics: {
      // Focus time analysis
      focusTime: {
        totalMinutes: { type: Number, default: 0 },
        sessionsCount: { type: Number, default: 0 },
        avgSessionLength: { type: Number, default: 0 },
        longestSession: { type: Number, default: 0 },
        shortestSession: { type: Number, default: 0 },
      },
      // Peak productivity hours
      peakHours: [{
        hour: Number, // 0-23
        productivity_score: Number, // 0-100
        tasks_completed: Number,
        focus_time: Number,
      }],
      // Daily productivity scores
      dailyScores: [{
        date: Date,
        score: Number, // 0-100
        factors: {
          completion_rate: Number,
          time_estimation_accuracy: Number,
          procrastination_level: Number,
          focus_quality: Number,
        },
      }],
      // Context switching analysis
      contextSwitching: {
        totalSwitches: { type: Number, default: 0 },
        avgSwitchesPerDay: { type: Number, default: 0 },
        costPerSwitch: { type: Number, default: 0 }, // minutes lost
        mostCommonSwitches: [{
          from: String,
          to: String,
          frequency: Number,
        }],
      },
    },
    // Time estimation accuracy
    estimationAccuracy: {
      overall: {
        accuracy: { type: Number, default: 0 }, // percentage
        bias: {
          type: String,
          enum: ["underestimate", "overestimate", "accurate"],
          default: "accurate",
        },
        avgError: { type: Number, default: 0 }, // percentage
      },
      // Accuracy by task characteristics
      byCategory: [{
        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
        accuracy: Number,
        avgError: Number,
        sampleSize: Number,
      }],
      byPriority: {
        low: { accuracy: Number, avgError: Number, sampleSize: Number },
        medium: { accuracy: Number, avgError: Number, sampleSize: Number },
        high: { accuracy: Number, avgError: Number, sampleSize: Number },
        urgent: { accuracy: Number, avgError: Number, sampleSize: Number },
      },
      // Improvement trends
      improvementTrend: {
        slope: Number, // positive = improving, negative = declining
        correlation: Number, // how strong the trend is
        confidence: Number, // 0-1
      },
    },
    // Scheduling effectiveness
    schedulingMetrics: {
      // Schedule adherence
      adherence: {
        scheduled_tasks: { type: Number, default: 0 },
        completed_on_time: { type: Number, default: 0 },
        adherence_rate: { type: Number, default: 0 },
      },
      // AI scheduling performance
      aiScheduling: {
        suggestions_provided: { type: Number, default: 0 },
        suggestions_accepted: { type: Number, default: 0 },
        acceptance_rate: { type: Number, default: 0 },
        avg_satisfaction: { type: Number, default: 0 }, // 1-5
        effectiveness_score: { type: Number, default: 0 }, // 0-100
      },
      // Calendar optimization
      calendarOptimization: {
        buffer_time_utilization: { type: Number, default: 0 },
        meeting_efficiency: { type: Number, default: 0 },
        deep_work_blocks: { type: Number, default: 0 },
        avg_deep_work_duration: { type: Number, default: 0 },
      },
    },
    // Collaboration metrics
    collaborationMetrics: {
      // Team interactions
      teamInteractions: {
        shared_tasks: { type: Number, default: 0 },
        collaborative_sessions: { type: Number, default: 0 },
        avg_response_time: { type: Number, default: 0 }, // hours
        delegation_frequency: { type: Number, default: 0 },
      },
      // Communication patterns
      communication: {
        internal_messages: { type: Number, default: 0 },
        external_messages: { type: Number, default: 0 },
        meeting_hours: { type: Number, default: 0 },
        async_work_hours: { type: Number, default: 0 },
      },
    },
    // Goal achievement metrics
    goalMetrics: {
      // Personal goals
      personal: {
        goals_set: { type: Number, default: 0 },
        goals_achieved: { type: Number, default: 0 },
        achievement_rate: { type: Number, default: 0 },
        avg_time_to_completion: { type: Number, default: 0 }, // days
      },
      // Professional goals
      professional: {
        projects_completed: { type: Number, default: 0 },
        milestones_hit: { type: Number, default: 0 },
        deadlines_met: { type: Number, default: 0 },
        deadline_adherence: { type: Number, default: 0 },
      },
    },
    // Behavioral patterns
    behaviorPatterns: {
      // Work habits
      workHabits: {
        preferred_start_time: String, // "09:00"
        preferred_end_time: String,   // "17:00"
        avg_work_duration: { type: Number, default: 0 }, // hours per day
        break_frequency: { type: Number, default: 0 }, // breaks per hour
        energy_management: {
          morning_energy: { type: Number, default: 0 }, // 0-100
          afternoon_energy: { type: Number, default: 0 },
          evening_energy: { type: Number, default: 0 },
        },
      },
      // Procrastination analysis
      procrastination: {
        procrastination_score: { type: Number, default: 0 }, // 0-100
        common_triggers: [String],
        avoidance_patterns: [{
          trigger: String,
          frequency: Number,
          avg_delay: Number, // hours
        }],
        recovery_strategies: [{
          strategy: String,
          effectiveness: Number, // 0-100
          usage_frequency: Number,
        }],
      },
      // Interruption patterns
      interruptions: {
        total_interruptions: { type: Number, default: 0 },
        avg_interruptions_per_hour: { type: Number, default: 0 },
        most_disruptive_sources: [{
          source: String,
          frequency: Number,
          avg_recovery_time: Number, // minutes
        }],
        peak_interruption_hours: [Number], // hours of day
      },
    },
    // Wellness and balance metrics
    wellnessMetrics: {
      // Work-life balance
      workLifeBalance: {
        work_hours_per_day: { type: Number, default: 0 },
        overtime_frequency: { type: Number, default: 0 },
        weekend_work_frequency: { type: Number, default: 0 },
        balance_score: { type: Number, default: 0 }, // 0-100
      },
      // Stress indicators
      stressIndicators: {
        overdue_task_ratio: { type: Number, default: 0 },
        last_minute_completions: { type: Number, default: 0 },
        task_postponement_rate: { type: Number, default: 0 },
        workload_density: { type: Number, default: 0 }, // tasks per hour
        stress_level: { type: Number, default: 0 }, // 0-100
      },
      // Recovery patterns
      recovery: {
        adequate_breaks: { type: Boolean, default: true },
        deep_work_to_break_ratio: { type: Number, default: 0 },
        weekly_rest_days: { type: Number, default: 0 },
        recovery_effectiveness: { type: Number, default: 0 }, // 0-100
      },
    },
    // Technology usage metrics
    techMetrics: {
      // Tool usage
      toolUsage: {
        ai_suggestions_used: { type: Number, default: 0 },
        manual_overrides: { type: Number, default: 0 },
        automation_efficiency: { type: Number, default: 0 }, // 0-100
        feature_adoption: [{
          feature: String,
          usage_frequency: Number,
          satisfaction: Number, // 1-5
        }],
      },
      // Integration effectiveness
      integrations: {
        calendar_sync_accuracy: { type: Number, default: 0 }, // 0-100
        notification_effectiveness: { type: Number, default: 0 },
        data_consistency: { type: Number, default: 0 },
      },
    },
    // Comparative metrics
    comparativeMetrics: {
      // Historical comparison
      historical: {
        vs_last_period: {
          completion_rate_change: { type: Number, default: 0 }, // percentage points
          productivity_change: { type: Number, default: 0 },
          efficiency_change: { type: Number, default: 0 },
        },
        trend_direction: {
          type: String,
          enum: ["improving", "stable", "declining"],
          default: "stable",
        },
      },
      // Benchmarking (anonymous)
      benchmarks: {
        percentile_ranking: { type: Number, default: 50 }, // 0-100
        category_rankings: [{
          category: String,
          percentile: Number,
        }],
        improvement_potential: { type: Number, default: 0 }, // 0-100
      },
    },
    // Insights and recommendations
    insights: {
      // Key insights for this period
      keyInsights: [{
        type: {
          type: String,
          enum: [
            "productivity_peak",
            "efficiency_gain",
            "pattern_discovery",
            "improvement_area",
            "achievement_highlight"
          ],
        },
        insight: String,
        impact: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium",
        },
        actionable: Boolean,
        confidence: { type: Number, min: 0, max: 1 },
      }],
      // AI-generated recommendations
      recommendations: [{
        category: {
          type: String,
          enum: [
            "scheduling",
            "prioritization",
            "time_management",
            "work_habits",
            "wellness",
            "tools_usage"
          ],
        },
        recommendation: String,
        reasoning: String,
        expected_impact: {
          type: String,
          enum: ["low", "medium", "high"],
        },
        difficulty: {
          type: String,
          enum: ["easy", "medium", "hard"],
        },
        priority: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium",
        },
      }],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
analyticsSchema.index({ user: 1, "period.type": 1, "period.startDate": -1 });
analyticsSchema.index({ user: 1, "period.endDate": -1 });
analyticsSchema.index({ "period.type": 1, "period.startDate": 1 });

// Method to generate analytics for a user and period
analyticsSchema.statics.generateAnalytics = async function(userId, periodType, startDate, endDate) {
  const Task = mongoose.model('Task');
  const Schedule = mongoose.model('Schedule');
  const UserPattern = mongoose.model('UserPattern');
  
  // Create new analytics record
  const analytics = new this({
    user: userId,
    period: {
      type: periodType,
      startDate: startDate,
      endDate: endDate,
    },
  });
  
  // Get tasks for the period
  const tasks = await Task.find({
    user: userId,
    createdAt: { $gte: startDate, $lte: endDate },
  }).populate('category');
  
  // Get schedules for the period
  const schedules = await Schedule.find({
    user: userId,
    scheduledStart: { $gte: startDate, $lte: endDate },
  });
  
  // Get user patterns
  const userPattern = await UserPattern.findOne({ user: userId });
  
  // Calculate task metrics
  await analytics.calculateTaskMetrics(tasks);
  
  // Calculate productivity metrics
  await analytics.calculateProductivityMetrics(tasks, schedules, userPattern);
  
  // Calculate estimation accuracy
  await analytics.calculateEstimationAccuracy(tasks);
  
  // Calculate scheduling metrics
  await analytics.calculateSchedulingMetrics(schedules);
  
  // Calculate behavioral patterns
  await analytics.calculateBehaviorPatterns(tasks, userPattern);
  
  // Calculate wellness metrics
  await analytics.calculateWellnessMetrics(tasks, schedules);
  
  // Generate insights and recommendations
  await analytics.generateInsights();
  
  // Calculate comparative metrics
  await analytics.calculateComparativeMetrics();
  
  await analytics.save();
  return analytics;
};

// Method to calculate task metrics
analyticsSchema.methods.calculateTaskMetrics = async function(tasks) {
  const completed = tasks.filter(t => t.completed);
  const overdue = tasks.filter(t => t.deadline && new Date() > t.deadline && !t.completed);
  
  this.taskMetrics.totalTasks = tasks.length;
  this.taskMetrics.completedTasks = completed.length;
  this.taskMetrics.overdueTasks = overdue.length;
  this.taskMetrics.completionRate = tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0;
  
  // Calculate by priority
  const priorities = ['low', 'medium', 'high', 'urgent'];
  for (const priority of priorities) {
    const priorityTasks = tasks.filter(t => t.priority === priority);
    const priorityCompleted = priorityTasks.filter(t => t.completed);
    
    this.taskMetrics.byPriority[priority] = {
      total: priorityTasks.length,
      completed: priorityCompleted.length,
      completionRate: priorityTasks.length > 0 ? (priorityCompleted.length / priorityTasks.length) * 100 : 0,
    };
  }
  
  // Calculate by category
  const categoryGroups = {};
  tasks.forEach(task => {
    if (task.category) {
      const catId = task.category._id.toString();
      if (!categoryGroups[catId]) {
        categoryGroups[catId] = {
          categoryId: task.category._id,
          categoryName: task.category.name,
          tasks: [],
        };
      }
      categoryGroups[catId].tasks.push(task);
    }
  });
  
  this.taskMetrics.byCategory = Object.values(categoryGroups).map(group => {
    const completed = group.tasks.filter(t => t.completed);
    const completionTimes = completed
      .filter(t => t.actualDuration)
      .map(t => t.actualDuration);
    
    return {
      categoryId: group.categoryId,
      categoryName: group.categoryName,
      total: group.tasks.length,
      completed: completed.length,
      completionRate: group.tasks.length > 0 ? (completed.length / group.tasks.length) * 100 : 0,
      avgCompletionTime: completionTimes.length > 0 
        ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length 
        : 0,
    };
  });
  
  // Calculate average completion times
  const completedWithDuration = completed.filter(t => t.actualDuration);
  this.taskMetrics.avgCompletionTime.overall = completedWithDuration.length > 0
    ? completedWithDuration.reduce((sum, t) => sum + t.actualDuration, 0) / completedWithDuration.length
    : 0;
  
  for (const priority of priorities) {
    const priorityCompleted = completedWithDuration.filter(t => t.priority === priority);
    this.taskMetrics.avgCompletionTime.byPriority[priority] = priorityCompleted.length > 0
      ? priorityCompleted.reduce((sum, t) => sum + t.actualDuration, 0) / priorityCompleted.length
      : 0;
  }
};

// Method to calculate productivity metrics
analyticsSchema.methods.calculateProductivityMetrics = async function(tasks, schedules, userPattern) {
  // Calculate focus time from schedules
  const focusSessions = schedules.filter(s => 
    s.timeBlock && s.timeBlock.blockType === 'focus_time' && s.status === 'completed'
  );
  
  if (focusSessions.length > 0) {
    const sessionDurations = focusSessions.map(s => 
      (s.actualEnd - s.actualStart) / (1000 * 60) // minutes
    );
    
    this.productivityMetrics.focusTime = {
      totalMinutes: sessionDurations.reduce((sum, duration) => sum + duration, 0),
      sessionsCount: focusSessions.length,
      avgSessionLength: sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length,
      longestSession: Math.max(...sessionDurations),
      shortestSession: Math.min(...sessionDurations),
    };
  }
  
  // Calculate peak hours from user patterns
  if (userPattern && userPattern.productivityPatterns.peakHours) {
    this.productivityMetrics.peakHours = userPattern.productivityPatterns.peakHours.map(peak => ({
      hour: parseInt(peak.start.split(':')[0]),
      productivity_score: peak.productivity_score,
      tasks_completed: tasks.filter(t => 
        t.completedAt && t.completedAt.getHours() === parseInt(peak.start.split(':')[0])
      ).length,
      focus_time: 0, // Would calculate from actual focus sessions
    }));
  }
  
  // Calculate context switching
  const contextSwitches = this.calculateContextSwitches(schedules);
  this.productivityMetrics.contextSwitching = contextSwitches;
};

// Helper method to calculate context switches
analyticsSchema.methods.calculateContextSwitches = function(schedules) {
  let totalSwitches = 0;
  let switches = [];
  
  const sortedSchedules = schedules.sort((a, b) => a.scheduledStart - b.scheduledStart);
  
  for (let i = 1; i < sortedSchedules.length; i++) {
    const prev = sortedSchedules[i - 1];
    const curr = sortedSchedules[i];
    
    if (prev.timeBlock && curr.timeBlock && 
        prev.timeBlock.blockType !== curr.timeBlock.blockType) {
      totalSwitches++;
      
      const switchPair = `${prev.timeBlock.blockType}->${curr.timeBlock.blockType}`;
      const existing = switches.find(s => s.from === prev.timeBlock.blockType && s.to === curr.timeBlock.blockType);
      
      if (existing) {
        existing.frequency++;
      } else {
        switches.push({
          from: prev.timeBlock.blockType,
          to: curr.timeBlock.blockType,
          frequency: 1,
        });
      }
    }
  }
  
  const periodDays = (this.period.endDate - this.period.startDate) / (1000 * 60 * 60 * 24);
  
  return {
    totalSwitches,
    avgSwitchesPerDay: periodDays > 0 ? totalSwitches / periodDays : 0,
    costPerSwitch: 5, // Assume 5 minutes lost per switch
    mostCommonSwitches: switches.sort((a, b) => b.frequency - a.frequency).slice(0, 5),
  };
};

// Method to calculate estimation accuracy
analyticsSchema.methods.calculateEstimationAccuracy = async function(tasks) {
  const tasksWithEstimates = tasks.filter(t => 
    t.estimatedDuration && t.actualDuration && t.completed
  );
  
  if (tasksWithEstimates.length === 0) return;
  
  let totalAccuracy = 0;
  let underestimates = 0;
  let overestimates = 0;
  let totalError = 0;
  
  tasksWithEstimates.forEach(task => {
    const error = Math.abs(task.actualDuration - task.estimatedDuration) / task.estimatedDuration;
    const accuracy = Math.max(0, 100 - (error * 100));
    
    totalAccuracy += accuracy;
    totalError += error * 100;
    
    if (task.actualDuration > task.estimatedDuration) {
      underestimates++;
    } else if (task.actualDuration < task.estimatedDuration) {
      overestimates++;
    }
  });
  
  this.estimationAccuracy.overall = {
    accuracy: totalAccuracy / tasksWithEstimates.length,
    avgError: totalError / tasksWithEstimates.length,
    bias: underestimates > overestimates ? "underestimate" : 
          overestimates > underestimates ? "overestimate" : "accurate",
  };
};

// Method to calculate scheduling metrics
analyticsSchema.methods.calculateSchedulingMetrics = async function(schedules) {
  const scheduledTasks = schedules.length;
  const completedOnTime = schedules.filter(s => 
    s.status === 'completed' && s.actualEnd <= s.scheduledEnd
  ).length;
  
  this.schedulingMetrics.adherence = {
    scheduled_tasks: scheduledTasks,
    completed_on_time: completedOnTime,
    adherence_rate: scheduledTasks > 0 ? (completedOnTime / scheduledTasks) * 100 : 0,
  };
  
  // AI scheduling metrics
  const aiScheduled = schedules.filter(s => s.scheduleType === 'ai_suggested');
  const aiAccepted = aiScheduled.filter(s => !s.optimization.userModified);
  
  this.schedulingMetrics.aiScheduling = {
    suggestions_provided: aiScheduled.length,
    suggestions_accepted: aiAccepted.length,
    acceptance_rate: aiScheduled.length > 0 ? (aiAccepted.length / aiScheduled.length) * 100 : 0,
    avg_satisfaction: 0, // Would be calculated from user feedback
    effectiveness_score: 0, // Would be calculated from completion success
  };
};

// Method to calculate behavioral patterns
analyticsSchema.methods.calculateBehaviorPatterns = async function(tasks, userPattern) {
  if (!userPattern) return;
  
  // Work habits from user patterns
  if (userPattern.productivityPatterns.peakHours.length > 0) {
    const earliestStart = Math.min(...userPattern.productivityPatterns.peakHours.map(p => 
      parseInt(p.start.split(':')[0])
    ));
    const latestEnd = Math.max(...userPattern.productivityPatterns.peakHours.map(p => 
      parseInt(p.end.split(':')[0])
    ));
    
    this.behaviorPatterns.workHabits = {
      preferred_start_time: `${earliestStart.toString().padStart(2, '0')}:00`,
      preferred_end_time: `${latestEnd.toString().padStart(2, '0')}:00`,
      avg_work_duration: latestEnd - earliestStart,
      break_frequency: userPattern.productivityPatterns.breakFrequency || 0,
      energy_management: {
        morning_energy: 80, // Default values, would be calculated from actual data
        afternoon_energy: 60,
        evening_energy: 40,
      },
    };
  }
  
  // Procrastination analysis
  const delayedTasks = tasks.filter(t => t.postponements > 0);
  const avgDelay = userPattern.completionPatterns.procrastination?.avgDelay || 0;
  
  this.behaviorPatterns.procrastination = {
    procrastination_score: delayedTasks.length > 0 ? (delayedTasks.length / tasks.length) * 100 : 0,
    common_triggers: userPattern.completionPatterns.procrastination?.triggerKeywords || [],
    avoidance_patterns: [],
    recovery_strategies: [],
  };
};

// Method to calculate wellness metrics
analyticsSchema.methods.calculateWellnessMetrics = async function(tasks, schedules) {
  const totalWorkMinutes = schedules
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + ((s.actualEnd - s.actualStart) / (1000 * 60)), 0);
  
  const periodDays = (this.period.endDate - this.period.startDate) / (1000 * 60 * 60 * 24);
  const avgWorkHoursPerDay = totalWorkMinutes / (60 * periodDays);
  
  this.wellnessMetrics.workLifeBalance = {
    work_hours_per_day: avgWorkHoursPerDay,
    overtime_frequency: avgWorkHoursPerDay > 8 ? 1 : 0,
    weekend_work_frequency: 0, // Would calculate from actual weekend work
    balance_score: Math.max(0, 100 - Math.abs(avgWorkHoursPerDay - 8) * 10),
  };
  
  // Stress indicators
  const overdueRatio = this.taskMetrics.overdueTasks / this.taskMetrics.totalTasks;
  const postponementRate = tasks.filter(t => t.postponements > 0).length / tasks.length;
  
  this.wellnessMetrics.stressIndicators = {
    overdue_task_ratio: overdueRatio,
    task_postponement_rate: postponementRate,
    stress_level: Math.min(100, (overdueRatio + postponementRate) * 100),
  };
};

// Method to generate insights and recommendations
analyticsSchema.methods.generateInsights = async function() {
  this.insights.keyInsights = [];
  this.insights.recommendations = [];
  
  // Generate insights based on metrics
  if (this.taskMetrics.completionRate > 80) {
    this.insights.keyInsights.push({
      type: "achievement_highlight",
      insight: `Excellent completion rate of ${this.taskMetrics.completionRate.toFixed(1)}%`,
      impact: "high",
      actionable: false,
      confidence: 0.9,
    });
  } else if (this.taskMetrics.completionRate < 50) {
    this.insights.keyInsights.push({
      type: "improvement_area",
      insight: `Low completion rate of ${this.taskMetrics.completionRate.toFixed(1)}% needs attention`,
      impact: "high",
      actionable: true,
      confidence: 0.9,
    });
    
    this.insights.recommendations.push({
      category: "prioritization",
      recommendation: "Consider reducing daily task load and focusing on fewer, high-impact tasks",
      reasoning: "Low completion rate suggests overcommitment",
      expected_impact: "high",
      difficulty: "medium",
      priority: "high",
    });
  }
  
  // Time estimation insights
  if (this.estimationAccuracy.overall.bias === "underestimate") {
    this.insights.recommendations.push({
      category: "time_management",
      recommendation: "Add 25% buffer time to task estimates",
      reasoning: "Historical data shows consistent underestimation",
      expected_impact: "medium",
      difficulty: "easy",
      priority: "medium",
    });
  }
  
  // Wellness recommendations
  if (this.wellnessMetrics.stressIndicators.stress_level > 70) {
    this.insights.recommendations.push({
      category: "wellness",
      recommendation: "Implement daily stress-reduction techniques and review workload",
      reasoning: "High stress indicators detected",
      expected_impact: "high",
      difficulty: "medium",
      priority: "high",
    });
  }
};

// Method to calculate comparative metrics
analyticsSchema.methods.calculateComparativeMetrics = async function() {
  // Find previous period for comparison
  const previousPeriod = await this.model('Analytics').findOne({
    user: this.user,
    'period.type': this.period.type,
    'period.endDate': { $lt: this.period.startDate },
  }).sort({ 'period.endDate': -1 });
  
  if (previousPeriod) {
    this.comparativeMetrics.historical.vs_last_period = {
      completion_rate_change: this.taskMetrics.completionRate - previousPeriod.taskMetrics.completionRate,
      productivity_change: 0, // Would calculate based on actual productivity metrics
      efficiency_change: 0,
    };
    
    const completionChange = this.comparativeMetrics.historical.vs_last_period.completion_rate_change;
    this.comparativeMetrics.historical.trend_direction = 
      completionChange > 5 ? "improving" :
      completionChange < -5 ? "declining" : "stable";
  }
};

// Static method to get insights summary for a user
analyticsSchema.statics.getInsightsSummary = async function(userId, days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const analytics = await this.find({
    user: userId,
    'period.endDate': { $gte: startDate, $lte: endDate },
  }).sort({ 'period.endDate': -1 });
  
  if (analytics.length === 0) return null;
  
  const latest = analytics[0];
  const insights = latest.insights.keyInsights;
  const recommendations = latest.insights.recommendations
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 5); // Top 5 recommendations
  
  return {
    period: latest.period,
    summary: {
      completion_rate: latest.taskMetrics.completionRate,
      productivity_trend: latest.comparativeMetrics.historical.trend_direction,
      stress_level: latest.wellnessMetrics.stressIndicators.stress_level,
      balance_score: latest.wellnessMetrics.workLifeBalance.balance_score,
    },
    key_insights: insights.slice(0, 3),
    top_recommendations: recommendations,
  };
};

// Static method to get or create analytics for productivity score
analyticsSchema.statics.getProductivityScore = async function(userId, days = 7) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    // Find most recent analytics
    const analytics = await this.findOne({
      user: userId,
      'period.startDate': { $lte: endDate },
      'period.endDate': { $gte: startDate },
    }).sort({ 'period.endDate': -1 });
    
    if (analytics && analytics.taskMetrics) {
      const completionScore = analytics.taskMetrics.completionRate || 0;
      const timeManagementScore = 100 - (analytics.estimationAccuracy?.overall?.avgError || 50);
      const goalScore = analytics.goalMetrics?.personal?.achievement_rate || 0;
      
      return Math.round(
        completionScore * 0.4 +
        timeManagementScore * 0.3 +
        goalScore * 0.3
      );
    }
    
    // Generate analytics if none exist
    const weeklyAnalytics = await this.generateWeeklyAnalytics(userId);
    return weeklyAnalytics ? weeklyAnalytics.getCalculatedProductivityScore() : 50;
    
  } catch (error) {
    console.error('Error getting analytics productivity score:', error);
    return 50;
  }
};

// Add method to generate weekly analytics quickly
analyticsSchema.statics.generateWeeklyAnalytics = async function(userId) {
  try {
    const Task = mongoose.model('Task');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    const tasks = await Task.find({
      user: userId,
      $or: [
        { createdAt: { $gte: startDate, $lte: endDate } },
        { completedAt: { $gte: startDate, $lte: endDate } }
      ]
    });
    
    if (tasks.length === 0) return null;
    
    // Create basic analytics
    const analytics = new this({
      user: userId,
      period: {
        type: 'weekly',
        startDate: startDate,
        endDate: endDate,
      }
    });
    
    // Calculate basic task metrics
    await analytics.calculateTaskMetrics(tasks);
    
    return analytics;
    
  } catch (error) {
    console.error('Error generating weekly analytics:', error);
    return null;
  }
};

// Add method to calculate productivity score from analytics
analyticsSchema.methods.getCalculatedProductivityScore = function() {
  if (!this.taskMetrics) return 50;
  
  const completionScore = this.taskMetrics.completionRate || 0;
  const timeManagementScore = 100 - (this.estimationAccuracy?.overall?.avgError || 50);
  const goalScore = this.goalMetrics?.personal?.achievement_rate || 0;
  
  return Math.round(
    completionScore * 0.4 +
    timeManagementScore * 0.3 +
    goalScore * 0.3
  );
};


const Analytics = mongoose.model("Analytics", analyticsSchema);

module.exports = Analytics;