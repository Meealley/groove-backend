const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");
const Task = require("../models/TaskModel");

const AIContext = require("../models/AiContextModel");
const mongoose = require("mongoose");

// FIXED: Uncomment these imports
const Tag = require("../models/TagModel");
const Category = require("../models/CategoryModel");

// Import utilities
const {
  calculateSmartPriority,
  generateTaskInsights,
  applyAIEnhancements,
  generateOptimizedSchedule,
  generateCompletionInsights,
  learnFromTaskCompletion,
  updateUserMetrics,
  checkAchievements,
  getNextTaskSuggestion,
  generateCelebrationMessage,
  getTasksForContext,
  calculateContextScore,
  analyzeTaskPatterns,
  generateContextTips,
  getOptimalActivities,
  getActivitiesToAvoid,
  assessEnergyAlignment,
  predictProductivity,
  generateTaskListInsights,
  generateSingleTaskInsights,

  getTimeRange,
  generateActionItems,
  getNextReviewDate,
} = require("../utils/taskUtils");

// ===================================================================
// AI-POWERED TASK CONTROLLERS
// ===================================================================

// @desc    Create a new task with AI-powered suggestions
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    priority,
    category,
    tags,
    estimatedDuration,
    deadline,
    dueDate,
    naturalLanguageInput,
    context,
  } = req.body;

  try {
    // FIXED: Safe property access with defaults
    const defaultPriority =
      req.user?.workPreferences?.tasks?.defaultPriority || "medium";
    const aiEnabled =
      req.user?.aiPreferences?.features?.taskSuggestions || false;

    // Create base task
    const task = await Task.create({
      user: req.user._id,
      title: title.trim(),
      description: description?.trim(),
      priority: priority || defaultPriority,
      category,
      tags,
      estimatedDuration,
      deadline,
      dueDate,
      naturalLanguageInput,
      context: {
        location: context?.location || "office",
        timeOfDay: getTimeOfDay(),
        energy_level: context?.energy_level || "medium",
      },
    });

    // FIXED: Always populate the task after creation with error handling
    let populatedTask;
    try {
      populatedTask = await Task.findById(task._id)
        .populate("category", "name color icon description")
        .populate("tags", "name color icon");
    } catch (populateError) {
      console.error(
        "Population failed, returning task without population:",
        populateError.message
      );
      populatedTask = task;
    }

    // Generate AI-powered enhancements if enabled
    if (aiEnabled) {
      try {
        // Generate AI suggestions for this task
        const aiContext = await AIContext.generateSuggestions(
          req.user._id,
          "task_suggestion",
          {
            task_id: task._id,
            user_input: naturalLanguageInput || title,
            context: context,
          }
        );

        // Apply AI enhancements to the task
        const enhancements = await applyAIEnhancements(
          task,
          aiContext,
          req.user
        );

        // Update task with AI suggestions
        let taskUpdated = false;
        if (enhancements.suggestedDuration) {
          task.suggestedDuration = enhancements.suggestedDuration;
          taskUpdated = true;
        }

        if (enhancements.suggestedStartTime) {
          task.suggestedStartTime = enhancements.suggestedStartTime;
          taskUpdated = true;
        }

        if (enhancements.parsedAttributes) {
          task.parsedAttributes = enhancements.parsedAttributes;
          taskUpdated = true;
        }

        if (taskUpdated) {
          await task.save();

          // Try to re-populate after update
          try {
            populatedTask = await Task.findById(task._id)
              .populate("category", "name color icon description")
              .populate("tags", "name color icon");
          } catch (populateError) {
            console.error("Re-population failed:", populateError.message);
            // Use the existing populated task
          }
        }

        return res.status(201).json({
          success: true,
          message: "Task created with AI assistance! 🤖",
          data: {
            task: populatedTask,
            ai_suggestions: aiContext.suggestions.slice(0, 3),
            insights: enhancements.insights,
            next_actions: enhancements.nextActions,
          },
        });
      } catch (aiError) {
        console.error("AI enhancement failed:", aiError);

        // Return success even if AI fails
        return res.status(201).json({
          success: true,
          message: "Task created successfully!",
          data: {
            task: populatedTask,
            ai_note: "AI suggestions temporarily unavailable",
          },
        });
      }
    } else {
      // No AI features enabled, just return the task
      return res.status(201).json({
        success: true,
        message: "Task created successfully!",
        data: {
          task: populatedTask,
        },
      });
    }
  } catch (error) {
    console.error("Task creation error:", error);

    // Handle specific errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create task",
    });
  }
});

// @desc    Get AI-powered task recommendations
// @route   GET /api/tasks/recommendations
// @access  Private
const getTaskRecommendations = asyncHandler(async (req, res) => {
  const {
    available_time = 60,
    energy_level = "medium",
    current_location = "office",
    context_type = "next_task",
  } = req.query;

  try {
    // Generate AI recommendations
    const aiContext = await AIContext.generateSuggestions(
      req.user._id,
      "task_suggestion",
      {
        available_time: parseInt(available_time),
        energy_level,
        current_location,
        context_type,
      }
    );

    // FIXED: Safe population with error handling
    let incompleteTasks;
    try {
      incompleteTasks = await Task.find({
        user: req.user._id,
        completed: false,
        $or: [
          { dependencies: { $size: 0 } },
          { dependencies: { $not: { $elemMatch: { type: "blocks" } } } },
        ],
      })
        .populate("category", "name color")
        .populate("tags", "name color")
        .sort({ priorityScore: -1 })
        .limit(20);
    } catch (populateError) {
      console.error(
        "Population failed, getting tasks without population:",
        populateError.message
      );
      incompleteTasks = await Task.find({
        user: req.user._id,
        completed: false,
        $or: [
          { dependencies: { $size: 0 } },
          { dependencies: { $not: { $elemMatch: { type: "blocks" } } } },
        ],
      })
        .sort({ priorityScore: -1 })
        .limit(20);
    }

    // Calculate smart priorities for all tasks
    const smartTasks = await Promise.all(
      incompleteTasks.map(async (task) => {
        const smartPriority = await calculateSmartPriority(task, req.user, {
          available_time: parseInt(available_time),
          energy_level,
          current_location,
        });

        return {
          ...task.toObject(),
          smart_priority: smartPriority,
          ai_reasoning: smartPriority.reasoning,
          fit_score: smartPriority.fit_score,
        };
      })
    );

    // Sort by smart priority
    smartTasks.sort((a, b) => b.smart_priority.score - a.smart_priority.score);

    // Categorize recommendations
    const recommendations = {
      optimal_now: smartTasks.filter((t) => t.fit_score >= 80).slice(0, 3),
      quick_wins: smartTasks
        .filter(
          (t) => t.estimatedDuration <= 30 && t.smart_priority.score >= 70
        )
        .slice(0, 3),
      deep_work: smartTasks
        .filter(
          (t) => t.estimatedDuration >= 60 && t.smart_priority.score >= 60
        )
        .slice(0, 2),
      urgent: smartTasks
        .filter(
          (t) => t.priority === "urgent" || t.smart_priority.urgency_score >= 80
        )
        .slice(0, 2),
      ai_suggestions: aiContext.suggestions
        .filter(
          (s) => s.type === "task_creation" || s.type === "prioritization"
        )
        .slice(0, 2),
    };

    // Generate contextual insights
    const insights = generateTaskInsights(smartTasks, req.user, {
      available_time: parseInt(available_time),
      energy_level,
      current_location,
    });

    res.json({
      success: true,
      message: "Smart recommendations generated! 🧠",
      data: {
        recommendations,
        insights,
        context: {
          available_time: parseInt(available_time),
          energy_level,
          current_location,
          total_tasks_analyzed: incompleteTasks.length,
          ai_confidence: aiContext.aiModel.confidence,
        },
        productivity_tip: insights.primary_tip,
        estimated_completion_time: recommendations.optimal_now.reduce(
          (sum, task) => sum + (task.estimatedDuration || 30),
          0
        ),
      },
    });
  } catch (error) {
    console.error("Task recommendations error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to generate recommendations at this time",
    });
  }
});

// @desc    Get AI-powered schedule optimization
// @route   POST /api/tasks/optimize-schedule
// @access  Private
const optimizeSchedule = asyncHandler(async (req, res) => {
  const {
    time_horizon = "today",
    include_existing_schedule = true,
    optimization_goal = "productivity",
  } = req.body;

  try {
    const aiContext = await AIContext.generateSuggestions(
      req.user._id,
      "schedule_optimization",
      {
        time_horizon,
        include_existing_schedule,
        optimization_goal,
      }
    );

    // FIXED: Safe population
    let tasksToSchedule;
    try {
      tasksToSchedule = await Task.find({
        user: req.user._id,
        completed: false,
        suggestedStartTime: { $exists: false },
      })
        .populate("category", "name color")
        .populate("tags", "name color")
        .sort({ priorityScore: -1 });
    } catch (populateError) {
      console.error(
        "Population failed in optimize schedule:",
        populateError.message
      );
      tasksToSchedule = await Task.find({
        user: req.user._id,
        completed: false,
        suggestedStartTime: { $exists: false },
      }).sort({ priorityScore: -1 });
    }

    const optimizedSchedule = await generateOptimizedSchedule(
      tasksToSchedule,
      req.user,
      {
        time_horizon,
        optimization_goal,
        user_preferences: req.user?.workPreferences,
      }
    );

    const schedulingPromises = optimizedSchedule.scheduled_tasks.map(
      async (scheduledTask) => {
        return Task.findByIdAndUpdate(
          scheduledTask.task_id,
          {
            suggestedStartTime: scheduledTask.suggested_start,
            suggestedDuration: scheduledTask.suggested_duration,
            schedulingScore: scheduledTask.scheduling_score,
          },
          { new: true }
        );
      }
    );

    await Promise.all(schedulingPromises);

    res.json({
      success: true,
      message: "Schedule optimized using AI! 📅",
      data: {
        optimized_schedule: optimizedSchedule,
        ai_suggestions: aiContext.suggestions.slice(0, 3),
        schedule_insights: {
          total_tasks_scheduled: optimizedSchedule.scheduled_tasks.length,
          estimated_completion_time: optimizedSchedule.total_estimated_time,
          productivity_forecast: optimizedSchedule.productivity_forecast,
          potential_issues: optimizedSchedule.potential_issues,
          optimization_score: optimizedSchedule.optimization_score,
        },
        next_actions: [
          "Review the suggested schedule",
          "Adjust any time blocks that don't work",
          "Start with the first recommended task",
          "Set up focus time for deep work blocks",
        ],
      },
    });
  } catch (error) {
    console.error("Schedule optimization error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to optimize schedule at this time",
    });
  }
});

// @desc    Update task with AI learning
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  if (task.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to update this task");
  }

  const originalValues = {
    priority: task.priority,
    estimatedDuration: task.estimatedDuration,
    completed: task.completed,
  };

  // FIXED: Safe population
  let updatedTask;
  try {
    updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifications: task.modifications + 1 },
      { new: true, runValidators: true }
    )
      .populate("category", "name color")
      .populate("tags", "name color");
  } catch (populateError) {
    console.error("Population failed in update:", populateError.message);
    updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modifications: task.modifications + 1 },
      { new: true, runValidators: true }
    );
  }

  // FIXED: Safe property access
  if (req.user?.aiPreferences?.learning?.adaptToPatterns) {
    try {
      await learnFromTaskUpdate(
        task,
        updatedTask,
        originalValues,
        req.user,
        req.body.update_reason || "user_modification"
      );
    } catch (learningError) {
      console.error("AI learning error:", learningError);
    }
  }

  let completionInsights = null;
  if (!originalValues.completed && updatedTask.completed) {
    completionInsights = await generateCompletionInsights(
      updatedTask,
      req.user
    );
  }

  res.json({
    success: true,
    message: completionInsights
      ? "Task completed! Great job! 🎉"
      : "Task updated successfully!",
    data: {
      task: updatedTask,
      completion_insights: completionInsights,
      ai_learning_active:
        req.user?.aiPreferences?.learning?.adaptToPatterns || false,
      productivity_impact: completionInsights?.productivity_impact,
    },
  });
});

// @desc    Complete task with AI insights and learning
// @route   POST /api/tasks/:id/complete
// @access  Private
const completeTask = asyncHandler(async (req, res) => {
  const { time_spent, completion_note, difficulty_rating } = req.body;

  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  if (task.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to complete this task");
  }

  if (task.completed) {
    res.status(400);
    throw new Error("Task is already completed");
  }

  // Complete the task
  task.completed = true;
  task.completedAt = new Date();
  task.actualDuration = time_spent || task.timeSpent || task.estimatedDuration;
  task.progress = 100;
  task.subtasks = task.subtasks.map((subtask) => ({
    ...subtask,
    completed: true,
    completedAt: new Date(),
  }));

  await task.save();

  // Update user metrics
  await updateUserMetrics(req.user, task, time_spent);

  // Generate completion insights
  const insights = await generateCompletionInsights(task, req.user, {
    time_spent,
    completion_note,
    difficulty_rating,
  });

  // Learn from task completion
  if (req.user?.aiPreferences?.learning?.adaptToPatterns) {
    await learnFromTaskCompletion(task, req.user, {
      time_spent,
      difficulty_rating,
      completion_note,
    });
  }

  // Check for achievements
  const newAchievements = await checkAchievements(req.user, task);

  // Update streak
  await req.user.updateStreak();

  // Generate next task suggestion
  const nextTaskSuggestion = await getNextTaskSuggestion(req.user, task);

  // FIXED: Safe population
  let finalTask;
  try {
    finalTask = await Task.findById(task._id)
      .populate("category", "name color")
      .populate("tags", "name color");
  } catch (populateError) {
    console.error("Final population failed:", populateError.message);
    finalTask = task;
  }

  // let productivityScore = 50; // Default score
  // try {
  //   productivityScore = await req.user.getProductivityScore();
  // } catch (error) {
  //   console.error("Productivity score calculation failed:", error);

  //   // Fallback calculation
  //   try {
  //     const Task = require("../models/TaskModel");
  //     const userTasks = await Task.find({
  //       user: req.user._id,
  //       createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  //     });

  //     if (userTasks.length > 0) {
  //       const completed = userTasks.filter((t) => t.completed).length;
  //       productivityScore = Math.round((completed / userTasks.length) * 100);
  //     }
  //   } catch (fallbackError) {
  //     console.error("Fallback calculation failed:", fallbackError);
  //     productivityScore = 50;
  //   }
  // }

  res.json({
    success: true,
    message: `🎉 Task completed! ${insights.congratulation_message}`,
    data: {
      task: finalTask,
      completion_insights: insights,
      new_achievements: newAchievements,
      streak_info: {
        current_streak: req.user?.analytics?.metrics?.streakDays || 0,
        longest_streak: req.user?.analytics?.metrics?.longestStreak || 0,
      },
      next_suggestion: nextTaskSuggestion,
      productivity_score: await req.user.getProductivityScore(),
      celebration: generateCelebrationMessage(task, insights),
    },
  });
});

// @desc    Get tasks based on current context
// @route   GET /api/tasks/contextual
// @access  Private
// const getContextualTasks = asyncHandler(async (req, res) => {
//   const {
//     location,
//     energy_level,
//     available_time,
//     current_activity,
//     weather,
//     noise_level,
//   } = req.query;

//   const context = {
//     location: location || "office",
//     energy_level: energy_level || "medium",
//     available_time: parseInt(available_time) || 60,
//     current_activity: current_activity || "work",
//     timeOfDay: getTimeOfDay(),
//     dayOfWeek: getDayOfWeek(),
//     weather,
//     noise_level,
//   };

//   try {
//     const aiContext = await AIContext.generateSuggestions(
//       req.user._id,
//       "context_aware_reminder",
//       { context }
//     );

//     const contextualTasks = await getTasksForContext(req.user._id, context);

//     const scoredTasks = contextualTasks.map((task) => {
//       const contextScore = calculateContextScore(task, context, req.user);
//       return {
//         ...task.toObject(),
//         context_score: contextScore,
//         context_reasoning: contextScore.reasoning,
//       };
//     });

//     scoredTasks.sort((a, b) => b.context_score.total - a.context_score.total);

//     const suggestions = {
//       perfect_match: scoredTasks
//         .filter((t) => t.context_score.total >= 85)
//         .slice(0, 3),
//       good_fit: scoredTasks
//         .filter(
//           (t) => t.context_score.total >= 70 && t.context_score.total < 85
//         )
//         .slice(0, 3),
//       consider_later: scoredTasks
//         .filter((t) => t.context_score.total < 70)
//         .slice(0, 2),
//       context_tips: generateContextTips(context, req.user, aiContext),
//     };

//     res.json({
//       success: true,
//       message: `Found tasks perfect for your current context! 🎯`,
//       data: {
//         context,
//         suggestions,
//         ai_insights: aiContext.insights.key_insights.slice(0, 2),
//         context_analysis: {
//           optimal_for: getOptimalActivities(context),
//           should_avoid: getActivitiesToAvoid(context),
//           energy_alignment: assessEnergyAlignment(context, req.user),
//           productivity_forecast: predictProductivity(context, req.user),
//         },
//       },
//     });
//   } catch (error) {
//     console.error("Contextual tasks error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Unable to analyze context at this time",
//     });
//   }
// });
// FIXED: Replace your getContextualTasks function in taskcontroller.js

const getContextualTasks = asyncHandler(async (req, res) => {
  const {
    location,
    energy_level,
    available_time,
    current_activity,
    weather,
    noise_level
  } = req.query;

  const context = {
    location: location || 'office',
    energy_level: energy_level || 'medium',
    available_time: parseInt(available_time) || 60,
    current_activity: current_activity || 'work',
    timeOfDay: getTimeOfDay(),
    dayOfWeek: getDayOfWeek(),
    weather,
    noise_level
  };

  try {
    // Generate AI Context with proper error handling
    let aiContext;
    try {
      aiContext = await AIContext.generateSuggestions(
        req.user._id,
        'context_aware_reminder',
        { context }
      );
      console.log('AI Context generated successfully:', {
        suggestionsCount: aiContext.suggestions?.length || 0,
        insightsCount: aiContext.insights?.key_insights?.length || 0
      });
    } catch (aiError) {
      console.error('AI Context generation failed:', aiError);
      
      // Create minimal fallback AI context
      aiContext = {
        suggestions: [{
          type: "general",
          title: "Focus on your priorities",
          description: "Work on your most important tasks first",
          reasoning: "General productivity guidance"
        }],
        insights: { 
          key_insights: [{
            insight: "Stay focused on your current priorities",
            confidence: 0.7
          }]
        },
        aiModel: { confidence: 0.5 }
      };
    }

    // Get contextual tasks with better error handling
    let contextualTasks = [];
    try {
      contextualTasks = await getTasksForContext(req.user._id, context);
      console.log('Found contextual tasks:', contextualTasks.length);
    } catch (taskError) {
      console.error('Error getting contextual tasks:', taskError);
      // Continue with empty array
    }

    // Calculate context scores for tasks
    const scoredTasks = contextualTasks.map(task => {
      try {
        const contextScore = calculateContextScore(task, context, req.user);
        return {
          ...task.toObject(),
          context_score: contextScore,
          context_reasoning: contextScore.reasoning || "Context analysis completed"
        };
      } catch (scoreError) {
        console.error('Error calculating context score for task:', task._id, scoreError);
        return {
          ...task.toObject(),
          context_score: { total: 50, reasoning: "Default score applied" },
          context_reasoning: "Default score applied"
        };
      }
    });

    // Sort by context score
    scoredTasks.sort((a, b) => (b.context_score.total || 50) - (a.context_score.total || 50));

    // FIXED: Generate context tips from AI suggestions
    const contextTips = generateContextTipsFromAI(aiContext, context);

    // Categorize tasks and suggestions
    const suggestions = {
      perfect_match: scoredTasks.filter(t => (t.context_score.total || 0) >= 85).slice(0, 3),
      good_fit: scoredTasks.filter(t => {
        const score = t.context_score.total || 0;
        return score >= 70 && score < 85;
      }).slice(0, 3),
      consider_later: scoredTasks.filter(t => (t.context_score.total || 0) < 70).slice(0, 2),
      context_tips: contextTips // Use AI-generated tips
    };

    // Extract AI insights
    const aiInsights = (aiContext.insights?.key_insights || []).slice(0, 2);

    res.json({
      success: true,
      message: `Found tasks perfect for your current context! 🎯`,
      data: {
        context,
        suggestions,
        ai_insights: aiInsights,
        context_analysis: {
          optimal_for: getOptimalActivities(context),
          should_avoid: getActivitiesToAvoid(context),
          energy_alignment: assessEnergyAlignment(context, req.user),
          productivity_forecast: predictProductivity(context, req.user)
        },
        debug_info: process.env.NODE_ENV === 'development' ? {
          total_tasks_analyzed: contextualTasks.length,
          ai_suggestions_count: aiContext.suggestions?.length || 0,
          ai_confidence: aiContext.aiModel?.confidence || 0
        } : undefined
      }
    });

  } catch (error) {
    console.error('Contextual tasks error:', error);
    res.status(500).json({
      success: false,
      message: "Unable to analyze context at this time",
      data: {
        context,
        suggestions: {
          perfect_match: [],
          good_fit: [],
          consider_later: [],
          context_tips: ["AI suggestions temporarily unavailable"]
        },
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

// FIXED: Function to generate context tips from AI suggestions
function generateContextTipsFromAI(aiContext, context) {
  const tips = [];
  
  try {
    // Extract tips from AI suggestions
    if (aiContext.suggestions && Array.isArray(aiContext.suggestions)) {
      aiContext.suggestions.forEach(suggestion => {
        if (suggestion.title && suggestion.description) {
          tips.push({
            tip: suggestion.title,
            description: suggestion.description,
            reasoning: suggestion.reasoning || "AI recommendation",
            priority: suggestion.priority || "medium",
            action: suggestion.details?.action || "general_advice"
          });
        }
      });
    }
    
    // Add context-specific tips if no AI suggestions
    if (tips.length === 0) {
      const { energy_level, available_time, location } = context;
      
      if (energy_level === 'high') {
        tips.push({
          tip: "Tackle challenging tasks",
          description: "Your energy is high - perfect for demanding work",
          reasoning: "High energy levels optimize complex task performance",
          priority: "high",
          action: "prioritize_difficult_tasks"
        });
      }
      
      if (available_time >= 90) {
        tips.push({
          tip: "Consider deep work session",
          description: "You have sufficient time for focused work",
          reasoning: "Long time blocks enable flow states",
          priority: "medium",
          action: "start_focus_session"
        });
      }
      
      if (location === 'office') {
        tips.push({
          tip: "Good time for collaboration",
          description: "Office environment supports team work",
          reasoning: "Physical presence facilitates communication",
          priority: "medium",
          action: "schedule_collaborative_work"
        });
      }
      
      // Default tip if none generated
      if (tips.length === 0) {
        tips.push({
          tip: "Review your priorities",
          description: "Take a moment to organize your tasks",
          reasoning: "Regular review maintains focus",
          priority: "low",
          action: "review_tasks"
        });
      }
    }
    
  } catch (error) {
    console.error('Error generating context tips:', error);
    tips.push({
      tip: "Stay focused",
      description: "Continue working on your current priorities",
      reasoning: "General productivity guidance",
      priority: "low",
      action: "maintain_focus"
    });
  }
  
  return tips.slice(0, 5); // Limit to 5 tips
}

// ENHANCED: Function to get tasks for context (add this if missing)
async function getTasksForContext(userId, context) {
  try {
    const Task = mongoose.model('Task');
    
    // Get incomplete tasks
    const query = {
      user: userId,
      completed: false
    };
    
    // Add context-based filtering
    if (context.available_time <= 30) {
      // For short time blocks, prioritize quick tasks
      query.$or = [
        { estimatedDuration: { $lte: 30 } },
        { estimatedDuration: { $exists: false } } // Include tasks without duration estimates
      ];
    }
    
    const tasks = await Task.find(query)
      .populate('category', 'name color')
      .populate('tags', 'name color')
      .sort({ priorityScore: -1, createdAt: -1 })
      .limit(20);
    
    return tasks;
    
  } catch (error) {
    console.error('Error in getTasksForContext:', error);
    return []; // Return empty array on error
  }
}

// ENHANCED: Function to calculate context score (add this if missing)
function calculateContextScore(task, context, user) {
  try {
    let score = 50; // Base score
    const reasoning = [];
    
    // Energy level alignment
    if (context.energy_level === 'high' && task.priority === 'high') {
      score += 20;
      reasoning.push("High energy matches high priority task");
    } else if (context.energy_level === 'low' && task.estimatedDuration <= 30) {
      score += 15;
      reasoning.push("Low energy suitable for quick tasks");
    }
    
    // Time availability alignment
    if (task.estimatedDuration) {
      if (task.estimatedDuration <= context.available_time) {
        score += 15;
        reasoning.push("Task fits in available time");
      } else {
        score -= 10;
        reasoning.push("Task may not fit in available time");
      }
    }
    
    // Priority boost
    const priorityBoost = {
      'urgent': 25,
      'high': 15,
      'medium': 5,
      'low': 0
    };
    score += priorityBoost[task.priority] || 0;
    
    // Due date urgency
    if (task.dueDate) {
      const daysUntilDue = (task.dueDate - new Date()) / (1000 * 60 * 60 * 24);
      if (daysUntilDue <= 1) {
        score += 20;
        reasoning.push("Due soon - urgent attention needed");
      } else if (daysUntilDue <= 3) {
        score += 10;
        reasoning.push("Due in a few days");
      }
    }
    
    // Location context
    if (context.location === 'office' && task.tags?.some(tag => 
      ['meeting', 'collaboration', 'team'].includes(tag.name?.toLowerCase())
    )) {
      score += 10;
      reasoning.push("Office location good for collaborative tasks");
    }
    
    return {
      total: Math.min(Math.max(score, 0), 100),
      reasoning: reasoning.join('; ') || "Standard context analysis",
      energy_match: context.energy_level === 'high' && task.priority === 'high',
      time_fit: !task.estimatedDuration || task.estimatedDuration <= context.available_time
    };
    
  } catch (error) {
    console.error('Error calculating context score:', error);
    return {
      total: 50,
      reasoning: "Error in context analysis - default score applied",
      energy_match: false,
      time_fit: true
    };
  }
}

// ADD: Missing helper functions (if they don't exist)
function getOptimalActivities(context) {
  const activities = [];
  
  if (context.energy_level === 'high') {
    activities.push("Complex problem solving", "Creative work", "Important decisions");
  } else if (context.energy_level === 'medium') {
    activities.push("Regular tasks", "Communication", "Review work");
  } else {
    activities.push("Administrative tasks", "Email processing", "Simple updates");
  }
  
  if (context.available_time >= 90) {
    activities.push("Deep work sessions", "Long-form writing");
  } else if (context.available_time <= 30) {
    activities.push("Quick wins", "Status updates");
  }
  
  return activities.slice(0, 3);
}

function getActivitiesToAvoid(context) {
  const avoid = [];
  
  if (context.energy_level === 'low') {
    avoid.push("Complex analysis", "Critical decisions");
  }
  
  if (context.available_time <= 30) {
    avoid.push("Long meetings", "Deep research");
  }
  
  if (context.noise_level === 'noisy') {
    avoid.push("Focused writing", "Detailed analysis");
  }
  
  return avoid;
}

function assessEnergyAlignment(context, user) {
  const energyLevel = context.energy_level || 'medium';
  const timeOfDay = context.timeOfDay || 'midday';
  
  if (energyLevel === 'high' && ['morning', 'early_morning'].includes(timeOfDay)) {
    return "Perfect alignment - peak energy at optimal time.";
  } else if (energyLevel === 'medium') {
    return "Good alignment with your current context.";
  } else {
    return "Consider taking a break to restore energy.";
  }
}

function predictProductivity(context, user) {
  let score = 60; // Base score
  
  if (context.energy_level === 'high') score += 20;
  if (context.energy_level === 'low') score -= 15;
  
  if (context.available_time >= 90) score += 10;
  if (context.available_time <= 30) score -= 5;
  
  if (context.location === 'office') score += 5;
  
  return Math.min(Math.max(score, 0), 100);
}

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

// @desc    Get AI-powered task analytics
// @route   GET /api/tasks/analytics/insights
// @access  Private
const getTaskInsights = asyncHandler(async (req, res) => {
  const {
    time_period = "7days",
    insight_type = "all",
    include_predictions = true,
  } = req.query;

  try {
    const aiContext = await AIContext.generateSuggestions(
      req.user._id,
      "productivity_insight",
      { time_period, insight_type, include_predictions }
    );

    const timeRange = getTimeRange(time_period);

    // FIXED: Safe population
    let tasks;
    try {
      tasks = await Task.find({
        user: req.user._id,
        createdAt: { $gte: timeRange.start, $lte: timeRange.end },
      })
        .populate("category", "name color")
        .populate("tags", "name color");
    } catch (populateError) {
      console.error(
        "Population failed in task insights:",
        populateError.message
      );
      tasks = await Task.find({
        user: req.user._id,
        createdAt: { $gte: timeRange.start, $lte: timeRange.end },
      });
    }

    const taskAnalysis = await analyzeTaskPatterns(tasks, req.user);

    const insights = {
      productivity_insights: aiContext.insights.key_insights,
      pattern_analysis: taskAnalysis.patterns,
      performance_metrics: taskAnalysis.metrics,
      predictions:
        include_predictions === "true" ? aiContext.insights.predictions : [],
      recommendations: aiContext.suggestions.slice(0, 5),
      trends: taskAnalysis.trends,
      achievements_unlocked: taskAnalysis.achievements,
      improvement_areas: taskAnalysis.improvement_areas,
    };

    res.json({
      success: true,
      message: "Task insights generated! 📊",
      data: {
        insights,
        summary: {
          total_tasks: tasks.length,
          completion_rate: taskAnalysis.metrics.completion_rate,
          productivity_score: await req.user.getProductivityScore(),
          improvement_trend: taskAnalysis.trends.overall_trend,
          ai_confidence: aiContext.aiModel.confidence,
        },
        action_items: generateActionItems(insights),
        next_review_date: getNextReviewDate(time_period),
      },
    });
  } catch (error) {
    console.error("Task insights error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to generate insights at this time",
    });
  }
});

// ===================================================================
// STANDARD CRUD OPERATIONS WITH AI ENHANCEMENT
// ===================================================================

// @desc    Get all tasks with smart filtering and AI insights
// @route   GET /api/tasks
// @access  Private
const getAllTasks = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    priority,
    category,
    completed,
    due_date,
    search,
    sort_by = "created_at", // FIXED: Default to simple sort
    include_ai_insights = "false", // FIXED: Default to false
  } = req.query;

  const query = { user: req.user._id };

  if (priority) query.priority = priority;
  if (category) query.category = category;
  if (completed !== undefined) query.completed = completed === "true";
  if (due_date) {
    const date = new Date(due_date);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    query.dueDate = { $gte: date, $lt: nextDay };
  }
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const sortOptions = {
      priority: { priorityScore: -1 },
      due_date: { dueDate: 1 },
      created_at: { createdAt: -1 },
      smart: { priorityScore: -1, createdAt: -1 },
    };

    // FIXED: Safe population with fallback
    let tasks;
    try {
      tasks = await Task.find(query)
        .populate("category", "name color")
        .populate("tags", "name color")
        .sort(sortOptions[sort_by] || { createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    } catch (populateError) {
      console.error(
        "Population failed in getAllTasks, using fallback:",
        populateError.message
      );
      tasks = await Task.find(query)
        .sort(sortOptions[sort_by] || { createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    }

    const total = await Task.countDocuments(query);

    // Generate basic insights
    const basicInsights = {
      overview: {
        total_tasks: tasks.length,
        completed_tasks: tasks.filter((t) => t.completed).length,
        urgent_tasks: tasks.filter((t) => t.priority === "urgent").length,
        overdue_tasks: tasks.filter(
          (t) => t.dueDate && t.dueDate < new Date() && !t.completed
        ).length,
      },
      recommendations: [
        "Focus on urgent tasks first",
        "Break down large tasks into smaller ones",
      ],
      productivity_tip: "Focus on your highest priority tasks first!",
    };

    res.json({
      success: true,
      message: `Found ${tasks.length} tasks`,
      data: {
        tasks,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / parseInt(limit)),
          total_tasks: total,
          per_page: parseInt(limit),
        },
        ai_insights: include_ai_insights === "true" ? basicInsights : null,
        applied_filters: {
          priority,
          category,
          completed,
          due_date,
          search,
          sort_by,
        },
      },
    });
  } catch (error) {
    console.error("Get all tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to retrieve tasks",
    });
  }
});

// @desc    Get single task with AI-enhanced details
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = asyncHandler(async (req, res) => {
  // FIXED: Safe population
  let task;
  try {
    task = await Task.findById(req.params.id)
      .populate("category", "name color description")
      .populate("tags", "name color")
      .populate("dependencies.task", "title completed priority")
      .populate("dependents", "title completed priority");
  } catch (populateError) {
    console.error("Population failed in getTaskById:", populateError.message);
    task = await Task.findById(req.params.id);
  }

  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  if (task.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to view this task");
  }

  task.views += 1;
  await task.save();

  try {
    let aiInsights = null;
    if (req.user?.aiPreferences?.features?.taskSuggestions) {
      aiInsights = await generateSingleTaskInsights(task, req.user);
    }

    const canStart = await task.canStart();
    const completionPrediction = await predictTaskCompletion(task, req.user);

    res.json({
      success: true,
      message: "Task retrieved successfully",
      data: {
        task: task.toObject(),
        task_status: {
          can_start: canStart,
          blocking_tasks: !canStart ? await getBlockingTasks(task) : [],
          completion_prediction: completionPrediction,
        },
        ai_insights: aiInsights,
        suggestions: aiInsights?.suggestions || [],
        related_tasks: await getRelatedTasks(task, req.user._id),
      },
    });
  } catch (error) {
    console.error("Get task by ID error:", error);
    res.json({
      success: true,
      message: "Task retrieved successfully",
      data: {
        task: task.toObject(),
        ai_note: "AI insights temporarily unavailable",
      },
    });
  }
});

// @desc    Delete task with dependency impact analysis
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  if (task.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this task");
  }

  try {
    const dependentTasks = await Task.find({ "dependencies.task": task._id });

    if (dependentTasks.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete task with dependencies",
        data: {
          dependent_tasks: dependentTasks.map((t) => ({
            id: t._id,
            title: t.title,
            impact: "This task is blocking the completion of dependent tasks",
          })),
          suggestions: [
            "Complete or reassign dependent tasks first",
            "Remove dependencies before deleting",
            "Archive instead of deleting to preserve history",
          ],
        },
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Task deleted successfully",
      data: { deleted_task_id: task._id },
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to delete task",
    });
  }
});

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 6) return "night";
  if (hour < 9) return "early_morning";
  if (hour < 12) return "morning";
  if (hour < 15) return "midday";
  if (hour < 18) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
};

const getDayOfWeek = () => {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[new Date().getDay()];
};

const predictTaskCompletion = async (task, user) => {
  return {
    likelihood: task.progress > 50 ? "High" : "Medium",
    estimated_completion: "Within 2-3 days",
    factors: ["Current progress", "Historical patterns", "Available time"],
  };
};

const getBlockingTasks = async (task) => {
  const blockingTasks = await Task.find({
    _id: { $in: task.dependencies.map((dep) => dep.task) },
    completed: false,
  }).select("title priority deadline");

  return blockingTasks;
};

const getRelatedTasks = async (task, userId) => {
  const relatedTasks = await Task.find({
    user: userId,
    category: task.category,
    _id: { $ne: task._id },
    completed: false,
  })
    .limit(3)
    .select("title priority");

  return relatedTasks;
};

const learnFromTaskUpdate = async (
  originalTask,
  updatedTask,
  originalValues,
  user,
  reason
) => {
  console.log("Learning from task update:", updatedTask._id);
  // AI learning implementation would go here
};

// Keep the existing getAllTasksSafe function as a backup
const getAllTasksSafe = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    priority,
    category,
    completed,
    due_date,
    search,
    sort_by = "created_at",
    include_ai_insights = "false",
  } = req.query;

  const query = { user: req.user._id };

  // Build query filters
  if (priority) query.priority = priority;
  if (category) query.category = category;
  if (completed !== undefined) query.completed = completed === "true";
  if (due_date) {
    const date = new Date(due_date);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    query.dueDate = { $gte: date, $lt: nextDay };
  }
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const sortOptions = {
      priority: { priorityScore: -1 },
      due_date: { dueDate: 1 },
      created_at: { createdAt: -1 },
      smart: { priorityScore: -1, createdAt: -1 },
    };

    const tasks = await Task.find(query)
      .sort(sortOptions[sort_by] || { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Task.countDocuments(query);

    const basicInsights = {
      overview: {
        total_tasks: tasks.length,
        completed_tasks: tasks.filter((t) => t.completed).length,
        urgent_tasks: tasks.filter((t) => t.priority === "urgent").length,
      },
      recommendations: [],
      productivity_tip: "Focus on your highest priority tasks first!",
    };

    res.json({
      success: true,
      message: `Found ${tasks.length} tasks`,
      data: {
        tasks,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / parseInt(limit)),
          total_tasks: total,
          per_page: parseInt(limit),
        },
        ai_insights: include_ai_insights === "true" ? basicInsights : null,
        applied_filters: {
          priority,
          category,
          completed,
          due_date,
          search,
          sort_by,
        },
      },
    });
  } catch (error) {
    console.error("Get all tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to retrieve tasks",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = {
  createTask,
  getTaskRecommendations,
  optimizeSchedule,
  updateTask,
  completeTask,
  getContextualTasks,
  getTaskInsights,
  getAllTasks,
  getTaskById,
  deleteTask,
  getAllTasksSafe,
};
