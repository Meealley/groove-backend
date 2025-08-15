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
