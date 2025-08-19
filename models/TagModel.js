const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Please add a tag name"],
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: "#6c757d", // Default gray color
      match: [/^#[0-9A-F]{6}$/i, "Please enter a valid hex color"],
    },
    // Tag categories for organization
    category: {
      type: String,
      enum: [
        "context",
        "priority",
        "status",
        "project",
        "person",
        "tool",
        "energy",
        "time",
        "custom"
      ],
      default: "custom",
    },
    // For context-aware suggestions
    contextData: {
      // Location-based tags
      location: {
        coordinates: [Number], 
        name: String,
        radius: Number, // in meters
      },
      // Time-based tags
      timeContext: {
        preferred_times: [{
          start: String, // "09:00"
          end: String,   // "17:00"
          days: [Number] // 0-6 for Sunday-Saturday
        }],
        duration_hint: Number,
      },
      // Tool/resource requirements
      requirements: {
        tools: [String],
        internet_required: Boolean,
        collaboration_required: Boolean,
      },
    },
    // Usage analytics
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsed: Date,
    // Auto-suggestion settings
    autoSuggest: {
      enabled: {
        type: Boolean,
        default: true,
      },
      // Suggest this tag when these keywords are found in task title/description
      keywords: [String],
      // Suggest this tag for tasks in these categories
      categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      }],
      // Suggest this tag for tasks with these priorities
      priorities: [{
        type: String,
        enum: ["low", "medium", "high", "urgent"],
      }],
    },
    // Smart rules for automatic tag application
    smartRules: [{
      condition: {
        type: String,
        enum: ["title_contains", "description_contains", "category_is", "priority_is", "due_within", "location_near"],
      },
      value: String,
      active: {
        type: Boolean,
        default: true,
      },
    }],
    // Tag relationships
    relatedTags: [{
      tag: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
      relationship: {
        type: String,
        enum: ["similar", "opposite", "parent", "child"],
        default: "similar",
      },
      strength: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5,
      },
    }],
    // Settings
    isActive: {
      type: Boolean,
      default: true,
    },
    isSystem: {
      type: Boolean,
      default: false, // System tags cannot be deleted
    },
    // For tag hierarchy
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
tagSchema.index({ user: 1, name: 1 }, { unique: true });
tagSchema.index({ user: 1, category: 1 });
tagSchema.index({ user: 1, isActive: 1 });
tagSchema.index({ usageCount: -1 });
tagSchema.index({ lastUsed: -1 });

// Virtual for task count
tagSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'tags',
  count: true,
});

// Method to increment usage count
tagSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Method to get suggested tags based on task content
tagSchema.statics.getSuggestedTags = async function(userId, taskTitle, taskDescription, categoryId = null) {
  const suggestions = [];
  
  // Find tags with auto-suggest enabled
  const autoSuggestTags = await this.find({
    user: userId,
    isActive: true,
    'autoSuggest.enabled': true,
  });
  
  for (const tag of autoSuggestTags) {
    let score = 0;
    
    // Check keyword matches
    if (tag.autoSuggest.keywords && tag.autoSuggest.keywords.length > 0) {
      const content = `${taskTitle} ${taskDescription}`.toLowerCase();
      for (const keyword of tag.autoSuggest.keywords) {
        if (content.includes(keyword.toLowerCase())) {
          score += 0.5;
        }
      }
    }
    
    // Check category match
    if (categoryId && tag.autoSuggest.categories.includes(categoryId)) {
      score += 0.3;
    }
    
    // Check smart rules
    for (const rule of tag.smartRules) {
      if (!rule.active) continue;
      
      switch (rule.condition) {
        case 'title_contains':
          if (taskTitle.toLowerCase().includes(rule.value.toLowerCase())) {
            score += 0.4;
          }
          break;
        case 'description_contains':
          if (taskDescription.toLowerCase().includes(rule.value.toLowerCase())) {
            score += 0.3;
          }
          break;
      }
    }
    
    if (score > 0) {
      suggestions.push({
        tag: tag,
        score: Math.min(score, 1), // Cap at 1.0
      });
    }
  }
  
  // Sort by score and return top suggestions
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.tag);
};

// Method to get popular tags for user
tagSchema.statics.getPopularTags = function(userId, limit = 10) {
  return this.find({
    user: userId,
    isActive: true,
    usageCount: { $gt: 0 }
  })
  .sort({ usageCount: -1 })
  .limit(limit);
};

// Method to get recently used tags
tagSchema.statics.getRecentTags = function(userId, limit = 5) {
  return this.find({
    user: userId,
    isActive: true,
    lastUsed: { $exists: true }
  })
  .sort({ lastUsed: -1 })
  .limit(limit);
};

// Method to find related tags
tagSchema.methods.getRelatedTags = function(minStrength = 0.3) {
  return this.model('Tag').find({
    '_id': { $in: this.relatedTags
      .filter(rt => rt.strength >= minStrength)
      .map(rt => rt.tag) 
    },
    isActive: true
  });
};

// Pre-save middleware
tagSchema.pre('save', function(next) {
  // Auto-generate display name if not provided
  if (!this.displayName) {
    this.displayName = this.name.charAt(0).toUpperCase() + this.name.slice(1);
  }
  next();
});

const Tag = mongoose.model("Tag", tagSchema);

module.exports = Tag;