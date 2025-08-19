const express = require("express");

// Import controllers
const {
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
  getAllTasksSafe
} = require("../controllers/taskcontroller");

// Import middleware
const { protect } = require("../middleware/authMiddleware");
const {
  taskValidation,
  validateTaskUpdate,
  validateBulkOperation,
  validateReminder,
  validateAIFeedback,
  validateExport,
  checkTaskOwnership,
  checkAIUsageLimit,
  enhanceWithUserPreferences
} = require("../middleware/taskValidationMiddleware");

const router = express.Router();

// ===================================================================
// AI-POWERED TASK ENDPOINTS
// ===================================================================

// Smart task creation with AI assistance
router.post("/", 
  protect, 
  taskValidation, 
  enhanceWithUserPreferences,
  createTask
);

// Get AI-powered task recommendations
router.get("/recommendations", 
  protect, 
  checkAIUsageLimit,
  getTaskRecommendations
);

// Get contextual task suggestions based on current situation
router.get("/contextual", 
  protect, 
  checkAIUsageLimit,
  getContextualTasks
);

// AI-powered schedule optimization
router.post("/optimize-schedule", 
  protect, 
  checkAIUsageLimit,
  optimizeSchedule
);

// Get comprehensive task insights and analytics
router.get("/analytics/insights", 
  protect, 
  checkAIUsageLimit,
  getTaskInsights
);

// ===================================================================
// ENHANCED TASK MANAGEMENT ENDPOINTS
// ===================================================================

// Get all tasks with smart filtering and sorting
router.get("/", 
  protect, 
  getAllTasks
  // getAllTasksSafe,
);

// Get single task with AI-enhanced details
router.get("/:id", 
  protect, 
  checkTaskOwnership, 
  getTaskById
);

// Intelligent task updates with AI learning
router.put("/:id", 
  protect, 
  checkTaskOwnership,
  validateTaskUpdate, 
  updateTask
);

// Smart task completion with learning
router.post("/:id/complete", 
  protect, 
  checkTaskOwnership,
  completeTask
);

// Delete task with dependency checking
router.delete("/:id", 
  protect, 
  checkTaskOwnership,
  deleteTask
);

// ===================================================================
// BULK AND UTILITY OPERATIONS
// ===================================================================

// Bulk update multiple tasks
router.patch("/bulk", 
  protect, 
  validateBulkOperation,
  async (req, res) => {
    const asyncHandler = require("express-async-handler");
    
    const bulkUpdateTasks = asyncHandler(async (req, res) => {
      const { task_ids, operation, data } = req.body;

      try {
        // Verify all tasks belong to the user
        const Task = require("../models/TaskModel");
        const tasks = await Task.find({
          _id: { $in: task_ids },
          user: req.user._id
        });

        if (tasks.length !== task_ids.length) {
          res.status(403);
          throw new Error("Some tasks not found or not authorized");
        }

        let updateQuery = {};
        let successMessage = "";

        switch (operation) {
          case 'update_priority':
            updateQuery.priority = data.priority;
            successMessage = `Updated priority to ${data.priority} for ${tasks.length} tasks`;
            break;
          
          case 'mark_complete':
            updateQuery.completed = true;
            updateQuery.completedAt = new Date();
            updateQuery.progress = 100;
            successMessage = `Marked ${tasks.length} tasks as complete! 🎉`;
            break;
          
          case 'update_deadline':
            updateQuery.deadline = data.deadline;
            successMessage = `Updated deadline for ${tasks.length} tasks`;
            break;
          
          case 'add_tags':
            updateQuery.$addToSet = { tags: { $each: data.tags } };
            successMessage = `Added tags to ${tasks.length} tasks`;
            break;
          
          default:
            res.status(400);
            throw new Error("Invalid bulk operation");
        }

        const result = await Task.updateMany(
          { _id: { $in: task_ids } },
          updateQuery
        );

        res.json({
          success: true,
          message: successMessage,
          data: {
            updated_count: result.modifiedCount,
            affected_tasks: task_ids
          }
        });

      } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({
          success: false,
          message: "Bulk operation failed"
        });
      }
    });
    
    return bulkUpdateTasks(req, res);
  }
);

// Duplicate task with AI improvements
router.post("/:id/duplicate", 
  protect, 
  checkTaskOwnership,
  async (req, res) => {
    const asyncHandler = require("express-async-handler");
    
    const duplicateTask = asyncHandler(async (req, res) => {
      const { include_ai_improvements = 'true' } = req.body;
      
      const Task = require("../models/TaskModel");
      const originalTask = await Task.findById(req.params.id);

      try {
        const duplicateData = originalTask.toObject();
        delete duplicateData._id;
        delete duplicateData.createdAt;
        delete duplicateData.updatedAt;
        delete duplicateData.completedAt;
        
        duplicateData.completed = false;
        duplicateData.progress = 0;
        duplicateData.views = 0;
        duplicateData.modifications = 0;
        duplicateData.title = `${duplicateData.title} (Copy)`;

        if (include_ai_improvements === 'true' && req.user.aiPreferences.features.taskSuggestions) {
          // Apply AI improvements
          const { generateDuplicationImprovements } = require("../utils/taskUtils");
          const improvements = await generateDuplicationImprovements(originalTask, req.user);
          
          if (improvements.suggested_duration) {
            duplicateData.suggestedDuration = improvements.suggested_duration;
          }
        }

        const duplicatedTask = await Task.create(duplicateData);

        res.status(201).json({
          success: true,
          message: "Task duplicated with AI improvements! 🚀",
          data: {
            original_task: originalTask._id,
            duplicated_task: await Task.findById(duplicatedTask._id).populate('category tags'),
            improvements_applied: include_ai_improvements === 'true'
          }
        });

      } catch (error) {
        console.error('Duplicate task error:', error);
        res.status(500).json({
          success: false,
          message: "Unable to duplicate task"
        });
      }
    });
    
    return duplicateTask(req, res);
  }
);

// ===================================================================
// TASK RELATIONSHIPS AND DEPENDENCIES
// ===================================================================

// Get task dependencies and impact analysis
router.get("/:id/dependencies", 
  protect, 
  checkTaskOwnership,
  async (req, res) => {
    const asyncHandler = require("express-async-handler");
    
    const getTaskDependencies = asyncHandler(async (req, res) => {
      const Task = require("../models/TaskModel");
      const task = await Task.findById(req.params.id)
        .populate('dependencies.task', 'title completed priority')
        .populate('dependents', 'title completed priority');

      res.json({
        success: true,
        data: {
          dependencies: task.dependencies,
          dependents: task.dependents,
          impact_analysis: {
            blocking_count: task.dependents.length,
            blocked_by_count: task.dependencies.length
          }
        }
      });
    });
    
    return getTaskDependencies(req, res);
  }
);

// Update task progress with automatic insights
router.patch("/:id/progress", 
  protect, 
  checkTaskOwnership,
  async (req, res) => {
    const asyncHandler = require("express-async-handler");
    
    const updateTaskProgress = asyncHandler(async (req, res) => {
      const { progress } = req.body;
      const Task = require("../models/TaskModel");
      
      const task = await Task.findByIdAndUpdate(
        req.params.id,
        { progress },
        { new: true }
      );

      res.json({
        success: true,
        message: `Progress updated to ${progress}%`,
        data: { task }
      });
    });
    
    return updateTaskProgress(req, res);
  }
);

// ===================================================================
// REMINDERS AND NOTIFICATIONS
// ===================================================================

// Add smart reminder to task
router.post("/:id/reminders", 
  protect, 
  checkTaskOwnership,
  validateReminder,
  async (req, res) => {
    const asyncHandler = require("express-async-handler");
    
    const addTaskReminder = asyncHandler(async (req, res) => {
      const Task = require("../models/TaskModel");
      const task = await Task.findById(req.params.id);
      
      task.reminders.push(req.body);
      await task.save();

      res.json({
        success: true,
        message: "Reminder added successfully",
        data: { task }
      });
    });
    
    return addTaskReminder(req, res);
  }
);

// ===================================================================
// ANALYTICS AND REPORTING
// ===================================================================

// Get task history and patterns
router.get("/:id/history", 
  protect, 
  checkTaskOwnership,
  async (req, res) => {
    const asyncHandler = require("express-async-handler");
    
    const getTaskHistory = asyncHandler(async (req, res) => {
      // Implementation for task history
      res.json({
        success: true,
        data: { 
          history: [],
          message: "Task history feature coming soon!"
        }
      });
    });
    
    return getTaskHistory(req, res);
  }
);

// Get user's task statistics
router.get("/user/stats", 
  protect,
  async (req, res) => {
    const asyncHandler = require("express-async-handler");
    const mongoose = require("mongoose");
    
    const getTaskStats = asyncHandler(async (req, res) => {
      const Task = require("../models/TaskModel");
      
      const stats = await Task.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: ['$completed', 1, 0] } },
            pending: { $sum: { $cond: ['$completed', 0, 1] } }
          }
        }
      ]);

      res.json({
        success: true,
        data: { 
          stats: stats[0] || { total: 0, completed: 0, pending: 0 },
          productivity_score: await req.user.getProductivityScore()
        }
      });
    });
    
    return getTaskStats(req, res);
  }
);

// Export tasks with analytics
router.get("/export/:format", 
  protect,
  validateExport,
  async (req, res) => {
    const asyncHandler = require("express-async-handler");
    
    const exportTasks = asyncHandler(async (req, res) => {
      res.json({
        success: true,
        message: "Export feature coming soon!",
        data: {
          format: req.params.format,
          note: "Will export tasks in requested format"
        }
      });
    });
    
    return exportTasks(req, res);
  }
);

// ===================================================================
// AI INTERACTION ENDPOINTS
// ===================================================================

// Record AI suggestion feedback for learning
router.post("/:id/ai-feedback", 
  protect, 
  checkTaskOwnership,
  validateAIFeedback,
  async (req, res) => {
    const asyncHandler = require("express-async-handler");
    
    const recordAIFeedback = asyncHandler(async (req, res) => {
      const { suggestion_id, feedback_type, rating, comment } = req.body;
      
      try {
        const AIContext = require("../models/AiContextModel");
        
        const aiContext = await AIContext.findOne({
          user: req.user._id,
          'suggestions._id': suggestion_id
        });
        
        if (!aiContext) {
          return res.status(404).json({
            success: false,
            message: "AI suggestion not found"
          });
        }
        
        await aiContext.recordSuggestionFeedback(suggestion_id, {
          action: feedback_type,
          rating,
          comment,
          type: 'user_feedback'
        });
        
        res.json({
          success: true,
          message: "Feedback recorded! This helps improve AI suggestions. 🤖",
          data: {
            learning_impact: "Your feedback helps make suggestions more personalized"
          }
        });
        
      } catch (error) {
        console.error('AI feedback error:', error);
        res.status(500).json({
          success: false,
          message: "Unable to record feedback at this time"
        });
      }
    });
    
    return recordAIFeedback(req, res);
  }
);

// Get AI suggestion status and performance
router.get("/ai/performance", 
  protect,
  async (req, res) => {
    const asyncHandler = require("express-async-handler");
    
    const getAIPerformance = asyncHandler(async (req, res) => {
      try {
        const AIContext = require("../models/AiContextModel");
        
        const recentContexts = await AIContext.find({
          user: req.user._id,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }).sort({ createdAt: -1 }).limit(20);
        
        let totalSuggestions = 0;
        let acceptedSuggestions = 0;
        let totalSatisfaction = 0;
        let satisfactionCount = 0;
        
        recentContexts.forEach(context => {
          context.suggestions.forEach(suggestion => {
            if (suggestion.interaction.presented) {
              totalSuggestions++;
              
              if (suggestion.interaction.accepted) {
                acceptedSuggestions++;
              }
              
              if (suggestion.effectiveness.user_satisfaction) {
                totalSatisfaction += suggestion.effectiveness.user_satisfaction;
                satisfactionCount++;
              }
            }
          });
        });
        
        const performance = {
          suggestion_count: totalSuggestions,
          acceptance_rate: totalSuggestions > 0 ? (acceptedSuggestions / totalSuggestions) * 100 : 0,
          avg_satisfaction: satisfactionCount > 0 ? totalSatisfaction / satisfactionCount : 0,
          ai_learning_status: req.user.aiPreferences.learning.adaptToPatterns ? 'active' : 'disabled',
          improvement_trend: acceptedSuggestions > totalSuggestions * 0.7 ? 'improving' : 'stable'
        };
        
        res.json({
          success: true,
          message: "AI performance data retrieved",
          data: {
            performance,
            insights: [
              {
                type: 'performance',
                message: performance.acceptance_rate > 70 
                  ? "AI suggestions are working well for you!" 
                  : "AI is learning your preferences to improve suggestions",
                confidence: performance.acceptance_rate / 100
              }
            ],
            recommendations: performance.acceptance_rate < 50 
              ? ["Try providing feedback on suggestions to improve AI accuracy"]
              : ["Keep using AI features for even better personalization"]
          }
        });
        
      } catch (error) {
        console.error('AI performance error:', error);
        res.status(500).json({
          success: false,
          message: "Unable to retrieve AI performance data"
        });
      }
    });
    
    return getAIPerformance(req, res);
  }
);

// ===================================================================
// PRODUCTIVITY INSIGHTS ENDPOINTS
// ===================================================================

// Get daily productivity summary
router.get("/productivity/daily", 
  protect,
  async (req, res) => {
    const asyncHandler = require("express-async-handler");
    
    const getDailyProductivity = asyncHandler(async (req, res) => {
      try {
        const Task = require("../models/TaskModel");
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayTasks = await Task.find({
          user: req.user._id,
          $or: [
            { dueDate: { $gte: today, $lt: tomorrow } },
            { completedAt: { $gte: today, $lt: tomorrow } }
          ]
        }).populate('category tags');
        
        const completedToday = todayTasks.filter(t => t.completed).length;
        const totalToday = todayTasks.length;
        
        const productivity = {
          date: today.toISOString().split('T')[0],
          tasks_completed: completedToday,
          tasks_total: totalToday,
          completion_rate: totalToday > 0 ? (completedToday / totalToday) * 100 : 0,
          time_tracked: todayTasks.reduce((sum, task) => sum + (task.actualDuration || 0), 0),
          productivity_score: await req.user.getProductivityScore(1),
          streak_status: req.user.analytics.metrics.streakDays
        };
        
        const insights = [];
        
        if (productivity.completion_rate >= 80) {
          insights.push({
            type: 'success',
            message: "Excellent productivity today! You're crushing your goals! 🚀",
            icon: '🏆'
          });
        } else if (productivity.completion_rate >= 60) {
          insights.push({
            type: 'good',
            message: "Good progress today! You're on track with your tasks.",
            icon: '👍'
          });
        } else {
          insights.push({
            type: 'improvement',
            message: "Room for improvement. Consider breaking down larger tasks tomorrow.",
            icon: '💡'
          });
        }
        
        res.json({
          success: true,
          message: "Daily productivity summary generated",
          data: {
            productivity,
            insights,
            tomorrow_suggestions: [
              "Review incomplete tasks and reschedule if needed",
              "Plan your top 3 priorities for tomorrow",
              "Consider what worked well today and replicate it"
            ]
          }
        });
        
      } catch (error) {
        console.error('Daily productivity error:', error);
        res.status(500).json({
          success: false,
          message: "Unable to generate daily productivity summary"
        });
      }
    });
    
    return getDailyProductivity(req, res);
  }
);

module.exports = router;