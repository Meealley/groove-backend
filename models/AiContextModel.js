const mongoose = require("mongoose");

// Helper functions (standalone, not methods)
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 6) return "night";
  if (hour < 9) return "early_morning";
  if (hour < 12) return "morning";
  if (hour < 15) return "midday";
  if (hour < 18) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
}

function getDayOfWeek() {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date().getDay()];
}

const aiContextSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contextType: {
      type: String,
      enum: [
        "task_suggestion",
        "schedule_optimization",
        "priority_recommendation",
        "time_estimation", 
        "productivity_insight",
        "habit_analysis",
        "goal_tracking",
        "context_aware_reminder",
        "workflow_optimization",
        "collaboration_suggestion",
        "wellness_recommendation",
        "learning_insight"
      ],
      required: true,
    },
    scope: {
      type: String,
      enum: ["user", "task", "project", "category", "time_period", "global"],
      default: "user",
    },
    
    relatedEntities: {
      tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      }],
      categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      }],
      schedules: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Schedule",
      }],
      tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      }],
    },
    
    // AI model information
    aiModel: {
      modelName: String,
      modelVersion: String,
      provider: {
        type: String,
        enum: ["openai", "anthropic", "custom", "ensemble"],
        default: "custom",
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      processingTime: Number, // in milliseconds
    },
    
    // Context data for AI processing
    contextData: {
      // User state at time of generation
      userState: {
        currentTime: Date,
        currentLocation: {
          type: [Number], // [longitude, latitude]
        },
        currentActivity: String,
        energyLevel: {
          type: Number,
          min: 0,
          max: 100,
        },
        availableTime: Number, // minutes
        workload: {
          type: String,
          enum: ["light", "moderate", "heavy", "overloaded"],
        },
        mood: {
          type: String,
          enum: ["focused", "distracted", "motivated", "tired", "stressed"],
        },
      },
      // Environmental context
      environment: {
        timeOfDay: {
          type: String,
          enum: ["early_morning", "morning", "midday", "afternoon", "evening", "night"],
        },
        dayOfWeek: {
          type: String,
          enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        },
        weather: String,
        location: String,
        noise_level: {
          type: String,
          enum: ["quiet", "moderate", "noisy"],
        },
        interruption_likelihood: {
          type: String,
          enum: ["low", "medium", "high"],
        },
      },
      // Historical patterns
      patterns: {
        productivity_history: [{
          timeframe: String,
          productivity_score: Number,
          completion_rate: Number,
          focus_quality: Number,
        }],
        preference_patterns: [{
          pattern_type: String,
          frequency: Number,
          success_rate: Number,
          last_occurrence: Date,
        }],
        behavioral_trends: [{
          trend_type: String,
          direction: {
            type: String,
            enum: ["improving", "stable", "declining"],
          },
          strength: Number, // 0-1
          confidence: Number, // 0-1
        }],
      },
    },
    
    // AI-generated content - FIXED ENUM
    suggestions: [{
      type: {
        type: String,
        enum: [
          "task_creation",
          "task_modification",
          "scheduling",
          "prioritization",
          "time_allocation",
          "break_suggestion",
          "deadline_adjustment",
          "category_assignment",
          "tag_addition",
          "dependency_creation",
          "workflow_change",
          "habit_formation",
          "general",              // FIXED: Added this
          "context_suggestion",   // FIXED: Added this
          "productivity_tip",     // FIXED: Added this
          "focus_session",        // FIXED: Added this
          "wellness_tip"          // FIXED: Added this
        ],
        required: true
      },
      title: String,
      description: String,
      reasoning: String,
      // Suggestion details
      details: {
        action: String, // The suggested action
        parameters: Object, // Action parameters
        expected_outcome: String,
        success_probability: Number, // 0-1
        effort_required: {
          type: String,
          enum: ["minimal", "low", "medium", "high"],
        },
        impact_level: {
          type: String,
          enum: ["low", "medium", "high", "transformative"],
        },
      },
      // Interaction tracking
      interaction: {
        presented: {
          type: Boolean,
          default: false,
        },
        presentedAt: Date,
        viewed: {
          type: Boolean,
          default: false,
        },
        viewedAt: Date,
        accepted: {
          type: Boolean,
          default: false,
        },
        acceptedAt: Date,
        dismissed: {
          type: Boolean,
          default: false,
        },
        dismissedAt: Date,
        dismissal_reason: String,
      },
      // Effectiveness tracking
      effectiveness: {
        implemented: Boolean,
        implementation_success: Boolean,
        measured_impact: Number, // Actual impact vs expected
        user_satisfaction: Number, // 1-5
        would_recommend_again: Boolean,
      },
      // Metadata
      priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium",
      },
      expires_at: Date,
      tags: [String],
    }],
    
    // Learning and adaptation data
    learning: {
      // User feedback for model improvement
      feedback: [{
        feedback_type: {
          type: String,
          enum: ["accuracy", "relevance", "timing", "usefulness", "overall"],
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
        timestamp: Date,
      }],
      // Pattern recognition results
      patterns_detected: [{
        pattern_name: String,
        pattern_description: String,
        confidence: Number, // 0-1
        occurrences: Number,
        first_detected: Date,
        last_confirmed: Date,
        actionable: Boolean,
      }],
      // Model performance metrics
      performance: {
        suggestion_acceptance_rate: Number, // 0-1
        implementation_success_rate: Number, // 0-1
        user_satisfaction_avg: Number, // 1-5
        false_positive_rate: Number, // 0-1
        false_negative_rate: Number, // 0-1
      },
      // Adaptation parameters
      adaptation: {
        learning_rate: Number, // How quickly to adapt to user behavior
        model_weights: Object, // Model-specific weights for this user
        feature_importance: Object, // Which features are most important for this user
        last_updated: Date,
      },
    },
    
    // Contextual insights
    insights: {
      // Key insights discovered
      key_insights: [{
        insight_type: {
          type: String,
          enum: [
            "productivity_pattern",
            "time_preference",
            "energy_pattern",
            "distraction_trigger",
            "motivation_factor",
            "stress_indicator",
            "success_pattern",
            "inefficiency_source"
          ],
        },
        insight: String,
        supporting_data: Object,
        confidence: Number, // 0-1
        actionability: {
          type: String,
          enum: ["immediate", "short_term", "long_term", "strategic"],
        },
        impact_potential: {
          type: String,
          enum: ["low", "medium", "high", "transformative"],
        },
        discovered_at: Date,
        validated: Boolean,
        validation_count: Number,
      }],
      // Predictive insights
      predictions: [{
        prediction_type: {
          type: String,
          enum: [
            "task_completion_time",
            "deadline_risk",
            "productivity_forecast",
            "workload_prediction",
            "stress_level_forecast",
            "goal_achievement_probability"
          ],
        },
        prediction: String,
        predicted_value: Number,
        confidence_interval: {
          lower: Number,
          upper: Number,
        },
        prediction_horizon: Number, // days
        accuracy_history: [{
          predicted: Number,
          actual: Number,
          error: Number,
          date: Date,
        }],
      }],
      // Trend analysis
      trends: [{
        trend_name: String,
        metric: String,
        direction: {
          type: String,
          enum: ["increasing", "decreasing", "stable", "cyclical"],
        },
        strength: Number, // 0-1
        time_period: Number, // days
        statistical_significance: Number, // p-value
        projected_continuation: Boolean,
      }],
    },
    
    // Real-time context processing
    realTimeContext: {
      // Current session data
      current_session: {
        session_start: Date,
        current_task: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Task",
        },
        focus_level: Number, // 0-100
        interruption_count: Number,
        context_switches: Number,
        productivity_indicators: Object,
      },
      // Live environmental data
      live_environment: {
        calendar_availability: Object,
        location_context: Object,
        device_status: Object,
        network_conditions: Object,
        app_usage: Object,
      },
      // Adaptive parameters
      adaptive_params: {
        suggestion_frequency: Number, // How often to suggest
        intervention_threshold: Number, // When to intervene
        notification_preferences: Object,
        learning_sensitivity: Number, // How quickly to adapt
      },
    },
    
    // Collaboration and team context
    teamContext: {
      // Team dynamics
      team_productivity: {
        team_members: [String],
        collaboration_score: Number, // 0-100
        communication_patterns: Object,
        shared_workload: Number,
      },
      // Organizational context
      organizational: {
        company_goals: [String],
        department_priorities: [String],
        deadline_culture: String,
        meeting_density: Number,
      },
    },
    
    // Privacy and security
    privacy: {
      // Data sensitivity levels
      sensitivity_level: {
        type: String,
        enum: ["public", "internal", "confidential", "restricted"],
        default: "internal",
      },
      // Retention policies
      retention: {
        keep_until: Date,
        auto_delete: Boolean,
        anonymize_after: Number, // days
      },
      // Sharing permissions
      sharing: {
        allow_aggregated_analytics: Boolean,
        allow_model_training: Boolean,
        allow_research_use: Boolean,
      },
    },
    
    // Execution and monitoring
    execution: {
      // Status tracking
      status: {
        type: String,
        enum: ["pending", "active", "completed", "expired", "archived"],
        default: "pending",
      },
      // Execution metrics
      metrics: {
        processing_time: Number, // milliseconds
        memory_usage: Number, // bytes
        api_calls_made: Number,
        cache_hit_ratio: Number, // 0-1
      },
      // Monitoring alerts
      alerts: [{
        alert_type: String,
        severity: {
          type: String,
          enum: ["info", "warning", "error", "critical"],
        },
        message: String,
        timestamp: Date,
        resolved: Boolean,
      }],
    },
  },
  {
    timestamps: true,
  }
);

// INDEXES
aiContextSchema.index({ user: 1, contextType: 1, createdAt: -1 });
aiContextSchema.index({ user: 1, "execution.status": 1 });
aiContextSchema.index({ "aiModel.confidence": -1 });
aiContextSchema.index({ "suggestions.interaction.presented": 1, "suggestions.interaction.accepted": 1 });
aiContextSchema.index({ "contextData.userState.currentLocation": "2dsphere" });

// FIXED: Static method to generate AI Suggestions
aiContextSchema.statics.generateSuggestions = async function(userId, contextType, options = {}) {
  try {
    console.log(`Generating AI suggestions for user ${userId}, contextType: ${contextType}`);

    // Validate contextType is in enum
    const validContextTypes = [
      "task_suggestion", "schedule_optimization", "priority_recommendation",
      "time_estimation", "productivity_insight", "habit_analysis", "goal_tracking",
      "context_aware_reminder", "workflow_optimization", "collaboration_suggestion",
      "wellness_recommendation", "learning_insight"
    ];

    if (!validContextTypes.includes(contextType)) {
      console.warn(`Invalid contextType: ${contextType}, using default: task_suggestion`);
      contextType = "task_suggestion";
    }

    // Safe model access with error handling
    let UserPattern, Task, Schedule;
    
    try {
      Task = mongoose.model('Task');
    } catch (error) {
      console.log('Task model not found, continuing without it');
      Task = null;
    }
    
    try {
      UserPattern = mongoose.model('UserPattern');
    } catch (error) {
      console.log('UserPattern model not found, continuing without it');
      UserPattern = null;
    }
    
    try {
      Schedule = mongoose.model('Schedule');
    } catch (error) {
      console.log('Schedule model not found, continuing without it');
      Schedule = null;
    }
    
    const aiContext = new this({
      user: userId,
      contextType: contextType,
      aiModel: {
        modelName: "TaskMasterAI",
        modelVersion: "1.0.0",
        provider: "custom",
        confidence: 0.8,
        processingTime: Date.now()
      },
      contextData: {
        userState: {
          currentTime: new Date(),
          energyLevel: 75,
          availableTime: 60,
          workload: 'moderate',
          mood: 'focused'
        },
        environment: {
          timeOfDay: getTimeOfDay(), // FIXED: Use standalone function
          dayOfWeek: getDayOfWeek(),  // FIXED: Use standalone function
        },
        patterns: {
          productivity_history: [],
          preference_patterns: [],
          behavioral_trends: []
        }
      },
      suggestions: [],
      insights: {
        key_insights: [],
        predictions: [],
        trends: []
      },
      learning: {
        feedback: [],
        patterns_detected: [],
        performance: {},
        adaptation: {}
      },
      execution: {
        status: "active",
        metrics: {
          processing_time: 0,
          memory_usage: 0,
          api_calls_made: 0,
          cache_hit_ratio: 0.8
        }
      }
    });
    
    // Gather context data safely
    await aiContext.gatherContextData(options);
    
    // Generate suggestions based on context type
    switch (contextType) {
      case "task_suggestion":
        await aiContext.generateTaskSuggestions(Task);
        break;
      case "schedule_optimization":
        await aiContext.generateScheduleOptimizations(Schedule);
        break;
      case "productivity_insight":
        await aiContext.generateProductivityInsights();
        break;
      case "time_estimation":
        await aiContext.generateTimeEstimations();
        break;
      case "context_aware_reminder":
        await aiContext.generateContextAwareReminders(options);
        break;
      default:
        await aiContext.generateGenericSuggestions();
    }
    
    // Analyze patterns and generate insights
    await aiContext.analyzePatterns();
    
    // Update learning metrics
    await aiContext.updateLearningMetrics();
    
    // Update execution metrics
    aiContext.execution.metrics.processing_time = Date.now() - aiContext.aiModel.processingTime;
    aiContext.execution.status = "completed";
    
    await aiContext.save();
    return aiContext;
    
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    
    // Return a safe fallback context
    return this.createFallbackContext(userId, contextType, options);
  }
};

// FIXED: Create fallback context with valid enum values
aiContextSchema.statics.createFallbackContext = async function(userId, contextType, options = {}) {
  try {
    console.log('Creating fallback context...');

    const fallbackContext = new this({
      user: userId,
      contextType: contextType,
      aiModel: {
        modelName: "TaskMasterAI",
        modelVersion: "1.0.0",
        provider: "custom",
        confidence: 0.5,
        processingTime: 50
      },
      contextData: {
        userState: {
          currentTime: new Date(),
          energyLevel: 75,
          availableTime: options.context?.available_time || 60,
          workload: 'moderate',
          mood: 'focused'
        },
        environment: {
          timeOfDay: getTimeOfDay(), // FIXED: Use standalone function
          dayOfWeek: getDayOfWeek(),  // FIXED: Use standalone function
        },
        patterns: {
          productivity_history: [],
          preference_patterns: [],
          behavioral_trends: []
        }
      },
      suggestions: [{
        type: "general", // Valid enum value
        title: "AI temporarily unavailable",
        description: "Basic task management available",
        reasoning: "AI system is currently experiencing issues",
        details: {
          action: "continue_normal_operation",
          parameters: {},
          expected_outcome: "Basic functionality maintained",
          success_probability: 1.0,
          effort_required: "minimal",
          impact_level: "low",
        },
        priority: "low",
        interaction: {
          presented: false,
          viewed: false,
          accepted: false,
          dismissed: false
        },
        effectiveness: {}
      }],
      insights: {
        key_insights: [],
        predictions: [],
        trends: []
      },
      learning: {
        feedback: [],
        patterns_detected: [],
        performance: {},
        adaptation: {}
      },
      execution: {
        status: "completed",
        metrics: {
          processing_time: 50,
          memory_usage: 0,
          api_calls_made: 0,
          cache_hit_ratio: 0
        }
      }
    });
    
    await fallbackContext.save();
    return fallbackContext;

  } catch (fallbackError) {
    console.error('Error creating fallback context:', fallbackError);
    
    // Return minimal in-memory object as last resort
    return {
      suggestions: [],
      insights: { key_insights: [] },
      aiModel: { confidence: 0.3 }
    };
  }
};

// ENHANCED: Method to gather context data with safe model access and options
aiContextSchema.methods.gatherContextData = async function(options = {}) {
  try {
    const now = new Date();
    this.contextData.userState.currentTime = now;
    
    // Set context from options if provided
    if (options.context) {
      const context = options.context;
      this.contextData.userState.energyLevel = this.mapEnergyLevel(context.energy_level) || 75;
      this.contextData.userState.availableTime = parseInt(context.available_time) || 60;
      this.contextData.environment.location = context.location || 'office';
      this.contextData.userState.currentActivity = context.current_activity || 'work';
      this.contextData.environment.timeOfDay = context.timeOfDay || this.getTimeOfDay(now);
      this.contextData.environment.dayOfWeek = context.dayOfWeek || this.getDayOfWeek(now);
    } else {
      this.contextData.environment = {
        timeOfDay: this.getTimeOfDay(now),
        dayOfWeek: this.getDayOfWeek(now),
      };
    }
    
    // Initialize defaults
    this.contextData.userState.workload = 'moderate';
    this.contextData.patterns.productivity_history = [];
    
    // SAFE: Try to access Task model
    try {
      const Task = mongoose.model('Task');
      
      const activeTasks = await Task.find({
        user: this.user,
        completed: false,
      }).limit(10);
      
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);
      
      const todayTasks = await Task.countDocuments({
        user: this.user,
        dueDate: { $gte: todayStart, $lt: todayEnd },
        completed: false,
      });
      
      this.contextData.userState.workload = 
        todayTasks > 10 ? "overloaded" :
        todayTasks > 7 ? "heavy" :
        todayTasks > 4 ? "moderate" : "light";
        
    } catch (taskError) {
      console.log('Task model access error:', taskError.message);
    }
    
    // SAFE: Try to access UserPattern model (optional)
    try {
      const UserPattern = mongoose.model('UserPattern');
      const userPattern = await UserPattern.findOne({ user: this.user });
      
      if (userPattern && userPattern.productivityPatterns && userPattern.productivityPatterns.peakHours) {
        this.contextData.patterns.productivity_history = 
          userPattern.productivityPatterns.peakHours.map(peak => ({
            timeframe: `${peak.start}-${peak.end}`,
            productivity_score: peak.productivity_score,
            completion_rate: 80,
            focus_quality: 75,
          }));
      }
    } catch (userPatternError) {
      console.log('UserPattern model not available (this is normal):', userPatternError.message);
    }
    
  } catch (error) {
    console.error('Error in gatherContextData:', error);
    // Set safe defaults on error
    this.contextData = {
      userState: {
        currentTime: new Date(),
        energyLevel: 75,
        availableTime: 60,
        workload: 'moderate',
        mood: 'focused'
      },
      environment: {
        timeOfDay: this.getTimeOfDay(new Date()),
        dayOfWeek: this.getDayOfWeek(new Date()),
      },
      patterns: {
        productivity_history: [],
        preference_patterns: [],
        behavioral_trends: []
      }
    };
  }
};

// Generate context-aware reminders
aiContextSchema.methods.generateContextAwareReminders = async function(options = {}) {
  try {
    this.suggestions = [];
    
    const context = options.context || {};
    const energyLevel = context.energy_level || 'medium';
    const availableTime = parseInt(context.available_time) || 60;
    const location = context.location || 'office';
    
    // Energy-based suggestions
    if (energyLevel === 'high') {
      this.suggestions.push({
        type: "context_suggestion",
        title: "Perfect time for challenging tasks",
        description: "Your energy is high - tackle your most demanding work now",
        reasoning: "High energy levels are optimal for complex cognitive tasks",
        details: {
          action: "prioritize_difficult_tasks",
          parameters: { energy_level: energyLevel },
          expected_outcome: "Higher quality work completion",
          success_probability: 0.9,
          effort_required: "medium",
          impact_level: "high",
        },
        priority: "high",
        interaction: {},
        effectiveness: {}
      });
    } else if (energyLevel === 'low') {
      this.suggestions.push({
        type: "wellness_tip",
        title: "Consider taking a break",
        description: "Low energy detected - a short break might help",
        reasoning: "Breaks can restore energy and improve focus",
        details: {
          action: "take_break",
          parameters: { break_duration: 15 },
          expected_outcome: "Restored energy and focus",
          success_probability: 0.8,
          effort_required: "minimal",
          impact_level: "medium",
        },
        priority: "medium",
        interaction: {},
        effectiveness: {}
      });
    }
    
    // Time-based suggestions
    if (availableTime >= 90) {
      this.suggestions.push({
        type: "focus_session",
        title: "Start a deep work session",
        description: "You have sufficient time for focused work",
        reasoning: "Long uninterrupted periods enable deep work and flow states",
        details: {
          action: "start_focus_session",
          parameters: { duration: 90 },
          expected_outcome: "High-quality deep work completion",
          success_probability: 0.85,
          effort_required: "medium",
          impact_level: "high",
        },
        priority: "high",
        interaction: {},
        effectiveness: {}
      });
    } else if (availableTime <= 30) {
      this.suggestions.push({
        type: "productivity_tip",
        title: "Perfect time for quick tasks",
        description: "Limited time available - focus on small, quick wins",
        reasoning: "Short time blocks are ideal for administrative tasks",
        details: {
          action: "do_quick_tasks",
          parameters: { max_duration: 25 },
          expected_outcome: "Multiple small tasks completed",
          success_probability: 0.9,
          effort_required: "low",
          impact_level: "medium",
        },
        priority: "medium",
        interaction: {},
        effectiveness: {}
      });
    }
    
    // Location-based suggestions
    if (location === 'office') {
      this.suggestions.push({
        type: "context_suggestion",
        title: "Good environment for collaboration",
        description: "Office setting is perfect for team tasks and meetings",
        reasoning: "Office environments facilitate communication and collaboration",
        details: {
          action: "schedule_collaborative_work",
          parameters: { location: 'office' },
          expected_outcome: "Effective team collaboration",
          success_probability: 0.8,
          effort_required: "low",
          impact_level: "medium",
        },
        priority: "medium",
        interaction: {},
        effectiveness: {}
      });
    }
    
    // Default suggestion if none generated
    if (this.suggestions.length === 0) {
      this.suggestions.push({
        type: "general",
        title: "Review your task priorities",
        description: "Take a moment to review and organize your tasks",
        reasoning: "Regular task review helps maintain focus and productivity",
        details: {
          action: "review_priorities",
          parameters: {},
          expected_outcome: "Better task organization",
          success_probability: 0.8,
          effort_required: "minimal",
          impact_level: "medium",
        },
        priority: "medium",
        interaction: {},
        effectiveness: {}
      });
    }
    
  } catch (error) {
    console.error('Error generating context-aware reminders:', error);
    this.suggestions = [{
      type: "general",
      title: "Stay focused",
      description: "Continue working on your current priorities",
      reasoning: "General productivity guidance",
      details: {
        action: "stay_focused",
        parameters: {},
        expected_outcome: "Maintained productivity",
        success_probability: 0.7,
        effort_required: "minimal",
        impact_level: "low",
      },
      priority: "low",
      interaction: {},
      effectiveness: {}
    }];
  }
};

// Method to generate task suggestions
aiContextSchema.methods.generateTaskSuggestions = async function(TaskModel = null) {
  try {
    this.suggestions = [];
    
    if (!TaskModel) {
      try {
        TaskModel = mongoose.model('Task');
      } catch (error) {
        console.log('Task model not available for suggestions');
        return this.generateGenericSuggestions();
      }
    }
    
    const incompleteTasks = await TaskModel.find({
      user: this.user,
      completed: false,
    }).sort({ priorityScore: -1 }).limit(5);
    
    if (incompleteTasks.length > 0) {
      this.suggestions.push({
        type: "prioritization",
        title: "Optimize Your Task Priority",
        description: "Based on your patterns, these tasks should be prioritized",
        reasoning: "Analysis of your completion patterns and current workload",
        details: {
          action: "reorder_tasks",
          parameters: { 
            suggested_order: incompleteTasks.map(t => t._id),
          },
          expected_outcome: "Improved task completion rate",
          success_probability: 0.75,
          effort_required: "minimal",
          impact_level: "medium",
        },
        priority: "medium",
        interaction: {},
        effectiveness: {}
      });
    }
    
    // Suggest breaking down large tasks
    const largeTasks = incompleteTasks.filter(t => 
      t.estimatedDuration && t.estimatedDuration > 120
    );
    
    if (largeTasks.length > 0) {
      this.suggestions.push({
        type: "task_modification",
        title: "Break Down Large Tasks",
        description: "Consider breaking these large tasks into smaller pieces",
        reasoning: "Large tasks often have lower completion rates",
        details: {
          action: "split_task",
          parameters: { 
            tasks_to_split: largeTasks.map(t => t._id),
            suggested_subtask_duration: 45,
          },
          expected_outcome: "Higher completion rate",
          success_probability: 0.85,
          effort_required: "low",
          impact_level: "high",
        },
        priority: "high",
        interaction: {},
        effectiveness: {}
      });
    }
    
    // Time-based suggestions
    if (this.contextData.environment.timeOfDay === "morning") {
      this.suggestions.push({
        type: "scheduling",
        title: "Schedule Focus Time",
        description: "Morning is your peak productivity time",
        reasoning: "Historical data shows highest productivity in morning",
        details: {
          action: "create_focus_block",
          parameters: {
            duration: 90,
            task_types: ["high", "urgent"],
          },
          expected_outcome: "Increased focus and completion",
          success_probability: 0.9,
          effort_required: "minimal",
          impact_level: "high",
        },
        priority: "high",
        interaction: {},
        effectiveness: {}
      });
    }
    
  } catch (error) {
    console.error('Error generating task suggestions:', error);
    return this.generateGenericSuggestions();
  }
};

// Method to generate schedule optimizations
aiContextSchema.methods.generateScheduleOptimizations = async function(ScheduleModel = null) {
  try {
    this.suggestions = [];
    
    if (!ScheduleModel) {
      try {
        ScheduleModel = mongoose.model('Schedule');
      } catch (error) {
        console.log('Schedule model not available');
        return this.generateGenericSuggestions();
      }
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todaySchedule = await ScheduleModel.find({
      user: this.user,
      scheduledStart: { $gte: today, $lt: tomorrow },
    }).sort({ scheduledStart: 1 });
    
    // Detect scheduling conflicts
    const conflicts = this.detectScheduleConflicts(todaySchedule);
    if (conflicts.length > 0) {
      this.suggestions.push({
        type: "scheduling",
        title: "Resolve Schedule Conflicts",
        description: `${conflicts.length} scheduling conflicts detected`,
        reasoning: "Overlapping schedules can reduce productivity and cause stress",
        details: {
          action: "resolve_conflicts",
          parameters: { conflicts },
          expected_outcome: "Clearer schedule and reduced stress",
          success_probability: 0.95,
          effort_required: "medium",
          impact_level: "high",
        },
        priority: "urgent",
        interaction: {},
        effectiveness: {}
      });
    }
    
    // Suggest buffer time
    const needsBuffer = this.analyzeBufferTime(todaySchedule);
    if (needsBuffer) {
      this.suggestions.push({
        type: "scheduling",
        title: "Add Buffer Time",
        description: "Your schedule is too tight - consider adding buffer time",
        reasoning: "Tight schedules often lead to delays and increased stress",
        details: {
          action: "add_buffer_time",
          parameters: { buffer_minutes: 15 },
          expected_outcome: "More realistic schedule and better time management",
          success_probability: 0.8,
          effort_required: "low",
          impact_level: "medium",
        },
        priority: "medium",
        interaction: {},
        effectiveness: {}
      });
    }
  } catch (error) {
    console.error('Error generating schedule optimizations:', error);
    return this.generateGenericSuggestions();
  }
};

// Generic suggestions fallback
aiContextSchema.methods.generateGenericSuggestions = async function() {
  this.suggestions = [{
    type: "general",
    title: "Stay organized",
    description: "Keep your tasks organized and prioritized",
    reasoning: "Good organization leads to better productivity",
    details: {
      action: "organize_tasks",
      parameters: {},
      expected_outcome: "Better task management",
      success_probability: 0.8,
      effort_required: "low",
      impact_level: "medium",
    },
    priority: "medium",
    interaction: {},
    effectiveness: {}
  }];
};

// Time estimation suggestions
aiContextSchema.methods.generateTimeEstimations = async function() {
  this.suggestions = [{
    type: "time_allocation",
    title: "Improve time estimates",
    description: "Track actual time spent to improve future estimates",
    reasoning: "Better time estimation leads to more realistic planning",
    details: {
      action: "track_time",
      parameters: {},
      expected_outcome: "More accurate time estimates",
      success_probability: 0.85,
      effort_required: "low",
      impact_level: "medium",
    },
    priority: "medium",
    interaction: {},
    effectiveness: {}
  }];
};

// Productivity insights generation
aiContextSchema.methods.generateProductivityInsights = async function() {
  try {
    const Analytics = mongoose.model('Analytics');
    
    const recentAnalytics = await Analytics.findOne({
      user: this.user,
    }).sort({ createdAt: -1 });
    
    if (!recentAnalytics) return;
    
    this.insights.key_insights = [];
    
    // Analyze completion rates
    if (recentAnalytics.taskMetrics && recentAnalytics.taskMetrics.completionRate < 70) {
      this.insights.key_insights.push({
        insight_type: "inefficiency_source",
        insight: "Your task completion rate is below optimal levels",
        supporting_data: {
          completion_rate: recentAnalytics.taskMetrics.completionRate,
          target_rate: 85,
        },
        confidence: 0.9,
        actionability: "immediate",
        impact_potential: "high",
        discovered_at: new Date(),
        validated: true,
        validation_count: 1,
      });
    }
    
  } catch (error) {
    console.error('Error generating productivity insights:', error);
  }
};

// Pattern analysis
aiContextSchema.methods.analyzePatterns = async function() {
  try {
    this.learning.patterns_detected = [];
    
    if (this.contextData.environment.timeOfDay === "morning") {
      this.learning.patterns_detected.push({
        pattern_name: "morning_productivity_peak",
        pattern_description: "User shows higher productivity in morning hours",
        confidence: 0.8,
        occurrences: 15,
        first_detected: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        last_confirmed: new Date(),
        actionable: true,
      });
    }
  } catch (error) {
    console.error('Error analyzing patterns:', error);
  }
};

// Learning metrics update
aiContextSchema.methods.updateLearningMetrics = async function() {
  try {
    this.learning.performance = {
      suggestion_acceptance_rate: 0.7,
      implementation_success_rate: 0.8,
      user_satisfaction_avg: 4.2,
      false_positive_rate: 0.1,
      false_negative_rate: 0.05,
    };
  } catch (error) {
    console.error('Error updating learning metrics:', error);
  }
};

// Helper method to map energy levels
aiContextSchema.methods.mapEnergyLevel = function(energyLevel) {
  const mapping = {
    'low': 25,
    'medium': 75,
    'high': 95
  };
  return mapping[energyLevel] || 75;
};

// Helper method to detect schedule conflicts
aiContextSchema.methods.detectScheduleConflicts = function(schedules) {
  const conflicts = [];
  
  for (let i = 0; i < schedules.length - 1; i++) {
    const current = schedules[i];
    const next = schedules[i + 1];
    
    if (current.scheduledEnd && next.scheduledStart && current.scheduledEnd > next.scheduledStart) {
      conflicts.push({
        schedule1: current._id,
        schedule2: next._id,
        overlap_minutes: (current.scheduledEnd - next.scheduledStart) / (1000 * 60),
      });
    }
  }
  
  return conflicts;
};

// Helper method to analyze buffer time
aiContextSchema.methods.analyzeBufferTime = function(schedules) {
  let tightTransitions = 0;
  
  for (let i = 0; i < schedules.length - 1; i++) {
    const current = schedules[i];
    const next = schedules[i + 1];
    
    if (current.scheduledEnd && next.scheduledStart) {
      const gap = (next.scheduledStart - current.scheduledEnd) / (1000 * 60);
      if (gap < 10) {
        tightTransitions++;
      }
    }
  }
  
  return tightTransitions > schedules.length * 0.5;
};

// Instance helper methods
aiContextSchema.methods.getTimeOfDay = function(date) {
  const hour = date.getHours();
  if (hour < 6) return "night";
  if (hour < 9) return "early_morning";
  if (hour < 12) return "morning";
  if (hour < 15) return "midday";
  if (hour < 18) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
};

aiContextSchema.methods.getDayOfWeek = function(date) {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[date.getDay()];
};

// Method to record suggestion feedback
aiContextSchema.methods.recordSuggestionFeedback = function(suggestionId, feedback) {
  const suggestion = this.suggestions.id(suggestionId);
  if (!suggestion) throw new Error('Suggestion not found');
  
  if (feedback.action === 'accept') {
    suggestion.interaction.accepted = true;
    suggestion.interaction.acceptedAt = new Date();
  } else if (feedback.action === 'dismiss') {
    suggestion.interaction.dismissed = true;
    suggestion.interaction.dismissedAt = new Date();
    suggestion.interaction.dismissal_reason = feedback.reason;
  }
  
  this.learning.feedback.push({
    feedback_type: feedback.type,
    rating: feedback.rating,
    comment: feedback.comment,
    timestamp: new Date(),
  });
  
  return this.save();
};

// Static method to clean up old AI contexts
aiContextSchema.statics.cleanup = async function(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    'execution.status': { $in: ['completed', 'expired', 'archived'] },
  });
  
  return result.deletedCount;
};

const AIContext = mongoose.model("AIContext", aiContextSchema);

module.exports = AIContext;