const express = require("express");
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getOverdueTasks,
  rescheduleTask,
} = require("../controllers/taskcontroller");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes are protected
router
  .route("/")
  .get(protect, getTasks) // GET /api/tasks
  .post(protect, createTask); // POST /api/tasks

router
  .route("/:id")
  .put(protect, updateTask) // PUT /api/tasks/:id
  .delete(protect, deleteTask); // DELETE /api/tasks/:id

// New Overdue Tasks route
router.get("/overdue", protect, getOverdueTasks);

// New Reschedule Task route
router.put("/:id/reschedule", protect, rescheduleTask);

module.exports = router;
