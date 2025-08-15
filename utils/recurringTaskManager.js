const calculateNextOccurrence = (task) => {
  if (!task.recurring || !task.recurring.isRecurring) return null;

  const { frequency, interval } = task.recurring;
  const next = new Date(task.dueDate);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + interval);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7 * interval);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + interval);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + interval);
      break;
  }

  return next;
};

module.exports = {
  calculateNextOccurrence
};
