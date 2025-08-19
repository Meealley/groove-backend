const moment = require('moment');

class SmartPrioritizer {
  static async calculatePriority(task, taskAnalytics, userPatterns = {}) {
    let score = 0;
    
    // Base priority weight
    const priorityWeights = { low: 20, medium: 40, high: 60 };
    score += priorityWeights[task.priority] || 40;
    
    // Deadline urgency
    if (task.deadline) {
      const hoursUntilDeadline = moment(task.deadline).diff(moment(), 'hours');
      if (hoursUntilDeadline < 12) score += 30;
      else if (hoursUntilDeadline < 48) score += 20;
      else if (hoursUntilDeadline < 168) score += 10;
    }
    
    // Due date proximity
    if (task.dueDate) {
      const hoursUntilDue = moment(task.dueDate).diff(moment(), 'hours');
      if (hoursUntilDue < 6) score += 25;
      else if (hoursUntilDue < 24) score += 15;
      else if (hoursUntilDue < 72) score += 8;
    }
    
    // Dependencies impact
    if (taskAnalytics && taskAnalytics.dependents && taskAnalytics.dependents.length > 0) {
      score += taskAnalytics.dependents.length * 8;
    }
    
    // Location-based boost
    if (task.reminders && task.reminders.length > 0) {
      const hasLocationReminder = task.reminders.some(reminder => 
        reminder.location && reminder.location.coordinates
      );
      if (hasLocationReminder) score += 10;
    }
    
    // User completion pattern analysis
    if (userPatterns.completionRate < 0.7) {
      score += task.priority === 'high' ? 15 : 0;
    }
    
    // Category-based adjustments
    if (taskAnalytics && taskAnalytics.category && userPatterns.completionTimes) {
      const avgTime = userPatterns.completionTimes.get(taskAnalytics.category);
      if (avgTime && avgTime > 120) score += 5;
    }
    
    return Math.min(Math.max(score, 0), 100);
  }
  
  static suggestSchedule(task, taskAnalytics, userPreferences = {}) {
    const now = moment();
    let suggestedTime = now.clone().add(1, 'hour');
    
    // Consider user's working hours
    if (userPreferences.workingHours) {
      const workStart = moment(userPreferences.workingHours.start, 'HH:mm');
      const workEnd = moment(userPreferences.workingHours.end, 'HH:mm');
      
      if (suggestedTime.isBefore(workStart)) {
        suggestedTime = workStart.clone();
      } else if (suggestedTime.isAfter(workEnd)) {
        suggestedTime = workStart.clone().add(1, 'day');
      }
    }
    
    // Consider user's productive hours
    if (userPreferences.productiveHours && userPreferences.productiveHours.length > 0) {
      const currentHour = suggestedTime.hour();
      const nextProductiveHour = userPreferences.productiveHours
        .find(hour => hour > currentHour);
      
      if (nextProductiveHour) {
        suggestedTime.hour(nextProductiveHour).minute(0).second(0);
      }
    }
    
    // Avoid scheduling on weekends for work-related tasks
    if (taskAnalytics && taskAnalytics.tags && taskAnalytics.tags.includes('work')) {
      if (suggestedTime.day() === 0) { // Sunday
        suggestedTime.add(1, 'day');
      } else if (suggestedTime.day() === 6) { // Saturday
        suggestedTime.add(2, 'days');
      }
    }
    
    return suggestedTime.toDate();
  }
  
  static async estimateDuration(task, taskAnalytics, userPatterns = {}) {
    let estimatedMinutes = 60; // default
    
    // Use user's historical data for similar tasks
    if (taskAnalytics && taskAnalytics.category && userPatterns.completionTimes) {
      const categoryAverage = userPatterns.completionTimes.get(taskAnalytics.category);
      if (categoryAverage) {
        estimatedMinutes = categoryAverage;
      }
    }
    
    // Adjust based on priority
    const priorityMultiplier = { low: 0.8, medium: 1.0, high: 1.3 };
    estimatedMinutes *= priorityMultiplier[task.priority] || 1.0;
    
    // Adjust based on description length
    if (task.description && task.description.length > 200) {
      estimatedMinutes *= 1.2;
    }
    
    // Consider subtasks
    if (taskAnalytics && taskAnalytics.subtasks && taskAnalytics.subtasks.length > 0) {
      estimatedMinutes += taskAnalytics.subtasks.length * 15;
    }
    
    return Math.round(estimatedMinutes);
  }
}

module.exports = SmartPrioritizer;



const calculatePriority = (priority, extractedEntities) => {
  let score = priority === "high" ? 90 : priority === "medium" ? 60 : 30;

  if (
    extractedEntities.urgencyKeywords &&
    extractedEntities.urgencyKeywords.length > 0
  ) {
    score += 10;
  }

  return Math.min(score, 100);
};

// Simple example for auto-priority assignment
const autoAssignPriority = (dueDate) => {
  if (!dueDate) return "low";

  const daysLeft = Math.ceil(
    (new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft <= 1) return "high";
  if (daysLeft <= 3) return "medium";
  return "low";
};

module.exports = {
  calculatePriority,
  autoAssignPriority,
};
