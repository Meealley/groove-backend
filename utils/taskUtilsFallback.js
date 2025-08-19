// utils/taskUtilsFallback.js
// Fallback implementations for task utility functions

const calculateSmartPriority = async (task, user, context = {}) => {
  // Simple priority calculation based on task priority and deadline
  let score = 0;
  
  const priorityWeights = { low: 25, medium: 50, high: 75, urgent: 100 };
  score += priorityWeights[task.priority] || 50;
  
  // Add deadline urgency
  if (task.deadline) {
    const daysUntilDeadline = Math.ceil((task.deadline - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilDeadline <= 1) score += 30;
    else if (daysUntilDeadline <= 3) score += 20;
    else if (daysUntilDeadline <= 7) score += 10;
  }
  
  return {
    score: Math.min(score, 100),
    reasoning: `Priority: ${task.priority}, Deadline urgency applied`,
    fit_score: score,
    urgency_score: task.deadline ? 80 : 50
  };
};

const generateTaskInsights = (tasks, user, context = {}) => {
  return {
    primary_tip: "Focus on high-priority tasks first",
    productivity_forecast: "Good",
    suggested_breaks: [],
    time_optimization: "Consider grouping similar tasks together"
  };
};

const applyAIEnhancements = async (task, aiContext, user) => {
  return {
    suggestedDuration: task.estimatedDuration || 60,
    suggestedStartTime: null,
    parsedAttributes: {},
    insights: ["Task created successfully"],
    nextActions: ["Start working on the task", "Set a timer for focus"]
  };
};

const generateOptimizedSchedule = async (tasks, user, options = {}) => {
  return {
    scheduled_tasks: tasks.map((task, index) => ({
      task_id: task._id,
      suggested_start: new Date(Date.now() + index * 60 * 60 * 1000), // 1 hour apart
      suggested_duration: task.estimatedDuration || 60,
      scheduling_score: 80
    })),
    total_estimated_time: tasks.reduce((sum, task) => sum + (task.estimatedDuration || 60), 0),
    productivity_forecast: "Good",
    potential_issues: [],
    optimization_score: 85
  };
};

const generateCompletionInsights = async (task, user, details = {}) => {
  return {
    congratulation_message: "Great job completing this task!",
    productivity_impact: "Positive",
    time_analysis: "Task completed within estimated time",
    learning_points: ["Good time estimation", "Maintained focus"]
  };
};

const learnFromTaskCompletion = async (task, user, details = {}) => {
  console.log(`Learning from completion of task: ${task.title}`);
  return true;
};

const updateUserMetrics = async (user, task, timeSpent) => {
  console.log(`Updating metrics for user: ${user._id}`);
  return true;
};

const checkAchievements = async (user, task) => {
  return [];
};

const getNextTaskSuggestion = async (user, completedTask) => {
  return {
    suggestion: "Take a short break before your next task",
    next_task: null,
    reasoning: "You just completed a task - a break will help maintain productivity"
  };
};

const generateCelebrationMessage = (task, insights) => {
  return `🎉 Awesome! You completed "${task.title}"!`;
};

const getTasksForContext = async (userId, context) => {
  const Task = require("../models/TaskModel");
  
  return await Task.find({
    user: userId,
    completed: false
  }).limit(10);
};

const calculateContextScore = (task, context, user) => {
  return {
    total: 75,
    reasoning: "Good match for current context",
    energy_match: 80,
    time_match: 70,
    location_match: 75
  };
};

const analyzeTaskPatterns = async (tasks, user) => {
  return {
    patterns: ["Morning productivity peak", "Prefers shorter tasks"],
    metrics: {
      completion_rate: 80,
      avg_completion_time: 45,
      productivity_score: 85
    },
    trends: {
      overall_trend: "improving"
    },
    achievements: [],
    improvement_areas: ["Time estimation", "Task breakdown"]
  };
};

const generateContextTips = (context, user, aiContext) => {
  return [
    "This is a good time for focused work",
    "Consider taking breaks every 25 minutes",
    "Your energy level is optimal for challenging tasks"
  ];
};

const getOptimalActivities = (context) => {
  return ["Deep work", "Creative tasks", "Problem solving"];
};

const getActivitiesToAvoid = (context) => {
  return ["Routine tasks", "Administrative work"];
};

const assessEnergyAlignment = (context, user) => {
  return {
    alignment: "Good",
    score: 80,
    recommendations: ["Maintain current energy level"]
  };
};

const predictProductivity = (context, user) => {
  return {
    forecast: "High",
    confidence: 85,
    factors: ["Good energy level", "Optimal time of day"]
  };
};

const generateTaskListInsights = async (tasks, user) => {
  return {
    overview: `You have ${tasks.length} tasks`,
    priorities: tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
    recommendations: ["Focus on high-priority items first"],
    productivity_tip: "Break large tasks into smaller, manageable pieces"
  };
};

const generateSingleTaskInsights = async (task, user) => {
  return {
    suggestions: [
      "Consider breaking this task into subtasks",
      "Set a timer to maintain focus",
      "Eliminate distractions before starting"
    ],
    estimated_focus_time: task.estimatedDuration || 60,
    difficulty_assessment: "Medium",
    context_recommendations: ["Work in a quiet environment"]
  };
};

const getTimeRange = (timePeriod) => {
  const now = new Date();
  const ranges = {
    'today': {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    },
    '7days': {
      start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      end: now
    },
    '30days': {
      start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      end: now
    }
  };
  
  return ranges[timePeriod] || ranges['7days'];
};

const generateActionItems = (insights) => {
  return [
    "Review your task priorities",
    "Schedule focused work blocks",
    "Take regular breaks to maintain productivity"
  ];
};

const getNextReviewDate = (timePeriod) => {
  const now = new Date();
  const intervals = {
    'today': 1,
    '7days': 7,
    '30days': 30
  };
  
  const days = intervals[timePeriod] || 7;
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
};

module.exports = {
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
  getNextReviewDate
};