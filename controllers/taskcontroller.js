const asyncHandler = require("express-async-handler");
const Task = require("../models/TaskModel");
const SmartPrioritizer = require("../utils/smartPrioritizer")
const RecurringTaskManager = require("../utils/recurringTaskManager")

// @desc    Get all tasks for logged-in user
// @route   GET /api/tasks
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ user: req.user.id });
  res.status(200).json(tasks);
});

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
  const { title, description, priority, reminders, dueDate, location } =
    req.body;

  if (!title) {
    res.status(400);
    throw new Error("Title is required");
  }

  const task = await Task.create({
    user: req.user.id,
    title,
    description,
    priority: priority || SmartPrioritizer.autoAssignPriority(dueDate),
    reminders: reminders || [],
    location,
  });

  res.status(201).json(task);
});

// const createTask = asyncHandler(async (req, res) => {
//   try {
//     const { title, description, priority, deadline, user } = req.body;

//     // Build reminders array manually
//     let reminders = [];

//     if (req.body.reminders) {
//       // If reminders is a single object
//       if (!Array.isArray(req.body.reminders)) {
//         req.body.reminders = [req.body.reminders];
//       }

//       reminders = req.body.reminders.map(reminder => {
//         let r = {};

//         if (reminder.date) {
//           r.date = new Date(reminder.date);
//         }

//         if (
//           reminder.location &&
//           Array.isArray(reminder.location.coordinates) &&
//           reminder.location.coordinates.length === 2
//         ) {
//           r.location = {
//             type: reminder.location.type || "Point",
//             coordinates: reminder.location.coordinates.map(Number),
//           };
//         }

//         return r;
//       });
//     }

//     const task = new Task({
//       user,
//       title,
//       description,
//       priority,
//       deadline: deadline ? new Date(deadline) : undefined,
//       reminders,
//     });

//     const savedTask = await task.save();
//     res.status(201).json(savedTask);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });


// const createTask = asyncHandler(async (req, res) => {
//   try {
//     console.log("Incoming body:", req.body);

//     const user = req.body.user; // make sure this is in Postman
//     if (!user) {
//       return res.status(400).json({ message: "User is required" });
//     }

//     const { title, description, priority, deadline } = req.body;

//     let reminders = [];
//     if (req.body.reminders) {
//       if (!Array.isArray(req.body.reminders)) {
//         req.body.reminders = [req.body.reminders];
//       }

//       reminders = req.body.reminders.map(reminder => {
//         let r = {};

//         if (reminder.date) {
//           r.date = new Date(reminder.date);
//         }

//         if (
//           reminder.location &&
//           Array.isArray(reminder.location.coordinates) &&
//           reminder.location.coordinates.length === 2
//         ) {
//           r.location = {
//             type: reminder.location.type || "Point",
//             coordinates: reminder.location.coordinates.map(Number),
//           };
//         }
//         return r;
//       });
//     }

//     const task = new Task({
//       user,
//       title,
//       description,
//       priority,
//       deadline: deadline ? new Date(deadline) : undefined,
//       reminders,
//     });

//     const savedTask = await task.save();
//     res.status(201).json(savedTask);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });



// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  // Make sure the logged-in user owns the task
  if (task.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error("User not authorized");
  }

  const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.status(200).json(updatedTask);
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  if (task.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error("User not authorized");
  }

  await task.deleteOne();

  res.status(200).json({ id: req.params.id });
});

// @desc    Get overdue tasks
// @route   GET /api/tasks/overdue
// @access  Private
const getOverdueTasks = asyncHandler(async (req, res) => {
  const now = new Date();

  const overdue = await Task.find({
    user: req.user.id,
    dueDate: { $lt: now },
    completed: false,
  });

  res.status(200).json(overdue);
});


// @desc  Reschedule a task
// @route PUT /api/tasks/:id/reschedule
// @access Private
const rescheduleTask = asyncHandler(async (req, res) => {
  const { deadline, reminders } = req.body;

  if (!deadline) {
    res.status(400);
    throw new Error('New deadline is required');
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Make sure the task belongs to the logged-in user
  if (task.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  task.deadline = deadline;

  // Optionally update reminders if provided
  if (reminders) {
    task.reminders = reminders;
  }

  const updatedTask = await task.save();
  res.status(200).json(updatedTask);
});

    
module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  rescheduleTask,
  getOverdueTasks,
};
