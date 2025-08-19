const mongoose = require("mongoose");

const workflowSchema = new mongoose.Schema(
  {
    // Workflow identification
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    
    // Workflow ownership
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    
    // Workflow categorization
    category: {
      type: String,
      enum: [
        "task_automation",
        "project_management",
        "approval_process",
        "notification_system",
        "data_sync",
        "report_generation",
        "user_onboarding",
        "compliance",
        "quality_assurance",
        "custom"
      ],
      default: "custom",
    },
    
    tags: [String],
    
    // Workflow configuration
    configuration: {
      // Workflow type
      type: {
        type: String,
        enum: ["sequential", "parallel", "conditional", "loop", "state_machine"],
        default: "sequential",
      },
      
      // Execution settings
      execution: {
        // Auto-start conditions
        autoStart: {
          type: Boolean,
          default: false,
        },
        
        // Retry configuration
        retry: {
          enabled: {
            type: Boolean,
            default: true,
          },
          maxAttempts: {
            type: Number,
            default: 3,
          },
          backoffStrategy: {
            type: String,
            enum: ["fixed", "exponential", "linear"],
            default: "exponential",
          },
          initialDelay: {
            type: Number,
            default: 1000, // milliseconds
          },
          maxDelay: {
            type: Number,
            default: 300000, // 5 minutes
          },
        },
        
        // Timeout settings
        timeout: {
          enabled: {
            type: Boolean,
            default: false,
          },
          duration: {
            type: Number,
            default: 3600000, // 1 hour in milliseconds
          },
          action: {
            type: String,
            enum: ["fail", "continue", "retry"],
            default: "fail",
          },
        },
        
        // Concurrency limits
        concurrency: {
          maxConcurrent: {
            type: Number,
            default: 1,
          },
          queueing: {
            type: String,
            enum: ["fifo", "lifo", "priority"],
            default: "fifo",
          },
        },
      },
      
      // Input/Output schema
      schema: {
        input: {
          type: Object,
          default: {},
        }, // JSON Schema for input validation
        output: {
          type: Object,
          default: {},
        }, // JSON Schema for output validation
      },
      
      // Environment variables
      environment: [{
        key: String,
        value: String,
        encrypted: {
          type: Boolean,
          default: false,
        },
        description: String,
      }],
    },
    
    // Workflow triggers
    triggers: [{
      // Trigger identification
      id: {
        type: String,
        required: true,
      },
      name: String,
      description: String,
      
      // Trigger type
      type: {
        type: String,
        enum: [
          "manual",           // Manual execution
          "scheduled",        // Time-based trigger
          "event",           // Event-based trigger
          "webhook",         // HTTP webhook
          "entity_change",   // Database change
          "email",           // Email trigger
          "api_call",        // API endpoint
          "file_upload",     // File upload trigger
          "integration"      // External integration trigger
        ],
        required: true,
      },
      
      // Trigger configuration
      config: {
        // Scheduled trigger config
        schedule: {
          enabled: {
            type: Boolean,
            default: false,
          },
          cron: String,        // Cron expression
          timezone: String,    // Timezone for cron
          startDate: Date,     // When to start
          endDate: Date,       // When to stop
          maxRuns: Number,     // Maximum executions
        },
        
        // Event trigger config
        event: {
          eventType: String,   // Type of event to listen for
          entityType: String,  // Entity type to monitor
          conditions: [{
            field: String,
            operator: {
              type: String,
              enum: ["equals", "not_equals", "contains", "greater_than", "less_than", "exists"],
            },
            value: mongoose.Schema.Types.Mixed,
          }],
          debounce: {
            type: Number,
            default: 0,
          }, // Milliseconds to wait before triggering
        },
        
        // Webhook trigger config
        webhook: {
          path: String,        // Webhook path
          method: {
            type: String,
            enum: ["GET", "POST", "PUT", "DELETE"],
            default: "POST",
          },
          authentication: {
            type: {
              type: String,
              enum: ["none", "basic", "bearer", "api_key", "signature"],
              default: "none",
            },
            credentials: Object,
          },
          headers: [{
            name: String,
            value: String,
            required: Boolean,
          }],
        },
        
        // Entity change trigger config
        entityChange: {
          entityType: {
            type: String,
            enum: ["task", "project", "goal", "user", "team", "comment"],
          },
          operations: [{
            type: String,
            enum: ["create", "update", "delete"],
          }],
          conditions: [{
            field: String,
            operator: String,
            value: mongoose.Schema.Types.Mixed,
          }],
        },
      },
      
      // Trigger status
      enabled: {
        type: Boolean,
        default: true,
      },
      
      // Trigger statistics
      stats: {
        totalTriggers: {
          type: Number,
          default: 0,
        },
        successfulTriggers: {
          type: Number,
          default: 0,
        },
        failedTriggers: {
          type: Number,
          default: 0,
        },
        lastTriggered: Date,
        averageExecutionTime: Number,
      },
    }],
    
    // Workflow steps/actions
    steps: [{
      // Step identification
      id: {
        type: String,
        required: true,
      },
      name: String,
      description: String,
      
      // Step type
      type: {
        type: String,
        enum: [
          "action",           // Execute an action
          "condition",        // Conditional logic
          "loop",            // Loop/iteration
          "parallel",        // Parallel execution
          "wait",            // Wait/delay
          "human_task",      // Human approval/input
          "sub_workflow",    // Call another workflow
          "integration",     // External service call
          "notification",    // Send notification
          "data_transform"   // Transform data
        ],
        required: true,
      },
      
      // Step configuration
      config: {
        // Action configuration
        action: {
          actionType: String,  // Type of action to perform
          parameters: Object,  // Action parameters
          timeout: Number,     // Action timeout
          retryOnFailure: Boolean,
        },
        
        // Condition configuration
        condition: {
          expression: String,  // JavaScript expression
          trueStep: String,    // Step to execute if true
          falseStep: String,   // Step to execute if false
        },
        
        // Loop configuration
        loop: {
          type: {
            type: String,
            enum: ["for", "while", "forEach"],
          },
          condition: String,   // Loop condition
          maxIterations: Number,
          collection: String,  // For forEach loops
        },
        
        // Parallel configuration
        parallel: {
          branches: [{
            name: String,
            steps: [String],   // Step IDs to execute in parallel
          }],
          waitForAll: {
            type: Boolean,
            default: true,
          },
        },
        
        // Wait configuration
        wait: {
          duration: Number,    // Milliseconds to wait
          until: String,       // Wait until condition
          timeout: Number,     // Maximum wait time
        },
        
        // Human task configuration
        humanTask: {
          assignees: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          }],
          title: String,
          instructions: String,
          formSchema: Object,  // Form schema for input
          dueDate: Date,
          escalation: {
            enabled: Boolean,
            delay: Number,     // Minutes before escalation
            escalateTo: [{
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            }],
          },
        },
        
        // Integration configuration
        integration: {
          service: String,     // Integration service name
          operation: String,   // Operation to perform
          parameters: Object,  // Operation parameters
          mapping: {
            input: Object,     // Input field mapping
            output: Object,    // Output field mapping
          },
        },
        
        // Notification configuration
        notification: {
          type: {
            type: String,
            enum: ["email", "push", "slack", "teams", "webhook"],
          },
          recipients: [{
            type: {
              type: String,
              enum: ["user", "team", "role", "email"],
            },
            value: String,
          }],
          template: String,
          variables: Object,
        },
      },
      
      // Step execution order
      order: {
        type: Number,
        required: true,
      },
      
      // Step dependencies
      dependencies: [String], // Step IDs this step depends on
      
      // Next steps
      nextSteps: [{
        stepId: String,
        condition: String,     // Optional condition for conditional flow
      }],
      
      // Error handling
      errorHandling: {
        onError: {
          type: String,
          enum: ["stop", "continue", "retry", "skip", "escalate"],
          default: "stop",
        },
        errorStep: String,     // Step to execute on error
        maxRetries: Number,
        retryDelay: Number,
      },
      
      // Step execution tracking
      execution: {
        enabled: {
          type: Boolean,
          default: true,
        },
        stats: {
          totalExecutions: {
            type: Number,
            default: 0,
          },
          successfulExecutions: {
            type: Number,
            default: 0,
          },
          failedExecutions: {
            type: Number,
            default: 0,
          },
          averageExecutionTime: Number,
          lastExecuted: Date,
        },
      },
    }],
    
    // Workflow execution instances
    executions: [{
      // Execution identification
      executionId: {
        type: String,
        required: true,
      },
      
      // Execution metadata
      triggeredBy: {
        type: {
          type: String,
          enum: ["user", "schedule", "event", "webhook", "api"],
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        triggerId: String,
      },
      
      // Execution status
      status: {
        type: String,
        enum: ["pending", "running", "completed", "failed", "cancelled", "paused"],
        default: "pending",
      },
      
      // Execution timing
      timing: {
        startedAt: Date,
        completedAt: Date,
        duration: Number,      // Milliseconds
      },
      
      // Input/Output data
      input: Object,
      output: Object,
      
      // Step execution details
      stepExecutions: [{
        stepId: String,
        status: {
          type: String,
          enum: ["pending", "running", "completed", "failed", "skipped"],
        },
        startedAt: Date,
        completedAt: Date,
        duration: Number,
        input: Object,
        output: Object,
        error: String,
        retryCount: {
          type: Number,
          default: 0,
        },
        logs: [String],
      }],
      
      // Execution context
      context: {
        variables: Object,     // Workflow variables
        environment: String,   // Execution environment
        priority: {
          type: Number,
          default: 0,
        },
        metadata: Object,      // Additional execution metadata
      },
      
      // Error information
      error: {
        message: String,
        stack: String,
        stepId: String,        // Step where error occurred
        recoverable: Boolean,
      },
      
      // Human task tracking
      humanTasks: [{
        stepId: String,
        taskId: String,
        assignee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed", "cancelled"],
        },
        assignedAt: Date,
        completedAt: Date,
        response: Object,
      }],
    }],
    
    // Workflow analytics
    analytics: {
      // Performance metrics
      performance: {
        totalExecutions: {
          type: Number,
          default: 0,
        },
        successfulExecutions: {
          type: Number,
          default: 0,
        },
        failedExecutions: {
          type: Number,
          default: 0,
        },
        averageExecutionTime: Number,
        successRate: {
          type: Number,
          default: 0,
        },
        lastExecuted: Date,
      },
      
      // Usage statistics
      usage: {
        dailyExecutions: [{
          date: Date,
          count: Number,
        }],
        monthlyExecutions: [{
          month: String,
          count: Number,
        }],
        peakUsageHours: [Number], // Hours of day with peak usage
      },
      
      // Step performance
      stepPerformance: [{
        stepId: String,
        averageExecutionTime: Number,
        failureRate: Number,
        bottleneck: Boolean,
      }],
      
      // Error analysis
      errorAnalysis: {
        commonErrors: [{
          error: String,
          count: Number,
          stepId: String,
        }],
        errorTrends: [{
          date: Date,
          errorCount: Number,
        }],
      },
    },
    
    // Workflow status and lifecycle
    status: {
      type: String,
      enum: ["draft", "active", "paused", "deprecated", "archived"],
      default: "draft",
    },
    
    // Version control
    version: {
      major: {
        type: Number,
        default: 1,
      },
      minor: {
        type: Number,
        default: 0,
      },
      patch: {
        type: Number,
        default: 0,
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
        workflowSnapshot: Object, // Complete workflow at this version
      }],
    },
    
    // Access control
    permissions: {
      // Who can view the workflow
      view: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
      
      // Who can execute the workflow
      execute: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
      
      // Who can edit the workflow
      edit: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
      
      // Who can admin the workflow
      admin: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
      
      // Team permissions
      teams: [{
        team: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Team",
        },
        permission: {
          type: String,
          enum: ["view", "execute", "edit", "admin"],
        },
      }],
    },
    
    // Integration and external services
    integrations: [{
      service: String,
      serviceId: String,
      configuration: Object,
      enabled: {
        type: Boolean,
        default: true,
      },
      lastSync: Date,
    }],
    
    // Monitoring and alerting
    monitoring: {
      // Health checks
      healthChecks: [{
        name: String,
        enabled: Boolean,
        interval: Number,      // Check interval in minutes
        threshold: Number,     // Failure threshold
        alerts: [{
          type: String,
          recipients: [String],
          condition: String,
        }],
      }],
      
      // SLA monitoring
      sla: {
        enabled: Boolean,
        maxExecutionTime: Number, // Maximum allowed execution time
        maxFailureRate: Number,   // Maximum allowed failure rate
        alerts: [{
          type: String,
          threshold: Number,
          recipients: [String],
        }],
      },
    },
    
    // Documentation and help
    documentation: {
      overview: String,
      setup: String,
      troubleshooting: String,
      examples: [String],
      changelog: [String],
      
      // Auto-generated documentation
      autoGenerated: {
        flowChart: String,     // Generated flow chart
        stepDocumentation: [{
          stepId: String,
          documentation: String,
        }],
        lastGenerated: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
workflowSchema.index({ createdBy: 1 });
workflowSchema.index({ team: 1 });
workflowSchema.index({ category: 1 });
workflowSchema.index({ status: 1 });
workflowSchema.index({ "triggers.type": 1, "triggers.enabled": 1 });
workflowSchema.index({ "executions.status": 1 });
workflowSchema.index({ "executions.triggeredBy.triggerId": 1 });

// Virtual for current version string
workflowSchema.virtual('versionString').get(function() {
  return `${this.version.major}.${this.version.minor}.${this.version.patch}`;
});

// Virtual for success rate
workflowSchema.virtual('successRate').get(function() {
  const total = this.analytics.performance.totalExecutions;
  const successful = this.analytics.performance.successfulExecutions;
  return total > 0 ? (successful / total) * 100 : 0;
});

// Method to execute workflow
workflowSchema.methods.execute = async function(input = {}, context = {}) {
  const executionId = new mongoose.Types.ObjectId().toString();
  
  const execution = {
    executionId,
    triggeredBy: context.triggeredBy || { type: "user" },
    status: "running",
    timing: {
      startedAt: new Date(),
    },
    input,
    stepExecutions: [],
    context: {
      variables: { ...input },
      environment: context.environment || "production",
      priority: context.priority || 0,
      metadata: context.metadata || {},
    },
  };
  
  this.executions.push(execution);
  this.analytics.performance.totalExecutions++;
  
  try {
    // Execute workflow steps
    await this.executeSteps(execution);
    
    execution.status = "completed";
    execution.timing.completedAt = new Date();
    execution.timing.duration = execution.timing.completedAt - execution.timing.startedAt;
    
    this.analytics.performance.successfulExecutions++;
    
  } catch (error) {
    execution.status = "failed";
    execution.error = {
      message: error.message,
      stack: error.stack,
      recoverable: error.recoverable || false,
    };
    
    this.analytics.performance.failedExecutions++;
  }
  
  // Update analytics
  this.updateAnalytics();
  
  await this.save();
  return execution;
};

// Method to execute workflow steps
workflowSchema.methods.executeSteps = async function(execution) {
  const sortedSteps = this.steps.sort((a, b) => a.order - b.order);
  
  for (const step of sortedSteps) {
    if (!step.execution.enabled) continue;
    
    const stepExecution = {
      stepId: step.id,
      status: "running",
      startedAt: new Date(),
      input: this.getStepInput(step, execution.context),
      retryCount: 0,
      logs: [],
    };
    
    execution.stepExecutions.push(stepExecution);
    
    try {
      // Execute step based on type
      const result = await this.executeStep(step, stepExecution, execution.context);
      
      stepExecution.status = "completed";
      stepExecution.output = result;
      stepExecution.completedAt = new Date();
      stepExecution.duration = stepExecution.completedAt - stepExecution.startedAt;
      
      // Update context with step output
      this.updateContextWithStepOutput(step, result, execution.context);
      
    } catch (error) {
      stepExecution.status = "failed";
      stepExecution.error = error.message;
      stepExecution.completedAt = new Date();
      
      // Handle error based on step configuration
      if (step.errorHandling.onError === "stop") {
        throw error;
      } else if (step.errorHandling.onError === "retry" && 
                 stepExecution.retryCount < (step.errorHandling.maxRetries || 0)) {
        stepExecution.retryCount++;
        stepExecution.status = "running";
        // Retry logic would go here
      }
    }
  }
};

// Method to execute individual step
workflowSchema.methods.executeStep = async function(step, stepExecution, context) {
  switch (step.type) {
    case "action":
      return this.executeAction(step.config.action, stepExecution.input, context);
      
    case "condition":
      return this.executeCondition(step.config.condition, context);
      
    case "notification":
      return this.executeNotification(step.config.notification, context);
      
    case "wait":
      return this.executeWait(step.config.wait);
      
    case "integration":
      return this.executeIntegration(step.config.integration, stepExecution.input);
      
    case "human_task":
      return this.executeHumanTask(step.config.humanTask, context);
      
    default:
      throw new Error(`Unsupported step type: ${step.type}`);
  }
};

// Method to execute action step
workflowSchema.methods.executeAction = async function(actionConfig, input, context) {
  // This would contain the actual action execution logic
  // For example, creating tasks, updating entities, etc.
  
  switch (actionConfig.actionType) {
    case "create_task":
      const Task = mongoose.model('Task');
      const taskData = { ...actionConfig.parameters, ...input };
      return Task.create(taskData);
      
    case "send_email":
      // Email sending logic
      return { sent: true, messageId: "email_123" };
      
    case "update_entity":
      // Entity update logic
      return { updated: true };
      
    default:
      throw new Error(`Unknown action type: ${actionConfig.actionType}`);
  }
};

// Method to execute notification step
workflowSchema.methods.executeNotification = async function(notificationConfig, context) {
  const Notification = mongoose.model('Notification');
  
  const notificationData = {
    type: 'workflow_notification',
    title: this.replaceVariables(notificationConfig.template?.title || 'Workflow Notification', context),
    message: this.replaceVariables(notificationConfig.template?.message || 'Workflow step executed', context),
    scheduledFor: new Date(),
  };
  
  const results = [];
  for (const recipient of notificationConfig.recipients) {
    if (recipient.type === 'user') {
      const notification = await Notification.scheduleNotification({
        ...notificationData,
        user: recipient.value,
      });
      results.push(notification);
    }
  }
  
  return { notificationsSent: results.length, notifications: results };
};

// Method to execute wait step
workflowSchema.methods.executeWait = async function(waitConfig) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ waited: waitConfig.duration });
    }, waitConfig.duration);
  });
};

// Method to replace variables in strings
workflowSchema.methods.replaceVariables = function(template, context) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return context.variables[varName] || match;
  });
};

// Method to get step input
workflowSchema.methods.getStepInput = function(step, context) {
  // Extract input based on step configuration and context
  return context.variables;
};

// Method to update context with step output
workflowSchema.methods.updateContextWithStepOutput = function(step, output, context) {
  // Update context variables with step output
  context.variables[`${step.id}_output`] = output;
};

// Method to update analytics
workflowSchema.methods.updateAnalytics = function() {
  const total = this.analytics.performance.totalExecutions;
  const successful = this.analytics.performance.successfulExecutions;
  
  this.analytics.performance.successRate = total > 0 ? (successful / total) * 100 : 0;
  this.analytics.performance.lastExecuted = new Date();
  
  // Update daily execution count
  const today = new Date().toDateString();
  let dailyEntry = this.analytics.usage.dailyExecutions.find(
    entry => entry.date.toDateString() === today
  );
  
  if (dailyEntry) {
    dailyEntry.count++;
  } else {
    this.analytics.usage.dailyExecutions.push({
      date: new Date(),
      count: 1,
    });
  }
  
  // Keep only last 30 days
  if (this.analytics.usage.dailyExecutions.length > 30) {
    this.analytics.usage.dailyExecutions = this.analytics.usage.dailyExecutions.slice(-30);
  }
};

// Method to create new version
workflowSchema.methods.createVersion = async function(changes, changedBy) {
  // Save current state to history
  this.version.history.push({
    version: this.versionString,
    changes,
    changedBy,
    changedAt: new Date(),
    workflowSnapshot: this.toObject(),
  });
  
  // Increment version
  this.version.patch++;
  
  return this.save();
};

// Method to check if user has permission
workflowSchema.methods.hasPermission = function(userId, permission = 'view') {
  // Creator has all permissions
  if (this.createdBy.toString() === userId.toString()) {
    return true;
  }
  
  // Check specific permissions
  const permissionArrays = {
    view: this.permissions.view,
    execute: this.permissions.execute,
    edit: this.permissions.edit,
    admin: this.permissions.admin,
  };
  
  const relevantPermissions = permissionArrays[permission] || [];
  return relevantPermissions.some(p => p.toString() === userId.toString());
};

// Static method to find workflows by trigger
workflowSchema.statics.findByTrigger = function(triggerType, conditions = {}) {
  const query = {
    status: 'active',
    'triggers.type': triggerType,
    'triggers.enabled': true,
  };
  
  Object.keys(conditions).forEach(key => {
    query[`triggers.config.${key}`] = conditions[key];
  });
  
  return this.find(query);
};

// Static method to get workflow analytics
workflowSchema.statics.getWorkflowAnalytics = async function(teamId = null, period = 'month') {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
  }
  
  const matchStage = {
    status: 'active',
    'executions.timing.startedAt': { $gte: startDate, $lte: endDate },
  };
  
  if (teamId) {
    matchStage.team = new mongoose.Types.ObjectId(teamId);
  }
  
  const pipeline = [
    { $match: matchStage },
    { $unwind: '$executions' },
    {
      $group: {
        _id: null,
        totalExecutions: { $sum: 1 },
        successfulExecutions: {
          $sum: { $cond: [{ $eq: ['$executions.status', 'completed'] }, 1, 0] }
        },
        failedExecutions: {
          $sum: { $cond: [{ $eq: ['$executions.status', 'failed'] }, 1, 0] }
        },
        avgExecutionTime: { $avg: '$executions.timing.duration' },
        workflows: { $addToSet: '$_id' },
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    avgExecutionTime: 0,
    workflows: [],
  };
};

const Workflow = mongoose.model("Workflow", workflowSchema);

module.exports = Workflow;