const Task = require("../models/TaskModel");
const User = require("../models/UserModel");
const AIContext = require("../models/AiContextModel");

// ===================================================================
// SMART PRIORITY CALCULATION SYSTEM
// ===================================================================

const calculateSmartPriority = async (task, user, context = {}) => {
  let score = task.priorityScore || 50;
  const factors = {};
  
  // 1. DEADLINE URGENCY (0-30 points)
  factors.deadline_urgency = calculateDeadlineUrgency(task);
  
  // 2. DEPENDENCY IMPACT (0-25 points)
  factors.dependency_weight = calculateDependencyWeight(task);
  
  // 3. USER BEHAVIOR LEARNING (0-20 points)
  factors.user_preference = await getUserTaskAffinity(task, user);
  
  // 4. CONTEXT AWARENESS (0-15 points)
  factors.contextual_fit = calculateContextualFit(task, user, context);
  
  // 5. HISTORICAL PATTERNS (0-10 points)
  factors.historical_pattern = await calculateHistoricalPattern(task, user);
  
  // Calculate final score
  const finalScore = Math.min(100, score + 
    factors.deadline_urgency + 
    factors.dependency_weight + 
    factors.user_preference + 
    factors.contextual_fit + 
    factors.historical_pattern
  );
  
  return {
    score: finalScore,
    factors,
    fit_score: (factors.contextual_fit + factors.user_preference) / 35 * 100,
    reasoning: generatePriorityReasoning(factors),
    urgency_score: calculateUrgencyScore(task)
  };
};

const calculateDeadlineUrgency = (task) => {
  if (!task.deadline) return 0;
  
  const now = new Date();
  const deadline = new Date(task.deadline);
  const hoursLeft = (deadline - now) / (1000 * 60 * 60);
  
  if (hoursLeft < 0) return 30; // Overdue
  if (hoursLeft < 4) return 25;  // Due today
  if (hoursLeft < 24) return 20; // Due tomorrow
  if (hoursLeft < 72) return 15; // Due this week
  if (hoursLeft < 168) return 10; // Due next week
  
  return 0;
};

const calculateDependencyWeight = (task) => {
  const blockedTasks = task.dependencies?.blocks?.length || 0;
  const blockingTasks = task.dependencies?.blocked_by?.length || 0;
  
  let score = 0;
  score += blockedTasks * 8; // Each task we're blocking adds urgency
  score -= blockingTasks * 5; // Being blocked reduces urgency
  
  return Math.min(Math.max(score, 0), 25);
};

const getUserTaskAffinity = async (task, user) => {
  try {
    const completedSimilarTasks = await Task.find({
      user: user._id,
      category: task.category,
      completed: true
    }).limit(10);

    if (completedSimilarTasks.length === 0) return 0;

    let affinityScore = 0;
    
    completedSimilarTasks.forEach(completedTask => {
      if (completedTask.actualDuration && completedTask.estimatedDuration) {
        const efficiency = completedTask.estimatedDuration / completedTask.actualDuration;
        affinityScore += Math.min(efficiency, 2) * 10;
      }
    });

    return Math.min(20, affinityScore / completedSimilarTasks.length);

  } catch (error) {
    console.error('User task affinity calculation error:', error);
    return 0;
  }
};

const calculateContextualFit = (task, user, context) => {
  let score = 0;
  const now = new Date();
  const currentHour = now.getHours();
  
  // Time of day preference
  if (context.energy_level === 'high' && task.estimatedDuration > 60) {
    score += 8;
  }
  if (context.energy_level === 'low' && task.estimatedDuration <= 30) {
    score += 8;
  }
  
  // Available time fit
  const estimatedMinutes = task.estimatedDuration || 30;
  if (context.available_time) {
    if (estimatedMinutes <= context.available_time) {
      score += 5;
    } else {
      score -= 3;
    }
  }
  
  // Energy level matching
  if (context.energy_level) {
    const taskComplexity = calculateTaskComplexity(task);
    if (energyMatches(context.energy_level, taskComplexity)) {
      score += 5;
    }
  }
  
  return Math.min(Math.max(score, 0), 15);
};

const calculateHistoricalPattern = async (task, user) => {
  const dayOfWeek = new Date().getDay();
  const timeOfDay = new Date().getHours();
  
  // Simple pattern recognition
  let score = 0;
  
  // Check if user typically completes similar tasks at this time
  const similarCompletedTasks = await Task.find({
    user: user._id,
    category: task.category,
    completed: true,
    completedAt: { $exists: true }
  }).limit(20);
  
  if (similarCompletedTasks.length > 0) {
    const timeMatches = similarCompletedTasks.filter(t => {
      const completedHour = new Date(t.completedAt).getHours();
      return Math.abs(completedHour - timeOfDay) <= 2;
    }).length;
    
    const successRate = timeMatches / similarCompletedTasks.length;
    score += successRate * 10;
  }
  
  return Math.min(score, 10);
};

// ===================================================================
// TASK INTELLIGENCE AND ENHANCEMENT
// ===================================================================

const applyAIEnhancements = async (task, aiContext, user) => {
  const enhancements = {
    insights: [],
    nextActions: []
  };

  // Parse natural language input if provided
  if (task.naturalLanguageInput) {
    enhancements.parsedAttributes = parseNaturalLanguage(task.naturalLanguageInput);
    
    if (enhancements.parsedAttributes.extractedDate) {
      enhancements.suggestedStartTime = enhancements.parsedAttributes.extractedDate;
    }
  }

  // Suggest optimal duration based on similar tasks
  if (task.estimatedDuration) {
    const adjustment = await calculateDurationAdjustment(task, user);
    enhancements.suggestedDuration = Math.round(task.estimatedDuration * adjustment);
    
    if (adjustment !== 1) {
      enhancements.insights.push({
        type: 'time_estimation',
        message: `Based on similar tasks, this might take ${enhancements.suggestedDuration} minutes instead of ${task.estimatedDuration} minutes`,
        confidence: 0.7
      });
    }
  }

  // Suggest optimal time to start
  const optimalTime = await suggestOptimalStartTime(task, user);
  if (optimalTime) {
    enhancements.suggestedStartTime = optimalTime;
    enhancements.nextActions.push(`Best time to start: ${optimalTime.toLocaleTimeString()}`);
  }

  return enhancements;
};

const parseNaturalLanguage = (input) => {
  const parsed = {
    extractedDate: null,
    extractedTime: null,
    extractedLocation: null,
    extractedPriority: null
  };

  const text = input.toLowerCase();

  // Priority extraction
  const priorityKeywords = {
    urgent: ['urgent', 'asap', 'critical', 'emergency'],
    high: ['important', 'high priority', 'crucial'],
    medium: ['normal', 'medium'],
    low: ['low priority', 'when possible', 'someday']
  };

  // Extract dates
  if (text.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    parsed.extractedDate = tomorrow;
  } else if (text.includes('today')) {
    parsed.extractedDate = new Date();
  }

  // Extract priority
  for (const [priority, keywords] of Object.entries(priorityKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      parsed.extractedPriority = priority;
      break;
    }
  }

  return parsed;
};

const calculateDurationAdjustment = async (task, user) => {
  try {
    const similarTasks = await Task.find({
      user: user._id,
      category: task.category,
      completed: true,
      estimatedDuration: { $exists: true },
      actualDuration: { $exists: true }
    }).limit(20);

    if (similarTasks.length < 3) return 1;

    const accuracyRatios = similarTasks.map(t => 
      t.actualDuration / t.estimatedDuration
    );

    const avgRatio = accuracyRatios.reduce((sum, ratio) => sum + ratio, 0) / accuracyRatios.length;
    
    return Math.max(0.5, Math.min(2.0, avgRatio));

  } catch (error) {
    console.error('Duration adjustment calculation error:', error);
    return 1;
  }
};

const suggestOptimalStartTime = async (task, user) => {
  try {
    const userPatterns = await getUserProductivityPatterns(user);
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const workingHours = user.workPreferences.workingHours[dayName];
    
    if (!workingHours || !workingHours.enabled) return null;
    
    const taskComplexity = calculateTaskComplexity(task);
    const optimalHours = getOptimalHoursForComplexity(taskComplexity, userPatterns);
    
    for (const hour of optimalHours) {
      const suggestedTime = new Date(today);
      suggestedTime.setHours(hour, 0, 0, 0);
      
      if (suggestedTime > now) {
        return suggestedTime;
      }
    }
    
    return null;

  } catch (error) {
    console.error('Optimal start time calculation error:', error);
    return null;
  }
};

const getUserProductivityPatterns = async (user) => {
  try {
    const completedTasks = await Task.find({
      user: user._id,
      completed: true,
      completedAt: { $exists: true }
    }).limit(100);

    const hourlyPatterns = {};
    
    completedTasks.forEach(task => {
      const hour = task.completedAt.getHours();
      if (!hourlyPatterns[hour]) {
        hourlyPatterns[hour] = { count: 0, efficiency: 0 };
      }
      
      hourlyPatterns[hour].count++;
      
      if (task.actualDuration && task.estimatedDuration) {
        const efficiency = task.estimatedDuration / task.actualDuration;
        hourlyPatterns[hour].efficiency += efficiency;
      }
    });

    Object.keys(hourlyPatterns).forEach(hour => {
      const pattern = hourlyPatterns[hour];
      pattern.avgEfficiency = pattern.efficiency / pattern.count;
    });

    return hourlyPatterns;

  } catch (error) {
    console.error('Productivity patterns calculation error:', error);
    return {};
  }
};

// ===================================================================
// CONTEXT AWARENESS SYSTEM
// ===================================================================

const getTasksForContext = async (userId, context) => {
  const query = {
    user: userId,
    completed: false
  };

  if (context.available_time) {
    query.estimatedDuration = { $lte: context.available_time * 1.2 };
  }

  if (context.location === 'home') {
    query.$or = [
      { 'context.location': 'home' },
      { 'context.location': { $exists: false } }
    ];
  }

  return await Task.find(query).populate('category tags').limit(20);
};

const calculateContextScore = (task, context, user) => {
  const scores = {
    time_fit: 0,
    energy_fit: 0,
    location_fit: 0,
    activity_fit: 0
  };

  // Time availability scoring
  const taskDuration = task.estimatedDuration || 30;
  if (taskDuration <= context.available_time) {
    scores.time_fit = 100;
  } else if (taskDuration <= context.available_time * 1.2) {
    scores.time_fit = 70;
  } else {
    scores.time_fit = 20;
  }

  // Energy level matching
  const taskComplexity = calculateTaskComplexity(task);
  if (context.energy_level === 'high' && taskComplexity >= 2) {
    scores.energy_fit = 90;
  } else if (context.energy_level === 'medium' && taskComplexity === 1) {
    scores.energy_fit = 85;
  } else if (context.energy_level === 'low' && taskComplexity === 0) {
    scores.energy_fit = 80;
  } else {
    scores.energy_fit = 40;
  }

  // Location matching
  if (task.context?.location === context.location) {
    scores.location_fit = 100;
  } else if (!task.context?.location) {
    scores.location_fit = 60;
  } else {
    scores.location_fit = 20;
  }

  // Activity type matching
  if (context.current_activity === 'focus_work' && taskComplexity >= 2) {
    scores.activity_fit = 90;
  } else if (context.current_activity === 'light_work' && taskComplexity <= 1) {
    scores.activity_fit = 85;
  } else {
    scores.activity_fit = 50;
  }

  const total = (scores.time_fit * 0.3 + scores.energy_fit * 0.4 + scores.location_fit * 0.2 + scores.activity_fit * 0.1);

  return {
    ...scores,
    total: Math.round(total),
    reasoning: generateContextReasoning(scores, context)
  };
};

const calculateTaskComplexity = (task) => {
  let complexity = 0;

  if (task.estimatedDuration > 120) complexity += 2;
  else if (task.estimatedDuration > 60) complexity += 1;

  if (task.description && task.description.length > 200) complexity += 1;
  if (task.subtasks && task.subtasks.length > 3) complexity += 1;
  if (task.dependencies && task.dependencies.length > 0) complexity += 1;

  return Math.min(complexity, 3);
};

const energyMatches = (energyLevel, taskComplexity) => {
  const matches = {
    'high': [2, 3],
    'medium': [1, 2],
    'low': [1]
  };
  
  return matches[energyLevel]?.includes(taskComplexity) || false;
};

const getOptimalHoursForComplexity = (complexity, userPatterns) => {
  let optimalHours = [9, 10, 11, 14, 15];

  if (Object.keys(userPatterns).length > 0) {
    const sortedHours = Object.entries(userPatterns)
      .sort(([,a], [,b]) => (b.avgEfficiency || 0) - (a.avgEfficiency || 0))
      .slice(0, 5)
      .map(([hour]) => parseInt(hour));
    
    if (sortedHours.length >= 3) {
      optimalHours = sortedHours;
    }
  }

  if (complexity >= 2) {
    return optimalHours.filter(hour => hour >= 8 && hour <= 12);
  }

  return optimalHours;
};

// ===================================================================
// INSIGHTS AND ANALYTICS GENERATION
// ===================================================================

const generateTaskInsights = (tasks, user, context) => {
  const insights = {
    primary_tip: "",
    task_distribution: {},
    energy_recommendations: {},
    time_optimization: {}
  };
  
  const highEnergyTasks = tasks.filter(t => t.estimatedDuration > 60).length;
  const lowEnergyTasks = tasks.filter(t => t.estimatedDuration <= 30).length;
  
  if (context.energy_level === 'high' && highEnergyTasks > 0) {
    insights.primary_tip = "Perfect time for your challenging tasks! Tackle those complex projects now.";
  } else if (context.energy_level === 'low' && lowEnergyTasks > 0) {
    insights.primary_tip = "Great time for quick wins! Knock out some smaller tasks to build momentum.";
  } else {
    insights.primary_tip = "Consider adjusting your task selection to match your current energy level.";
  }
  
  return insights;
};

const generateTaskListInsights = async (tasks, user) => {
  const insights = {
    overview: {
      total_tasks: tasks.length,
      urgent_tasks: tasks.filter(t => t.priority === 'urgent').length,
      overdue_tasks: tasks.filter(t => t.deadline && new Date(t.deadline) < new Date()).length
    },
    recommendations: [],
    productivity_tip: ""
  };

  if (insights.overview.urgent_tasks > 5) {
    insights.recommendations.push({
      type: 'workload',
      message: "You have many urgent tasks. Consider delegating or rescheduling some.",
      priority: 'high'
    });
  }

  if (insights.overview.overdue_tasks > 0) {
    insights.recommendations.push({
      type: 'deadline',
      message: `${insights.overview.overdue_tasks} task(s) are overdue. Address these first.`,
      priority: 'urgent'
    });
  }

  const timeOfDay = new Date().getHours();
  if (timeOfDay < 12) {
    insights.productivity_tip = "Morning energy is perfect for tackling your most challenging tasks!";
  } else if (timeOfDay < 17) {
    insights.productivity_tip = "Afternoon focus time - great for detailed work and reviews.";
  } else {
    insights.productivity_tip = "Evening wind-down - perfect for planning tomorrow and quick admin tasks.";
  }

  return insights;
};

const generateSingleTaskInsights = async (task, user) => {
  const insights = {
    suggestions: [],
    optimization_tips: [],
    completion_forecast: null
  };

  if (task.estimatedDuration) {
    const adjustment = await calculateDurationAdjustment(task, user);
    
    if (adjustment !== 1) {
      insights.suggestions.push({
        type: 'time_estimation',
        message: `Based on similar tasks, this might take ${Math.round(task.estimatedDuration * adjustment)} minutes instead of ${task.estimatedDuration} minutes`,
        confidence: 0.7
      });
    }
  }

  const optimalTime = await getOptimalTimeForTask(task, user);
  if (optimalTime) {
    insights.optimization_tips.push({
      type: 'timing',
      message: `Best time to work on this: ${optimalTime}`,
      reason: "Based on your productivity patterns"
    });
  }

  return insights;
};

const generateOptimizedSchedule = async (tasks, user, options) => {
  // Basic schedule optimization
  return {
    scheduled_tasks: tasks.map((task, index) => ({
      task_id: task._id,
      suggested_start: new Date(Date.now() + index * 60 * 60 * 1000),
      suggested_duration: task.estimatedDuration || 60,
      scheduling_score: 80
    })),
    total_estimated_time: tasks.reduce((sum, task) => sum + (task.estimatedDuration || 60), 0),
    productivity_forecast: 85,
    potential_issues: [],
    optimization_score: 92
  };
};

const analyzeTaskPatterns = async (tasks, user) => {
  const analysis = {
    patterns: {},
    metrics: {},
    trends: {},
    improvement_areas: [],
    achievements: []
  };

  const completedTasks = tasks.filter(t => t.completed);
  const totalTasks = tasks.length;

  analysis.metrics = {
    completion_rate: totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0,
    avg_task_duration: calculateAverageTaskDuration(completedTasks),
    estimation_accuracy: calculateEstimationAccuracy(completedTasks),
    productivity_score: await user.getProductivityScore()
  };

  analysis.patterns = {
    peak_productivity_hours: findPeakProductivityHours(completedTasks),
    preferred_task_types: findPreferredTaskTypes(completedTasks),
    completion_time_patterns: analyzeCompletionTimes(completedTasks)
  };

  analysis.trends = {
    overall_trend: calculateProductivityTrend(completedTasks),
    completion_rate_trend: 'improving',
    efficiency_trend: 'stable'
  };

  if (analysis.metrics.completion_rate < 70) {
    analysis.improvement_areas.push({
      area: 'Task Completion',
      suggestion: 'Consider breaking large tasks into smaller, manageable pieces',
      impact: 'high'
    });
  }

  if (analysis.metrics.estimation_accuracy < 0.7) {
    analysis.improvement_areas.push({
      area: 'Time Estimation',
      suggestion: 'Track actual time spent on tasks to improve estimation accuracy',
      impact: 'medium'
    });
  }

  return analysis;
};

// ===================================================================
// COMPLETION AND LEARNING SYSTEM
// ===================================================================

const generateCompletionInsights = async (task, user, completionData = {}) => {
  const insights = {
    congratulation_message: "You're on fire! 🔥",
    productivity_impact: "High",
    time_accuracy: "Good estimation!",
    learning_notes: "Task completed efficiently"
  };

  // Analyze time accuracy
  if (task.estimatedDuration && task.actualDuration) {
    const accuracy = 1 - Math.abs(task.actualDuration - task.estimatedDuration) / task.estimatedDuration;
    
    if (accuracy >= 0.9) {
      insights.time_accuracy = "Perfect timing! You nailed the estimate! 🎯";
    } else if (accuracy >= 0.7) {
      insights.time_accuracy = "Good estimation! Close to your prediction.";
    } else {
      insights.time_accuracy = "Learning opportunity - track time to improve estimates.";
    }
  }

  // Generate congratulation message based on task complexity
  const complexity = calculateTaskComplexity(task);
  const congratulations = [
    "Task conquered! 🏆",
    "Another win! Keep it up! 🚀",
    "Productivity ninja in action! ⭐",
    "You're crushing it today! 💪"
  ];
  
  insights.congratulation_message = congratulations[Math.floor(Math.random() * congratulations.length)];

  return insights;
};

const updateUserMetrics = async (user, task, timeSpent) => {
  user.analytics.metrics.totalTasksCompleted += 1;
  user.analytics.metrics.totalTimeTracked += timeSpent || task.estimatedDuration || 30;
  user.activity.lastActiveDate = new Date();
  await user.save();
};

const learnFromTaskCompletion = async (task, user, completionData) => {
  console.log('Learning from task completion:', task._id);
  // AI learning implementation would go here
  // This would update user patterns and preferences based on completion data
};

const checkAchievements = async (user, task) => {
  const achievements = [];
  
  if (user.analytics.metrics.streakDays === 7) {
    achievements.push({
      name: "Week Warrior",
      description: "Completed tasks for 7 days straight!",
      type: "streak"
    });
  }
  
  if (user.analytics.metrics.totalTasksCompleted === 100) {
    achievements.push({
      name: "Century Club",
      description: "Completed 100 tasks!",
      type: "milestone"
    });
  }
  
  return achievements;
};

const getNextTaskSuggestion = async (user, completedTask) => {
  // Find next logical task based on completed task
  const relatedTasks = await Task.find({
    user: user._id,
    category: completedTask.category,
    completed: false
  }).limit(3);

  if (relatedTasks.length > 0) {
    return {
      message: "Keep the momentum going! 🚀",
      suggested_task: relatedTasks[0].title,
      reasoning: "Similar task type - perfect for maintaining flow state"
    };
  }

  return {
    message: "Ready for your next challenge?",
    suggested_task: null,
    reasoning: "Take a short break, then tackle your next priority!"
  };
};

const generateCelebrationMessage = (task, insights) => {
  const messages = [
    "🎉 Another one bites the dust!",
    "🚀 You're unstoppable today!",
    "⭐ Excellence in action!",
    "🏆 Task master at work!"
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
};

// ===================================================================
// CONTEXT TIPS AND RECOMMENDATIONS
// ===================================================================

const generateContextTips = (context, user, aiContext) => {
  const tips = [];

  if (context.energy_level === 'high') {
    tips.push({
      type: 'energy',
      message: 'Perfect time for challenging tasks! Consider tackling your most complex work now.',
      action: 'Focus on high-priority, demanding tasks'
    });
  } else if (context.energy_level === 'low') {
    tips.push({
      type: 'energy',
      message: 'Great time for quick wins. Small tasks can build momentum.',
      action: 'Choose tasks under 30 minutes'
    });
  }

  if (context.available_time < 30) {
    tips.push({
      type: 'time',
      message: 'Short time window detected. Perfect for administrative tasks or quick reviews.',
      action: 'Focus on tasks that can be completed quickly'
    });
  } else if (context.available_time >= 90) {
    tips.push({
      type: 'time',
      message: 'Extended focus time available! Ideal for deep work and complex projects.',
      action: 'Schedule your most important work now'
    });
  }

  if (context.location === 'home') {
    tips.push({
      type: 'location',
      message: 'Working from home? Great for creative work and tasks requiring deep focus.',
      action: 'Take advantage of fewer interruptions'
    });
  }

  return tips;
};

const getOptimalActivities = (context) => {
  const activities = [];
  
  if (context.energy_level === 'high') {
    activities.push('Complex problem-solving', 'Creative work', 'Strategic planning');
  } else if (context.energy_level === 'medium') {
    activities.push('Regular tasks', 'Communication', 'Review work');
  } else {
    activities.push('Administrative tasks', 'Email processing', 'Simple edits');
  }
  
  return activities;
};

const getActivitiesToAvoid = (context) => {
  const avoid = [];
  
  if (context.energy_level === 'low') {
    avoid.push('Complex decision-making', 'Creative brainstorming', 'Learning new skills');
  }
  
  if (context.noise_level === 'noisy') {
    avoid.push('Tasks requiring deep concentration', 'Phone calls', 'Recording');
  }
  
  return avoid;
};

const assessEnergyAlignment = (context, user) => {
  const currentHour = new Date().getHours();
  
  if (context.energy_level === 'high' && currentHour >= 9 && currentHour <= 11) {
    return 'Perfect alignment! This is your optimal productivity time.';
  } else if (context.energy_level === 'low' && currentHour > 15) {
    return 'Natural afternoon dip. Consider lighter tasks or a short break.';
  }
  
  return 'Good alignment with your current context.';
};

const predictProductivity = (context, user) => {
  let prediction = 70;
  
  if (context.energy_level === 'high') prediction += 20;
  if (context.available_time >= 90) prediction += 10;
  if (context.noise_level === 'quiet') prediction += 10;
  if (context.location === 'office') prediction += 5;
  
  return Math.min(prediction, 100);
};

// ===================================================================
// UTILITY HELPER FUNCTIONS
// ===================================================================

const generatePriorityReasoning = (factors) => {
  const reasons = [];
  
  if (factors.contextual_fit > 8) {
    reasons.push('Great fit for your current context');
  }
  if (factors.user_preference > 15) {
    reasons.push('Matches your strengths and preferences');
  }
  if (factors.deadline_urgency > 15) {
    reasons.push('Deadline approaching soon');
  }
  
  return reasons.length > 0 ? reasons.join(', ') : 'Standard priority calculation';
};

const calculateUrgencyScore = (task) => {
  let urgency = 0;
  
  if (task.deadline) {
    const hoursUntilDeadline = (new Date(task.deadline) - new Date()) / (1000 * 60 * 60);
    if (hoursUntilDeadline < 24) urgency += 40;
    else if (hoursUntilDeadline < 72) urgency += 25;
    else if (hoursUntilDeadline < 168) urgency += 10;
  }
  
  if (task.priority === 'urgent') urgency += 30;
  else if (task.priority === 'high') urgency += 20;
  
  if (task.dependents && task.dependents.length > 0) urgency += 15;
  
  return Math.min(urgency, 100);
};

const generateContextReasoning = (scores, context) => {
  const reasons = [];
  
  if (scores.time_fit >= 80) reasons.push('Perfect time fit');
  if (scores.energy_fit >= 80) reasons.push('Matches your energy level');
  if (scores.location_fit >= 80) reasons.push('Ideal for your location');
  
  return reasons.length > 0 ? reasons.join(', ') : 'Standard context match';
};

const getTimeRange = (period) => {
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case '24hours':
      start.setDate(start.getDate() - 1);
      break;
    case '7days':
      start.setDate(start.getDate() - 7);
      break;
    case '30days':
      start.setDate(start.getDate() - 30);
      break;
    case '90days':
      start.setDate(start.getDate() - 90);
      break;
    default:
      start.setDate(start.getDate() - 7);
  }
  
  return { start, end };
};

const generateActionItems = (insights) => {
  const actions = [];
  
  if (insights.productivity_insights.length > 0) {
    actions.push('Review your productivity patterns and optimize your schedule');
  }
  
  if (insights.improvement_areas && insights.improvement_areas.length > 0) {
    insights.improvement_areas.forEach(area => {
      actions.push(area.suggestion);
    });
  }
  
  actions.push('Continue tracking your progress for better AI suggestions');
  
  return actions.slice(0, 5);
};

const getNextReviewDate = (period) => {
  const next = new Date();
  
  switch (period) {
    case '24hours':
      next.setDate(next.getDate() + 1);
      break;
    case '7days':
      next.setDate(next.getDate() + 7);
      break;
    case '30days':
      next.setDate(next.getDate() + 30);
      break;
    default:
      next.setDate(next.getDate() + 7);
  }
  
  return next;
};

const getOptimalTimeForTask = async (task, user) => {
  const complexity = task.estimatedDuration > 60 ? 'high' : 'low';
  return complexity === 'high' ? 'Morning (9-11 AM)' : 'Afternoon (2-4 PM)';
};

const generateDuplicationImprovements = async (originalTask, user) => {
  return {
    suggested_duration: originalTask.actualDuration || originalTask.estimatedDuration,
    optimized_priority: originalTask.priority,
    enhancement_notes: "Improved based on original task performance"
  };
};

// Analytics helper functions
const calculateAverageTaskDuration = (tasks) => {
  const tasksWithDuration = tasks.filter(t => t.actualDuration || t.estimatedDuration);
  if (tasksWithDuration.length === 0) return 0;
  
  const totalDuration = tasksWithDuration.reduce((sum, task) => 
    sum + (task.actualDuration || task.estimatedDuration), 0
  );
  
  return Math.round(totalDuration / tasksWithDuration.length);
};

const calculateEstimationAccuracy = (tasks) => {
  const tasksWithBothDurations = tasks.filter(t => t.actualDuration && t.estimatedDuration);
  if (tasksWithBothDurations.length === 0) return 0;
  
  const accuracies = tasksWithBothDurations.map(task => {
    const ratio = Math.min(task.estimatedDuration, task.actualDuration) / 
                  Math.max(task.estimatedDuration, task.actualDuration);
    return ratio;
  });
  
  return accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
};

const findPeakProductivityHours = (tasks) => {
  const hourCounts = {};
  
  tasks.forEach(task => {
    if (task.completedAt) {
      const hour = task.completedAt.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });
  
  return Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));
};

const findPreferredTaskTypes = (tasks) => {
  const categories = {};
  
  tasks.forEach(task => {
    if (task.category) {
      const categoryName = task.category.name || task.category.toString();
      categories[categoryName] = (categories[categoryName] || 0) + 1;
    }
  });
  
  return Object.entries(categories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([category, count]) => ({ category, count }));
};

const analyzeCompletionTimes = (tasks) => {
  const timeSlots = {
    morning: 0,
    afternoon: 0,
    evening: 0
  };
  
  tasks.forEach(task => {
    if (task.completedAt) {
      const hour = task.completedAt.getHours();
      if (hour < 12) timeSlots.morning++;
      else if (hour < 18) timeSlots.afternoon++;
      else timeSlots.evening++;
    }
  });
  
  return timeSlots;
};

const calculateProductivityTrend = (tasks) => {
  const recent = tasks.filter(t => t.completedAt && 
    (new Date() - new Date(t.completedAt)) / (1000 * 60 * 60 * 24) <= 7
  );
  
  const older = tasks.filter(t => t.completedAt &&
    (new Date() - new Date(t.completedAt)) / (1000 * 60 * 60 * 24) > 7 &&
    (new Date() - new Date(t.completedAt)) / (1000 * 60 * 60 * 24) <= 14
  );
  
  if (recent.length > older.length) return 'improving';
  if (recent.length < older.length) return 'declining';
  return 'stable';
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
  calculateTaskComplexity,
  getOptimalHoursForComplexity,
  generateContextTips,
  analyzeTaskPatterns,
  generatePriorityReasoning,
  calculateUrgencyScore,
  getOptimalActivities,
  getActivitiesToAvoid,
  assessEnergyAlignment,
  predictProductivity,
  generateContextReasoning,
  getTimeRange,
  generateActionItems,
  getNextReviewDate,
  generateTaskListInsights,
  generateSingleTaskInsights,
  parseNaturalLanguage,
  calculateDurationAdjustment,
  suggestOptimalStartTime,
  getUserTaskAffinity,
  getUserProductivityPatterns,
  generateDuplicationImprovements,
  energyMatches
};