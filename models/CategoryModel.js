const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Please add a category name"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: "#007bff", // Default blue color
      match: [/^#[0-9A-F]{6}$/i, "Please enter a valid hex color"],
    },
    icon: {
      type: String,
      default: "folder", // Default icon name
    },
    // Category type for different contexts
    type: {
      type: String,
      enum: ["project", "area", "context", "custom"],
      default: "custom",
    },
    // For project categories
    projectDetails: {
      startDate: Date,
      endDate: Date,
      status: {
        type: String,
        enum: ["planning", "active", "on_hold", "completed", "cancelled"],
        default: "planning",
      },
      budget: Number,
      client: String,
    },
    // For area of responsibility categories
    areaDetails: {
      responsibility_level: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
      },
      review_frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "quarterly"],
        default: "weekly",
      },
    },
    // For context categories (location, time, tools needed)
    contextDetails: {
      location: String,
      tools_required: [String],
      time_of_day: {
        type: String,
        enum: ["morning", "afternoon", "evening", "anytime"],
        default: "anytime",
      },
      energy_level: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
      },
    },
    // Parent category for nested categories
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    // Order for displaying categories
    order: {
      type: Number,
      default: 0,
    },
    // Analytics
    taskCount: {
      type: Number,
      default: 0,
    },
    completedTaskCount: {
      type: Number,
      default: 0,
    },
    // Settings
    isActive: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    // Smart suggestions
    suggestedTags: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
    }],
    suggestedPriority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
    },
    // Default settings for tasks in this category
    defaultSettings: {
      priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium",
      },
      estimatedDuration: Number, // in minutes
      reminderOffset: Number, // minutes before due date
      allowRecurring: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
categorySchema.index({ user: 1, isActive: 1 });
categorySchema.index({ user: 1, type: 1 });
categorySchema.index({ user: 1, parent: 1 });
categorySchema.index({ user: 1, order: 1 });

// Ensure category name is unique per user
categorySchema.index({ user: 1, name: 1 }, { unique: true });

// Virtual for completion percentage
categorySchema.virtual('completionPercentage').get(function() {
  if (this.taskCount === 0) return 0;
  return Math.round((this.completedTaskCount / this.taskCount) * 100);
});

// Method to update task counts
categorySchema.methods.updateTaskCounts = async function() {
  const Task = mongoose.model('Task');
  
  const totalTasks = await Task.countDocuments({ category: this._id });
  const completedTasks = await Task.countDocuments({ 
    category: this._id, 
    completed: true 
  });
  
  this.taskCount = totalTasks;
  this.completedTaskCount = completedTasks;
  
  return this.save();
};

// Method to get subcategories
categorySchema.methods.getSubcategories = function() {
  return this.model('Category').find({ parent: this._id, isActive: true });
};

// Method to get all tasks in category (including subcategories)
categorySchema.methods.getAllTasks = async function(includeSubcategories = false) {
  const Task = mongoose.model('Task');
  
  if (!includeSubcategories) {
    return Task.find({ category: this._id });
  }
  
  // Get all subcategory IDs
  const subcategories = await this.model('Category').find({ 
    parent: this._id, 
    isActive: true 
  }).select('_id');
  
  const categoryIds = [this._id, ...subcategories.map(cat => cat._id)];
  
  return Task.find({ category: { $in: categoryIds } });
};

// Pre-save middleware
categorySchema.pre('save', function(next) {
  // Ensure archived categories are inactive
  if (this.isArchived) {
    this.isActive = false;
  }
  next();
});

// Post-save middleware to update task counts
categorySchema.post('save', function() {
  this.updateTaskCounts();
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;