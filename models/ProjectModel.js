const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    // Basic project information
    name: {
      type: String,
      required: [true, "Please add a project name"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    code: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    }, // Project code like "PROJ-001"
    
    // Project ownership and team
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    
    // Project categorization
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    tags: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
    }],
    type: {
      type: String,
      enum: [
        "development",
        "marketing",
        "research",
        "design",
        "operation",
        "maintenance",
        "training",
        "event",
        "product_launch",
        "improvement",
        "compliance",
        "custom"
      ],
      default: "custom",
    },
    
    // Project timeline and scheduling
    timeline: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
      actualStartDate: Date,
      actualEndDate: Date,
      
      // Milestones
      milestones: [{
        name: {
          type: String,
          required: true,
        },
        description: String,
        targetDate: Date,
        actualDate: Date,
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed", "delayed", "cancelled"],
          default: "pending",
        },
        deliverables: [String],
        dependencies: [String], // Other milestone names this depends on
        assignee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        progress: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        order: Number,
      }],
      
      // Phases for complex projects
      phases: [{
        name: String,
        description: String,
        startDate: Date,
        endDate: Date,
        status: {
          type: String,
          enum: ["not_started", "in_progress", "completed", "on_hold"],
          default: "not_started",
        },
        progress: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        budget: Number,
        order: Number,
      }],
    },
    
    // Project team and roles
    teamMembers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: {
        type: String,
        enum: [
          "project_manager",
          "tech_lead",
          "developer",
          "designer",
          "analyst",
          "tester",
          "stakeholder",
          "contributor",
          "reviewer",
          "sponsor"
        ],
        default: "contributor",
      },
      responsibilities: [String],
      joinedAt: {
        type: Date,
        default: Date.now,
      },
      allocation: {
        type: Number,
        min: 0,
        max: 100,
        default: 100,
      }, // Percentage of time allocated to project
      hourlyRate: Number, // For billing/cost tracking
      access: {
        level: {
          type: String,
          enum: ["read", "contribute", "manage", "admin"],
          default: "contribute",
        },
        permissions: [String],
      },
    }],
    
    // Project structure and organization
    structure: {
      // Tasks linked to this project
      tasks: [{
        task: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Task",
        },
        phase: String, // Which phase this task belongs to
        milestone: String, // Which milestone this task contributes to
        priority: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          default: "medium",
        },
        estimatedHours: Number,
        actualHours: Number,
        status: {
          type: String,
          enum: ["not_started", "in_progress", "completed", "blocked"],
          default: "not_started",
        },
      }],
      
      // Workstreams or sub-projects
      workstreams: [{
        name: String,
        description: String,
        lead: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        tasks: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "Task",
        }],
        status: String,
        progress: Number,
      }],
      
      // Dependencies between tasks/milestones
      dependencies: [{
        dependentItem: {
          type: String, // Task ID or milestone name
        },
        dependsOn: {
          type: String, // Task ID or milestone name
        },
        type: {
          type: String,
          enum: ["finish_to_start", "start_to_start", "finish_to_finish", "start_to_finish"],
          default: "finish_to_start",
        },
        lag: Number, // Days of lag/lead time
      }],
    },
    
    // Project status and progress
    status: {
      type: String,
      enum: [
        "planning",
        "approved",
        "in_progress", 
        "on_hold",
        "at_risk",
        "completed",
        "cancelled",
        "archived"
      ],
      default: "planning",
    },
    
    progress: {
      overall: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      byPhase: [{
        phase: String,
        progress: Number,
      }],
      byMilestone: [{
        milestone: String,
        progress: Number,
      }],
      lastUpdated: Date,
      calculationMethod: {
        type: String,
        enum: ["manual", "task_based", "milestone_based", "weighted"],
        default: "task_based",
      },
    },
    
    // Budget and resource management
    budget: {
      total: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: "USD",
      },
      
      // Budget breakdown
      breakdown: [{
        category: {
          type: String,
          enum: ["labor", "materials", "equipment", "software", "travel", "training", "other"],
        },
        budgeted: Number,
        spent: Number,
        committed: Number, // Committed but not yet spent
        remaining: Number,
      }],
      
      // Cost tracking
      costs: [{
        description: String,
        category: String,
        amount: Number,
        date: Date,
        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        receipt: String, // File path or URL
        billable: {
          type: Boolean,
          default: true,
        },
      }],
      
      // Budget approval workflow
      approval: {
        required: {
          type: Boolean,
          default: false,
        },
        approvers: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        }],
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        approvedAt: Date,
        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        comments: String,
      },
    },
    
    // Risk management
    risks: [{
      title: String,
      description: String,
      category: {
        type: String,
        enum: ["technical", "resource", "schedule", "budget", "scope", "external", "quality"],
      },
      probability: {
        type: String,
        enum: ["low", "medium", "high"],
      },
      impact: {
        type: String,
        enum: ["low", "medium", "high"],
      },
      riskLevel: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
      },
      mitigation: String,
      contingency: String,
      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      status: {
        type: String,
        enum: ["open", "mitigated", "realized", "closed"],
        default: "open",
      },
      identifiedAt: {
        type: Date,
        default: Date.now,
      },
      lastReviewed: Date,
    }],
    
    // Quality assurance
    quality: {
      // Quality criteria
      criteria: [{
        name: String,
        description: String,
        weight: Number, // Importance weight
        status: {
          type: String,
          enum: ["not_assessed", "pass", "fail", "needs_improvement"],
          default: "not_assessed",
        },
        assessedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        assessedAt: Date,
        notes: String,
      }],
      
      // Reviews and audits
      reviews: [{
        type: {
          type: String,
          enum: ["quality_gate", "milestone_review", "phase_review", "final_review"],
        },
        scheduledDate: Date,
        actualDate: Date,
        reviewer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["scheduled", "completed", "failed", "deferred"],
        },
        outcome: {
          type: String,
          enum: ["approved", "approved_with_conditions", "rejected"],
        },
        findings: [String],
        recommendations: [String],
        actionItems: [{
          description: String,
          assignee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          dueDate: Date,
          status: {
            type: String,
            enum: ["open", "in_progress", "completed"],
            default: "open",
          },
        }],
      }],
      
      // Quality metrics
      metrics: {
        defectCount: { type: Number, default: 0 },
        defectDensity: Number, // Defects per unit of work
        customerSatisfaction: Number, // 1-10 scale
        qualityScore: { type: Number, min: 0, max: 100 },
        reworkRate: Number, // Percentage of work that needed rework
      },
    },
    
    // Communication and collaboration
    communication: {
      // Communication plan
      plan: {
        frequency: {
          type: String,
          enum: ["daily", "weekly", "bi_weekly", "monthly"],
          default: "weekly",
        },
        methods: [String], // email, slack, meetings, etc.
        stakeholders: [{
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          role: String,
          communicationLevel: {
            type: String,
            enum: ["detailed", "summary", "exception_only"],
            default: "summary",
          },
        }],
      },
      
      // Status reporting
      statusReports: [{
        reportDate: Date,
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        overallStatus: {
          type: String,
          enum: ["green", "yellow", "red"],
        },
        accomplishments: [String],
        upcoming: [String],
        risks: [String],
        issues: [String],
        nextMilestone: String,
        budgetStatus: String,
        scheduleStatus: String,
        qualityStatus: String,
      }],
      
      // Meetings and ceremonies
      meetings: [{
        type: {
          type: String,
          enum: ["kickoff", "standup", "review", "retrospective", "stakeholder"],
        },
        frequency: String,
        duration: Number, // minutes
        attendees: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        }],
        agenda: [String],
        nextMeeting: Date,
        meetingNotes: String,
      }],
    },
    
    // Knowledge management
    knowledge: {
      // Documentation
      documents: [{
        title: String,
        description: String,
        type: {
          type: String,
          enum: [
            "requirement",
            "design",
            "specification",
            "test_plan",
            "user_manual",
            "technical_doc",
            "process",
            "other"
          ],
        },
        url: String, // Link to document
        version: String,
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        lastUpdated: Date,
        status: {
          type: String,
          enum: ["draft", "review", "approved", "archived"],
          default: "draft",
        },
      }],
      
      // Lessons learned
      lessonsLearned: [{
        title: String,
        description: String,
        category: {
          type: String,
          enum: ["process", "technology", "team", "communication", "risk"],
        },
        impact: {
          type: String,
          enum: ["positive", "negative"],
        },
        recommendation: String,
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      }],
      
      // Best practices
      bestPractices: [{
        title: String,
        description: String,
        category: String,
        applicability: String,
        benefits: [String],
        implementation: String,
      }],
    },
    
    // Project analytics and insights
    analytics: {
      // Performance metrics
      performance: {
        schedulePerformance: Number, // SPI - Schedule Performance Index
        costPerformance: Number,     // CPI - Cost Performance Index
        qualityPerformance: Number,  // Quality metrics
        velocityTrend: [Number],     // Velocity over time periods
        burndownData: [{
          date: Date,
          remainingWork: Number,
          completedWork: Number,
        }],
      },
      
      // Productivity metrics
      productivity: {
        tasksPerDay: Number,
        hoursPerTask: Number,
        teamEfficiency: Number, // 0-100
        utilizationRate: Number, // Percentage of available hours used
        throughput: Number, // Tasks completed per time period
      },
      
      // Historical data
      snapshots: [{
        date: Date,
        progress: Number,
        budget: {
          spent: Number,
          remaining: Number,
        },
        team: {
          size: Number,
          utilization: Number,
        },
        risks: {
          count: Number,
          highRiskCount: Number,
        },
        quality: {
          score: Number,
          defectCount: Number,
        },
      }],
    },
    
    // Integration and automation
    integrations: [{
      type: {
        type: String,
        enum: ["repository", "ci_cd", "monitoring", "communication", "documentation"],
      },
      service: String, // GitHub, Jenkins, Slack, etc.
      configuration: Object,
      enabled: {
        type: Boolean,
        default: true,
      },
      lastSync: Date,
    }],
    
    // Templates and reusability
    template: {
      isTemplate: {
        type: Boolean,
        default: false,
      },
      templateName: String,
      templateDescription: String,
      templateCategory: String,
      usageCount: {
        type: Number,
        default: 0,
      },
      createdFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    },
    
    // Settings and preferences
    settings: {
      visibility: {
        type: String,
        enum: ["private", "team", "organization", "public"],
        default: "team",
      },
      notifications: {
        milestoneUpdates: Boolean,
        riskAlerts: Boolean,
        budgetAlerts: Boolean,
        statusReports: Boolean,
      },
      automation: {
        autoProgressUpdate: Boolean,
        autoRiskAssessment: Boolean,
        autoReporting: Boolean,
      },
      customFields: [{
        name: String,
        type: String,
        value: String,
        required: Boolean,
      }],
    },
    
    // Approval and governance
    governance: {
      approvalRequired: {
        type: Boolean,
        default: false,
      },
      approvers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
      approvalWorkflow: [{
        stage: String,
        approver: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        approvedAt: Date,
        comments: String,
      }],
      complianceRequirements: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
projectSchema.index({ owner: 1, status: 1 });
projectSchema.index({ team: 1 });
projectSchema.index({ "timeline.startDate": 1, "timeline.endDate": 1 });
projectSchema.index({ status: 1, "progress.overall": -1 });
projectSchema.index({ code: 1 }, { unique: true, sparse: true });
projectSchema.index({ "teamMembers.user": 1 });

// Virtual for project duration
projectSchema.virtual('duration').get(function() {
  if (!this.timeline.startDate || !this.timeline.endDate) return 0;
  return Math.ceil((this.timeline.endDate - this.timeline.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for days remaining
projectSchema.virtual('daysRemaining').get(function() {
  if (!this.timeline.endDate) return null;
  const now = new Date();
  if (this.timeline.endDate < now) return 0;
  return Math.ceil((this.timeline.endDate - now) / (1000 * 60 * 60 * 24));
});

// Virtual for budget utilization
projectSchema.virtual('budgetUtilization').get(function() {
  if (!this.budget.total || this.budget.total === 0) return 0;
  const totalSpent = this.budget.breakdown.reduce((sum, item) => sum + (item.spent || 0), 0);
  return (totalSpent / this.budget.total) * 100;
});

// Pre-save middleware to update progress and generate project code
projectSchema.pre('save', async function(next) {
  // Generate project code if not provided
  if (!this.code && this.isNew) {
    const year = new Date().getFullYear();
    const count = await this.model('Project').countDocuments({
      createdAt: { 
        $gte: new Date(year, 0, 1), 
        $lt: new Date(year + 1, 0, 1) 
      }
    });
    this.code = `PROJ-${year}-${(count + 1).toString().padStart(3, '0')}`;
  }
  
  // Update overall progress based on tasks
  if (this.progress.calculationMethod === 'task_based') {
    await this.calculateTaskBasedProgress();
  }
  
  // Update milestone progress
  this.updateMilestoneProgress();
  
  // Update budget remaining amounts
  this.updateBudgetCalculations();
  
  next();
});

// Method to calculate task-based progress
projectSchema.methods.calculateTaskBasedProgress = async function() {
  if (this.structure.tasks.length === 0) {
    this.progress.overall = 0;
    return;
  }
  
  const Task = mongoose.model('Task');
  const taskIds = this.structure.tasks.map(t => t.task);
  const tasks = await Task.find({ _id: { $in: taskIds } });
  
  let totalWeight = 0;
  let weightedProgress = 0;
  
  this.structure.tasks.forEach(projectTask => {
    const task = tasks.find(t => t._id.toString() === projectTask.task.toString());
    if (task) {
      const weight = projectTask.estimatedHours || 1;
      totalWeight += weight;
      weightedProgress += (task.progress || 0) * weight;
    }
  });
  
  this.progress.overall = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;
  this.progress.lastUpdated = new Date();
};

// Method to update milestone progress
projectSchema.methods.updateMilestoneProgress = function() {
  this.progress.byMilestone = this.timeline.milestones.map(milestone => ({
    milestone: milestone.name,
    progress: milestone.progress,
  }));
};

// Method to update budget calculations
projectSchema.methods.updateBudgetCalculations = function() {
  this.budget.breakdown.forEach(item => {
    item.remaining = item.budgeted - (item.spent || 0) - (item.committed || 0);
  });
};

// Method to add team member
projectSchema.methods.addTeamMember = async function(userId, role = 'contributor', allocation = 100) {
  // Check if user is already a team member
  const existingMember = this.teamMembers.find(m => m.user.toString() === userId.toString());
  if (existingMember) {
    throw new Error('User is already a team member');
  }
  
  this.teamMembers.push({
    user: userId,
    role,
    allocation,
  });
  
  return this.save();
};

// Method to remove team member
projectSchema.methods.removeTeamMember = async function(userId) {
  const memberIndex = this.teamMembers.findIndex(m => m.user.toString() === userId.toString());
  if (memberIndex === -1) {
    throw new Error('User is not a team member');
  }
  
  this.teamMembers.splice(memberIndex, 1);
  return this.save();
};

// Method to add milestone
projectSchema.methods.addMilestone = async function(milestoneData) {
  this.timeline.milestones.push({
    ...milestoneData,
    order: this.timeline.milestones.length + 1,
  });
  
  // Sort milestones by target date
  this.timeline.milestones.sort((a, b) => a.targetDate - b.targetDate);
  
  // Update order
  this.timeline.milestones.forEach((milestone, index) => {
    milestone.order = index + 1;
  });
  
  return this.save();
};

// Method to complete milestone
projectSchema.methods.completeMilestone = async function(milestoneName) {
  const milestone = this.timeline.milestones.find(m => m.name === milestoneName);
  if (!milestone) {
    throw new Error('Milestone not found');
  }
  
  milestone.status = 'completed';
  milestone.actualDate = new Date();
  milestone.progress = 100;
  
  // Check if all milestones are completed
  const allCompleted = this.timeline.milestones.every(m => m.status === 'completed');
  if (allCompleted && this.status === 'in_progress') {
    this.status = 'completed';
    this.timeline.actualEndDate = new Date();
  }
  
  return this.save();
};

// Method to add risk
projectSchema.methods.addRisk = async function(riskData) {
  // Calculate risk level based on probability and impact
  const riskMatrix = {
    'low-low': 'low',
    'low-medium': 'low',
    'low-high': 'medium',
    'medium-low': 'low',
    'medium-medium': 'medium',
    'medium-high': 'high',
    'high-low': 'medium',
    'high-medium': 'high',
    'high-high': 'critical',
  };
  
  const riskLevel = riskMatrix[`${riskData.probability}-${riskData.impact}`] || 'medium';
  
  this.risks.push({
    ...riskData,
    riskLevel,
  });
  
  return this.save();
};

// Method to generate status report
projectSchema.methods.generateStatusReport = async function() {
  const Task = mongoose.model('Task');
  
  // Get project tasks
  const taskIds = this.structure.tasks.map(t => t.task);
  const tasks = await Task.find({ _id: { $in: taskIds } });
  
  // Calculate accomplishments (recently completed tasks)
  const recentlyCompleted = tasks.filter(task => {
    if (!task.completedAt) return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return task.completedAt >= weekAgo;
  });
  
  // Calculate upcoming work (tasks due soon)
  const upcoming = tasks.filter(task => {
    if (!task.dueDate || task.completed) return false;
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return task.dueDate <= nextWeek;
  });
  
  // Determine overall status
  let overallStatus = 'green';
  if (this.progress.overall < 50 && this.daysRemaining < 30) {
    overallStatus = 'red';
  } else if (this.risks.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length > 0) {
    overallStatus = 'yellow';
  }
  
  const report = {
    reportDate: new Date(),
    overallStatus,
    accomplishments: recentlyCompleted.map(t => t.title),
    upcoming: upcoming.map(t => `${t.title} (due ${t.dueDate.toDateString()})`),
    risks: this.risks.filter(r => r.status === 'open').map(r => r.title),
    nextMilestone: this.getNextMilestone(),
    budgetStatus: this.getBudgetStatus(),
    scheduleStatus: this.getScheduleStatus(),
    qualityStatus: this.getQualityStatus(),
  };
  
  this.communication.statusReports.push(report);
  
  // Keep only last 20 reports
  if (this.communication.statusReports.length > 20) {
    this.communication.statusReports = this.communication.statusReports.slice(-20);
  }
  
  await this.save();
  return report;
};

// Helper method to get next milestone
projectSchema.methods.getNextMilestone = function() {
  const nextMilestone = this.timeline.milestones
    .filter(m => m.status !== 'completed')
    .sort((a, b) => a.targetDate - b.targetDate)[0];
  
  return nextMilestone ? 
    `${nextMilestone.name} (${nextMilestone.targetDate.toDateString()})` : 
    'No upcoming milestones';
};

// Helper method to get budget status
projectSchema.methods.getBudgetStatus = function() {
  const utilization = this.budgetUtilization;
  const progress = this.progress.overall;
  
  if (utilization > progress + 10) {
    return 'Over budget - spending ahead of progress';
  } else if (utilization < progress - 10) {
    return 'Under budget - spending behind progress';
  } else {
    return 'On budget';
  }
};

// Helper method to get schedule status
projectSchema.methods.getScheduleStatus = function() {
  if (!this.timeline.endDate) return 'No end date set';
  
  const today = new Date();
  const totalDuration = this.timeline.endDate - this.timeline.startDate;
  const elapsed = today - this.timeline.startDate;
  const expectedProgress = Math.min(100, (elapsed / totalDuration) * 100);
  
  const actualProgress = this.progress.overall;
  
  if (actualProgress >= expectedProgress) {
    return 'On schedule';
  } else if (actualProgress < expectedProgress - 10) {
    return 'Behind schedule';
  } else {
    return 'Slightly behind schedule';
  }
};

// Helper method to get quality status
projectSchema.methods.getQualityStatus = function() {
  if (this.quality.metrics.qualityScore >= 80) {
    return 'High quality';
  } else if (this.quality.metrics.qualityScore >= 60) {
    return 'Acceptable quality';
  } else {
    return 'Quality needs improvement';
  }
};

// Method to calculate project health score
projectSchema.methods.calculateHealthScore = function() {
  let score = 0;
  let factors = 0;
  
  // Schedule health (25%)
  const scheduleHealth = this.getScheduleHealth();
  score += scheduleHealth * 0.25;
  factors += 0.25;
  
  // Budget health (25%)
  const budgetHealth = this.getBudgetHealth();
  score += budgetHealth * 0.25;
  factors += 0.25;
  
  // Quality health (25%)
  const qualityHealth = this.quality.metrics.qualityScore || 75;
  score += qualityHealth * 0.25;
  factors += 0.25;
  
  // Risk health (25%)
  const riskHealth = this.getRiskHealth();
  score += riskHealth * 0.25;
  factors += 0.25;
  
  return Math.round(score / factors);
};

// Helper methods for health calculations
projectSchema.methods.getScheduleHealth = function() {
  if (!this.timeline.endDate) return 50;
  
  const today = new Date();
  const totalDuration = this.timeline.endDate - this.timeline.startDate;
  const elapsed = today - this.timeline.startDate;
  const expectedProgress = Math.min(100, (elapsed / totalDuration) * 100);
  const actualProgress = this.progress.overall;
  
  const variance = actualProgress - expectedProgress;
  return Math.max(0, Math.min(100, 75 + variance));
};

projectSchema.methods.getBudgetHealth = function() {
  const utilization = this.budgetUtilization;
  const progress = this.progress.overall;
  const variance = progress - utilization;
  
  return Math.max(0, Math.min(100, 75 + variance));
};

projectSchema.methods.getRiskHealth = function() {
  const totalRisks = this.risks.filter(r => r.status === 'open').length;
  const highRisks = this.risks.filter(r => 
    r.status === 'open' && (r.riskLevel === 'high' || r.riskLevel === 'critical')
  ).length;
  
  if (totalRisks === 0) return 100;
  
  const riskScore = 100 - (highRisks * 20) - (totalRisks * 5);
  return Math.max(0, riskScore);
};

// Static methods
projectSchema.statics.findByOwner = function(userId) {
  return this.find({ owner: userId }).sort({ createdAt: -1 });
};

projectSchema.statics.findByTeamMember = function(userId) {
  return this.find({ 'teamMembers.user': userId }).sort({ createdAt: -1 });
};

projectSchema.statics.findActive = function() {
  return this.find({ 
    status: { $in: ['in_progress', 'at_risk'] } 
  }).sort({ 'timeline.endDate': 1 });
};

projectSchema.statics.findOverdue = function() {
  return this.find({
    'timeline.endDate': { $lt: new Date() },
    status: { $in: ['in_progress', 'at_risk'] }
  });
};

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;