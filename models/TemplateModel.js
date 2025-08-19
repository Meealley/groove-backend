const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema(
  {
    // Template ownership and identification
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Template basic information
    name: {
      type: String,
      required: [true, "Please add a template name"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please add a template description"],
      trim: true,
    },
    // Template categorization
    type: {
      type: String,
      enum: [
        "task",
        "project", 
        "workflow",
        "checklist",
        "routine",
        "goal",
        "habit",
        "meeting",
        "event",
        "process"
      ],
      required: true,
    },
    category: {
      type: String,
      enum: [
        "personal",
        "work",
        "health",
        "education",
        "finance",
        "home",
        "travel",
        "event_planning",
        "software_development",
        "marketing",
        "sales",
        "hr",
        "management",
        "creative",
        "research",
        "maintenance",
        "custom"
      ],
      required: true,
    },
    subcategory: String,
    tags: [String],
    
    // Template content structure
    structure: {
      // Main template data
      templateData: {
        // Task template structure
        task: {
          title: String,
          description: String,
          priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
          },
          estimatedDuration: Number, // minutes
          category: String,
          tags: [String],
          subtasks: [{
            title: String,
            description: String,
            estimatedDuration: Number,
            required: { type: Boolean, default: true },
            order: Number,
          }],
          dependencies: [String], // References to other template items
          reminders: [{
            offset: Number, // minutes before due date
            type: String,
            message: String,
          }],
        },
        
        // Project template structure  
        project: {
          name: String,
          description: String,
          phases: [{
            name: String,
            description: String,
            estimatedDuration: Number, // days
            tasks: [String], // References to task templates
            milestones: [{
              name: String,
              description: String,
              deliverables: [String],
            }],
            order: Number,
          }],
          roles: [{
            name: String,
            description: String,
            responsibilities: [String],
            permissions: [String],
          }],
          resources: [{
            name: String,
            type: String,
            description: String,
            required: Boolean,
          }],
        },
        
        // Workflow template structure
        workflow: {
          name: String,
          description: String,
          steps: [{
            name: String,
            description: String,
            type: {
              type: String,
              enum: ["task", "decision", "review", "approval", "automation"],
            },
            assignee: String, // Role or specific user
            estimatedDuration: Number,
            conditions: [{
              field: String,
              operator: String,
              value: String,
            }],
            actions: [{
              type: String,
              parameters: Object,
            }],
            nextSteps: [String], // References to other steps
            order: Number,
          }],
          triggers: [{
            event: String,
            conditions: [Object],
            actions: [String],
          }],
        },
        
        // Checklist template structure
        checklist: {
          name: String,
          description: String,
          items: [{
            text: String,
            description: String,
            required: { type: Boolean, default: true },
            category: String,
            estimatedTime: Number, // minutes
            order: Number,
            subItems: [{
              text: String,
              required: Boolean,
              order: Number,
            }],
          }],
          completion: {
            requireAll: { type: Boolean, default: true },
            minimumRequired: Number,
          },
        },
      },
      
      // Variable placeholders
      variables: [{
        name: String,
        type: {
          type: String,
          enum: ["text", "number", "date", "boolean", "select", "multiselect"],
        },
        label: String,
        description: String,
        required: { type: Boolean, default: false },
        defaultValue: String,
        options: [String], // For select types
        validation: {
          min: Number,
          max: Number,
          pattern: String,
        },
        placeholder: String,
      }],
      
      // Dynamic rules for template generation
      rules: [{
        condition: String, // JavaScript expression
        action: {
          type: String,
          enum: ["show", "hide", "require", "modify", "add", "remove"],
        },
        target: String, // Path to template element
        parameters: Object,
      }],
    },
    
    // Template metadata and settings
    settings: {
      // Visibility and sharing
      visibility: {
        type: String,
        enum: ["private", "team", "organization", "public"],
        default: "private",
      },
      
      // Usage permissions
      permissions: {
        view: [String], // User IDs or roles
        use: [String],
        edit: [String],
        admin: [String],
      },
      
      // Template configuration
      configuration: {
        allowCustomization: { type: Boolean, default: true },
        requireApproval: { type: Boolean, default: false },
        versionControl: { type: Boolean, default: true },
        autoUpdate: { type: Boolean, default: false },
      },
      
      // Generation settings
      generation: {
        preserveStructure: { type: Boolean, default: true },
        inheritCategories: { type: Boolean, default: true },
        inheritTags: { type: Boolean, default: true },
        inheritReminders: { type: Boolean, default: true },
        applyUserPreferences: { type: Boolean, default: true },
      },
    },
    
    // Usage tracking and analytics
    usage: {
      // Basic metrics
      metrics: {
        totalUses: { type: Number, default: 0 },
        uniqueUsers: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        totalRatings: { type: Number, default: 0 },
        completionRate: { type: Number, default: 0 },
        lastUsed: Date,
        trending: { type: Boolean, default: false },
      },
      
      // Detailed usage history
      history: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        usedAt: Date,
        customizations: Object,
        outcome: {
          type: String,
          enum: ["completed", "abandoned", "modified", "pending"],
        },
        rating: Number,
        feedback: String,
        timeToComplete: Number, // minutes
      }],
      
      // Usage patterns
      patterns: {
        popularCustomizations: [Object],
        commonModifications: [String],
        successFactors: [String],
        failureReasons: [String],
        peakUsageTimes: [String],
        userSegments: [{
          segment: String,
          usageCount: Number,
          successRate: Number,
        }],
      },
    },
    
    // Version control and history
    versioning: {
      version: {
        type: String,
        default: "1.0.0",
      },
      
      // Version history
      history: [{
        version: String,
        changes: [String],
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        changedAt: Date,
        changeReason: String,
        templateData: Object, // Snapshot of template at this version
      }],
      
      // Branching for different versions
      branches: [{
        name: String,
        description: String,
        basedOn: String, // Version this branch is based on
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: Date,
        status: {
          type: String,
          enum: ["active", "merged", "archived"],
          default: "active",
        },
      }],
    },
    
    // Quality and validation
    quality: {
      // Validation rules
      validation: {
        rules: [{
          field: String,
          rule: String,
          message: String,
          severity: {
            type: String,
            enum: ["error", "warning", "info"],
          },
        }],
        lastValidated: Date,
        validationScore: Number, // 0-100
        issues: [{
          type: String,
          message: String,
          severity: String,
          resolved: Boolean,
        }],
      },
      
      // Quality metrics
      metrics: {
        completeness: Number, // 0-100
        clarity: Number, // 0-100
        usability: Number, // 0-100
        maintainability: Number, // 0-100
        reliability: Number, // 0-100
        overallScore: Number, // 0-100
      },
      
      // Review and approval
      review: {
        status: {
          type: String,
          enum: ["pending", "approved", "rejected", "needs_revision"],
          default: "pending",
        },
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reviewedAt: Date,
        comments: String,
        approvalRequired: Boolean,
      },
    },
    
    // AI and smart features
    smartFeatures: {
      // AI-generated improvements
      suggestions: [{
        type: {
          type: String,
          enum: [
            "structure_improvement",
            "variable_addition",
            "rule_optimization",
            "content_enhancement",
            "performance_optimization"
          ],
        },
        suggestion: String,
        reasoning: String,
        confidence: Number, // 0-1
        impact: {
          type: String,
          enum: ["low", "medium", "high"],
        },
        implemented: { type: Boolean, default: false },
        createdAt: Date,
      }],
      
      // Auto-optimization
      optimization: {
        enabled: { type: Boolean, default: false },
        lastOptimized: Date,
        optimizations: [{
          type: String,
          description: String,
          impact: String,
          appliedAt: Date,
        }],
      },
      
      // Learning from usage
      learning: {
        patterns: [Object],
        insights: [String],
        recommendations: [String],
        adaptations: [{
          change: String,
          reason: String,
          success: Boolean,
          appliedAt: Date,
        }],
      },
    },
    
    // Integration and compatibility
    integration: {
      // Compatible tools and platforms
      compatibility: [{
        platform: String,
        version: String,
        supported: Boolean,
        features: [String],
      }],
      
      // Import/export formats
      formats: {
        import: [String], // Supported import formats
        export: [String], // Supported export formats
      },
      
      // API integration
      api: {
        endpoints: [{
          method: String,
          path: String,
          description: String,
          parameters: [Object],
        }],
        webhooks: [{
          event: String,
          url: String,
          active: Boolean,
        }],
      },
    },
    
    // Marketplace and distribution
    marketplace: {
      // Publishing information
      publishing: {
        published: { type: Boolean, default: false },
        publishedAt: Date,
        featured: { type: Boolean, default: false },
        price: {
          type: Number,
          default: 0, // 0 for free templates
        },
        currency: {
          type: String,
          default: "USD",
        },
        license: {
          type: String,
          enum: ["free", "personal", "commercial", "enterprise"],
          default: "free",
        },
      },
      
      // Marketing information
      marketing: {
        title: String,
        shortDescription: String,
        keywords: [String],
        screenshots: [String],
        demoUrl: String,
        videoUrl: String,
        documentation: String,
      },
      
      // Sales and revenue
      sales: {
        totalSales: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },
        refunds: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        reviews: [{
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          rating: Number,
          review: String,
          createdAt: Date,
          helpful: { type: Number, default: 0 },
        }],
      },
    },
    
    // Status and lifecycle
    status: {
      type: String,
      enum: [
        "draft",
        "testing", 
        "active",
        "deprecated",
        "archived",
        "deleted"
      ],
      default: "draft",
    },
    
    // Metadata
    metadata: {
      difficulty: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
        default: "intermediate",
      },
      timeToComplete: {
        min: Number, // minutes
        max: Number,
        average: Number,
      },
      prerequisites: [String],
      outcomes: [String],
      industries: [String],
      teamSize: {
        min: Number,
        max: Number,
        recommended: Number,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
templateSchema.index({ createdBy: 1, type: 1 });
templateSchema.index({ category: 1, subcategory: 1 });
templateSchema.index({ "settings.visibility": 1 });
templateSchema.index({ "usage.metrics.totalUses": -1 });
templateSchema.index({ "usage.metrics.averageRating": -1 });
templateSchema.index({ "marketplace.publishing.published": 1, "marketplace.publishing.featured": -1 });
templateSchema.index({ tags: 1 });
templateSchema.index({ status: 1 });

// Method to generate content from template
templateSchema.methods.generateContent = async function(variables = {}, userId = null) {
  const generatedContent = JSON.parse(JSON.stringify(this.structure.templateData));
  
  // Replace variables in the template
  const processedContent = this.replaceVariables(generatedContent, variables);
  
  // Apply rules
  const finalContent = this.applyRules(processedContent, variables);
  
  // Track usage
  if (userId) {
    await this.trackUsage(userId, variables);
  }
  
  return finalContent;
};

// Helper method to replace variables
templateSchema.methods.replaceVariables = function(content, variables) {
  const processValue = (value) => {
    if (typeof value === 'string') {
      // Replace variable placeholders like {{variableName}}
      return value.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        return variables[varName] || match;
      });
    } else if (Array.isArray(value)) {
      return value.map(processValue);
    } else if (typeof value === 'object' && value !== null) {
      const processed = {};
      for (const [key, val] of Object.entries(value)) {
        processed[key] = processValue(val);
      }
      return processed;
    }
    return value;
  };
  
  return processValue(content);
};

// Helper method to apply rules
templateSchema.methods.applyRules = function(content, variables) {
  let modifiedContent = JSON.parse(JSON.stringify(content));
  
  for (const rule of this.structure.rules) {
    try {
      // Evaluate condition (in production, use a safe expression evaluator)
      const conditionResult = this.evaluateCondition(rule.condition, variables);
      
      if (conditionResult) {
        modifiedContent = this.applyRuleAction(
          modifiedContent, 
          rule.action, 
          rule.target, 
          rule.parameters
        );
      }
    } catch (error) {
      console.error('Error applying rule:', error);
    }
  }
  
  return modifiedContent;
};

// Helper method to evaluate conditions safely
templateSchema.methods.evaluateCondition = function(condition, variables) {
  // In production, use a proper expression evaluator that's safe
  // This is a simplified example
  try {
    const variableValues = Object.entries(variables)
      .map(([key, value]) => `const ${key} = ${JSON.stringify(value)};`)
      .join('');
    
    const evaluationCode = `${variableValues} return (${condition});`;
    const func = new Function(evaluationCode);
    return func();
  } catch (error) {
    return false;
  }
};

// Helper method to apply rule actions
templateSchema.methods.applyRuleAction = function(content, actionType, target, parameters) {
  // This would contain logic to modify content based on rule actions
  // Implementation depends on the specific action types and target paths
  
  switch (actionType) {
    case 'show':
      // Logic to show/unhide elements
      break;
    case 'hide':
      // Logic to hide elements
      break;
    case 'modify':
      // Logic to modify element properties
      break;
    case 'add':
      // Logic to add new elements
      break;
    case 'remove':
      // Logic to remove elements
      break;
  }
  
  return content;
};

// Method to track usage
templateSchema.methods.trackUsage = async function(userId, customizations = {}) {
  // Update metrics
  this.usage.metrics.totalUses++;
  this.usage.metrics.lastUsed = new Date();
  
  // Add to usage history
  this.usage.history.push({
    user: userId,
    usedAt: new Date(),
    customizations: customizations,
    outcome: 'pending',
  });
  
  // Keep only last 1000 usage records
  if (this.usage.history.length > 1000) {
    this.usage.history = this.usage.history.slice(-1000);
  }
  
  // Update unique users count
  const uniqueUsers = new Set(this.usage.history.map(h => h.user.toString()));
  this.usage.metrics.uniqueUsers = uniqueUsers.size;
  
  await this.save();
};

// Method to add rating
templateSchema.methods.addRating = async function(userId, rating, feedback = '') {
  // Find existing usage record
  const usageRecord = this.usage.history.find(h => 
    h.user.toString() === userId.toString() && !h.rating
  );
  
  if (usageRecord) {
    usageRecord.rating = rating;
    usageRecord.feedback = feedback;
  }
  
  // Recalculate average rating
  const ratings = this.usage.history.filter(h => h.rating).map(h => h.rating);
  if (ratings.length > 0) {
    this.usage.metrics.averageRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    this.usage.metrics.totalRatings = ratings.length;
  }
  
  await this.save();
};

// Method to validate template structure
templateSchema.methods.validate = function() {
  const issues = [];
  
  // Check required fields
  if (!this.name || this.name.trim().length === 0) {
    issues.push({
      type: 'missing_field',
      message: 'Template name is required',
      severity: 'error',
    });
  }
  
  if (!this.description || this.description.trim().length < 10) {
    issues.push({
      type: 'insufficient_description',
      message: 'Description should be at least 10 characters',
      severity: 'warning',
    });
  }
  
  // Validate template structure based on type
  switch (this.type) {
    case 'task':
      if (!this.structure.templateData.task.title) {
        issues.push({
          type: 'missing_task_title',
          message: 'Task template must have a title',
          severity: 'error',
        });
      }
      break;
      
    case 'project':
      if (!this.structure.templateData.project.phases || 
          this.structure.templateData.project.phases.length === 0) {
        issues.push({
          type: 'missing_project_phases',
          message: 'Project template must have at least one phase',
          severity: 'error',
        });
      }
      break;
  }
  
  // Update quality metrics
  this.quality.validation.issues = issues;
  this.quality.validation.lastValidated = new Date();
  
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  
  this.quality.validation.validationScore = Math.max(0, 100 - (errorCount * 20) - (warningCount * 5));
  
  return issues;
};

// Method to create new version
templateSchema.methods.createVersion = async function(changes, changedBy, reason = '') {
  const currentVersion = this.versioning.version;
  const versionParts = currentVersion.split('.').map(Number);
  
  // Increment patch version
  versionParts[2]++;
  const newVersion = versionParts.join('.');
  
  // Save current state to history
  this.versioning.history.push({
    version: currentVersion,
    changes: changes,
    changedBy: changedBy,
    changedAt: new Date(),
    changeReason: reason,
    templateData: JSON.parse(JSON.stringify(this.structure.templateData)),
  });
  
  // Update version
  this.versioning.version = newVersion;
  
  return this.save();
};

// Method to clone template
templateSchema.methods.clone = async function(newName, userId) {
  const clonedData = this.toObject();
  
  // Remove fields that shouldn't be cloned
  delete clonedData._id;
  delete clonedData.createdAt;
  delete clonedData.updatedAt;
  
  // Update basic information
  clonedData.name = newName;
  clonedData.createdBy = userId;
  clonedData.status = 'draft';
  
  // Reset usage metrics
  clonedData.usage = {
    metrics: {
      totalUses: 0,
      uniqueUsers: 0,
      averageRating: 0,
      totalRatings: 0,
      completionRate: 0,
      trending: false,
    },
    history: [],
    patterns: {},
  };
  
  // Reset versioning
  clonedData.versioning = {
    version: '1.0.0',
    history: [],
    branches: [],
  };
  
  // Create new template
  const ClonedTemplate = this.model('Template');
  return new ClonedTemplate(clonedData).save();
};

// Static method to find popular templates
templateSchema.statics.findPopular = function(category = null, limit = 10) {
  const query = {
    status: 'active',
    'settings.visibility': { $in: ['public', 'organization'] },
  };
  
  if (category) {
    query.category = category;
  }
  
  return this.find(query)
    .sort({ 
      'usage.metrics.trending': -1,
      'usage.metrics.averageRating': -1,
      'usage.metrics.totalUses': -1 
    })
    .limit(limit);
};

// Static method to search templates
templateSchema.statics.search = function(searchQuery, filters = {}) {
  const query = {
    status: 'active',
    'settings.visibility': { $in: ['public', 'organization'] },
  };
  
  // Text search
  if (searchQuery) {
    query.$or = [
      { name: { $regex: searchQuery, $options: 'i' } },
      { description: { $regex: searchQuery, $options: 'i' } },
      { tags: { $in: [new RegExp(searchQuery, 'i')] } },
    ];
  }
  
  // Apply filters
  if (filters.category) query.category = filters.category;
  if (filters.type) query.type = filters.type;
  if (filters.difficulty) query['metadata.difficulty'] = filters.difficulty;
  if (filters.minRating) query['usage.metrics.averageRating'] = { $gte: filters.minRating };
  
  return this.find(query).sort({ 'usage.metrics.averageRating': -1 });
};

// Method to get usage analytics
templateSchema.methods.getAnalytics = function(period = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  
  const recentUsage = this.usage.history.filter(h => h.usedAt >= startDate);
  
  return {
    totalUses: this.usage.metrics.totalUses,
    recentUses: recentUsage.length,
    uniqueUsers: this.usage.metrics.uniqueUsers,
    averageRating: this.usage.metrics.averageRating,
    completionRate: this.usage.metrics.completionRate,
    trendingScore: this.calculateTrendingScore(),
    popularCustomizations: this.usage.patterns.popularCustomizations || [],
    userSegments: this.usage.patterns.userSegments || [],
  };
};

// Helper method to calculate trending score
templateSchema.methods.calculateTrendingScore = function() {
  const recentUses = this.usage.history.filter(h => 
    h.usedAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
  ).length;
  
  const score = (recentUses * 0.4) + 
                (this.usage.metrics.averageRating * 0.3) + 
                (this.usage.metrics.totalUses / 100 * 0.3);
  
  return Math.min(100, score);
};

const Template = mongoose.model("Template", templateSchema);

module.exports = Template;