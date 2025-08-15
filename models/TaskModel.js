const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: [true, "Please add a title"],
    },
    description: {
      type: String,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    reminders: [
      {
        date: Date,
        location: {
          type: {
            type: String, // e.g. 'Point'
            enum: ["Point"],
            required: false,
          },
          coordinates: {
            type: [Number], // [longitude, latitude]
            required: false,
          },
        },
      },
    ],
    deadline: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },

    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ "reminders.location": "2dsphere" });

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
