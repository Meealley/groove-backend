const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    // Basic team information
    name: {
      type: String,
      required: [true, "Please add a team name"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    avatar: String, // Team logo/avatar URL
    
    // Team organization and structure
    organization: {
      name: String,
      domain: String, // Company domain for auto-joining
      industry: String,
      size: {
        type: String,
        enum: ["startup", "small", "medium", "large", "enterprise"],
      },
      location: {
        headquarters: String,
        timezone: String,
        workingHours: {
          start: String, // "09:00"
          end: String,   // "17:00"
        },
      },
    },
    
    // Team membership and roles
    members: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: {
        type: String,
        enum: ["owner", "admin", "manager", "member", "guest", "contractor"],
        default: "member",
      },
      // Custom permissions
      permissions: [{
        resource: {
          type: String,
          enum: [
            "tasks", "projects", "categories", "templates", 
            "reports", "settings", "members", "billing",
            "integrations", "workflows", "goals"
          ],
        },
        actions: [{
          type: String,
          enum: ["view", "create", "edit", "delete", "assign", "approve"],
        }],
      }],
      // Membership details
      joinedAt: {
        type: Date,
        default: Date.now,
      },
      invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      status: {
        type: String,
        enum: ["active", "inactive", "pending", "suspended"],
        default: "pending",
      },
      // Member-specific settings
      settings: {
        notifications: {
          mentions: { type: Boolean, default: true },
          assignments: { type: Boolean, default: true },
          deadlines: { type: Boolean, default: true },
          updates: { type: Boolean, default: true },
        },
        availability: {
          status: {
            type: String,
            enum: ["available", "busy", "away", "do_not_disturb"],
            default: "available",
          },
          customMessage: String,
          autoUpdate: Boolean,
        },
      },
      // Performance and contribution tracking
      metrics: {
        tasksCompleted: { type: Number, default: 0 },
        tasksAssigned: { type: Number, default: 0 },
        projectsLed: { type: Number, default: 0 },
        averageCompletionTime: Number, // hours
        reliabilityScore: { type: Number, default: 100 }, // 0-100
        collaborationScore: { type: Number, default: 50 }, // 0-100
        lastActive: Date,
      },
    }],
    
    // Team structure and departments
    structure: {
      // Departments/divisions
      departments: [{
        name: String,
        description: String,
        head: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        members: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        }],
        budget: Number,
        goals: [String],
      }],
      
      // Custom roles beyond basic member roles
      customRoles: [{
        name: String,
        description: String,
        permissions: [{
          resource: String,
          actions: [String],
        }],
        level: {
          type: Number,
          min: 1,
          max: 10,
        }, // Hierarchy level
        color: String, // Display color
      }],
      
      // Reporting relationships
      hierarchy: [{
        manager: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        directReports: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        }],
      }],
    },
    
    // Team preferences and settings
    settings: {
      // General settings
      general: {
        timezone: {
          type: String,
          default: "UTC",
        },
        workingDays: {
          type: [Number], // 0-6 for Sunday-Saturday
          default: [1, 2, 3, 4, 5], // Monday-Friday
        },
        workingHours: {
          start: {
            type: String,
            default: "09:00",
          },
          end: {
            type: String,
            default: "17:00",
          },
        },
        language: {
          type: String,
          default: "en",
        },
        currency: {
          type: String,
          default: "USD",
        },
      },
      
      // Privacy and security
      privacy: {
        visibility: {
          type: String,
          enum: ["public", "organization", "private"],
          default: "private",
        },
        joinPolicy: {
          type: String,
          enum: ["open", "approval_required", "invite_only"],
          default: "invite_only",
        },
        dataSharing: {
          allowAnalytics: { type: Boolean, default: true },
          allowIntegrations: { type: Boolean, default: true },
          allowExports: { type: Boolean, default: false },
        },
      },
      
      // Collaboration settings
      collaboration: {
        defaultAssignmentPolicy: {
          type: String,
          enum: ["manual", "round_robin", "workload_based", "skill_based"],
          default: "manual",
        },
        allowGuestAccess: { type: Boolean, default: false },
        requireApprovalFor: [String], // Actions requiring approval
        communicationChannels: [{
          type: String,
          enabled: Boolean,
          settings: Object,
        }],
      },
      
      // Workflow and process settings
      workflows: {
        taskApprovalRequired: { type: Boolean, default: false },
        projectApprovalRequired: { type: Boolean, default: true },
        timeTrackingRequired: { type: Boolean, default: false },
        statusReportingFrequency: {
          type: String,
          enum: ["daily", "weekly", "biweekly", "monthly"],
          default: "weekly",
        },
      },
    },
    
    // Projects and goals
    projects: [{
      project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
      role: {
        type: String,
        enum: ["owner", "lead", "contributor"],
        default: "contributor",
      },
      status: {
        type: String,
        enum: ["active", "completed", "on_hold", "cancelled"],
        default: "active",
      },
      startDate: Date,
      endDate: Date,
      budget: Number,
      priority: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "medium",
      },
    }],
    
    // Team goals and objectives
    goals: [{
      goal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Goal",
      },
      type: {
        type: String,
        enum: ["team", "department", "organization"],
        default: "team",
      },
      assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
      weight: {
        type: Number,
        min: 0,
        max: 100,
        default: 100,
      }, // Importance weight
      deadline: Date,
      status: {
        type: String,
        enum: ["planning", "active", "at_risk", "completed", "failed"],
        default: "planning",
      },
    }],
    
    // Communication and collaboration
    communication: {
      // Channels (Slack, Teams, etc.)
      channels: [{
        name: String,
        type: {
          type: String,
          enum: ["general", "announcements", "project", "department", "social"],
        },
        description: String,
        isDefault: Boolean,
        members: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        }],
        settings: {
          notifications: Boolean,
          archiveAfter: Number, // days
          allowExternalGuests: Boolean,
        },
        integrationId: String, // External channel ID
      }],
      
      // Meeting settings
      meetings: {
        defaultDuration: { type: Number, default: 60 }, // minutes
        bufferTime: { type: Number, default: 15 }, // minutes between meetings
        recurringMeetings: [{
          name: String,
          frequency: String, // "weekly", "monthly", etc.
          duration: Number,
          attendees: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          }],
          dayOfWeek: Number, // 0-6
          time: String, // "14:00"
        }],
      },
      
      // Collaboration tools
      tools: [{
        name: String,
        type: {
          type: String,
          enum: ["chat", "video", "document", "whiteboard", "file_sharing"],
        },
        url: String,
        apiKey: String,
        settings: Object,
        enabled: Boolean,
      }],
    },
    
    // Performance and analytics
    analytics: {
      // Team performance metrics
      performance: {
        productivity: {
          tasksCompleted: { type: Number, default: 0 },
          projectsCompleted: { type: Number, default: 0 },
          averageTaskDuration: Number, // hours
          onTimeDeliveryRate: { type: Number, default: 0 }, // percentage
          qualityScore: { type: Number, default: 0 }, // 0-100
        },
        
        collaboration: {
          communicationFrequency: Number, // messages per day
          meetingEfficiencyScore: Number, // 0-100
          knowledgeSharingScore: Number, // 0-100
          crossFunctionalProjects: Number,
          mentorshipPairs: Number,
        },
        
        wellbeing: {
          workloadBalance: Number, // 0-100
          burnoutRisk: Number, // 0-100
          satisfactionScore: Number, // 1-10
          turnoverRate: Number, // percentage
          absenteeismRate: Number, // percentage
        },
      },
      
      // Historical data
      history: [{
        period: {
          start: Date,
          end: Date,
        },
        metrics: Object,
        insights: [String],
        improvements: [String],
      }],
      
      // Benchmarking
      benchmarks: {
        industry: {
          productivity: Number,
          collaboration: Number,
          satisfaction: Number,
        },
        internal: {
          bestPerformingTeam: String,
          averagePerformance: Number,
        },
      },
    },
    
    // Resource management
    resources: {
      // Budget and financial tracking
      budget: {
        total: Number,
        allocated: Number,
        spent: Number,
        currency: String,
        fiscalYear: String,
        categories: [{
          name: String,
          budget: Number,
          spent: Number,
          description: String,
        }],
      },
      
      // Tools and software licenses
      tools: [{
        name: String,
        type: String,
        cost: Number,
        billingCycle: {
          type: String,
          enum: ["monthly", "annually", "one_time"],
        },
        licenses: Number,
        usedLicenses: Number,
        renewalDate: Date,
        vendor: String,
      }],
      
      // Physical resources
      assets: [{
        name: String,
        type: {
          type: String,
          enum: ["equipment", "furniture", "space", "vehicle"],
        },
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        location: String,
        value: Number,
        purchaseDate: Date,
        warrantyExpires: Date,
      }],
    },
    
    // Integrations and automation
    integrations: [{
      service: String,
      type: {
        type: String,
        enum: ["communication", "project_management", "calendar", "hr", "finance"],
      },
      settings: Object,
      enabled: Boolean,
      connectedAt: Date,
      lastSync: Date,
      apiKey: String, // Encrypted
      webhookUrl: String,
    }],
    
    // Workflows and automation rules
    workflows: [{
      name: String,
      description: String,
      trigger: {
        event: String,
        conditions: [Object],
      },
      actions: [{
        type: String,
        parameters: Object,
        delay: Number, // minutes
      }],
      enabled: Boolean,
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      executionCount: { type: Number, default: 0 },
      lastExecuted: Date,
    }],
    
    // Invitations and onboarding
    invitations: [{
      email: String,
      role: String,
      permissions: [Object],
      invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      invitedAt: Date,
      expiresAt: Date,
      token: String,
      status: {
        type: String,
        enum: ["pending", "accepted", "declined", "expired"],
        default: "pending",
      },
      acceptedAt: Date,
      message: String, // Custom invitation message
    }],
    
    // Onboarding and training
    onboarding: {
      enabled: Boolean,
      steps: [{
        name: String,
        description: String,
        type: {
          type: String,
          enum: ["documentation", "video", "task", "meeting", "quiz"],
        },
        content: String,
        required: Boolean,
        order: Number,
      }],
      completionTracking: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        startedAt: Date,
        completedSteps: [String],
        completedAt: Date,
        score: Number, // For quizzes
      }],
    },
    
    // Security and compliance
    security: {
      // Access controls
      accessControls: {
        requireTwoFactor: Boolean,
        sessionTimeout: Number, // minutes
        passwordPolicy: {
          minLength: Number,
          requireUppercase: Boolean,
          requireNumbers: Boolean,
          requireSymbols: Boolean,
          expiryDays: Number,
        },
        ipWhitelist: [String],
      },
      
      // Audit and compliance
      audit: {
        logActions: Boolean,
        retentionPeriod: Number, // days
        complianceStandards: [String], // GDPR, SOX, etc.
        lastAuditDate: Date,
        nextAuditDate: Date,
      },
      
      // Data protection
      dataProtection: {
        encryptionEnabled: Boolean,
        backupFrequency: String,
        dataRetentionPolicy: Number, // days
        deleteAfterTermination: Number, // days
      },
    },
    
    // Status and lifecycle
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "archived"],
      default: "active",
    },
    
    // Subscription and billing (for team plans)
    subscription: {
      plan: {
        type: String,
        enum: ["team_basic", "team_pro", "enterprise"],
      },
      seats: Number,
      usedSeats: Number,
      billingContact: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      paymentMethod: Object,
      nextBillingDate: Date,
      subscriptionId: String, // Stripe subscription ID
    },
    
    // Administrative information
    admin: {
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      notes: String,
      tags: [String],
      customFields: [{
        name: String,
        value: String,
        type: String,
      }],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
teamSchema.index({ name: 1 });
teamSchema.index({ "organization.domain": 1 });
teamSchema.index({ "members.user": 1 });
teamSchema.index({ status: 1 });
teamSchema.index({ "admin.createdBy": 1 });

// Virtual for active members count
teamSchema.virtual('activeMembersCount').get(function() {
  return this.members.filter(member => member.status === 'active').length;
});

// Virtual for pending invitations count
teamSchema.virtual('pendingInvitationsCount').get(function() {
  return this.invitations.filter(inv => inv.status === 'pending').length;
});

// Method to add member
teamSchema.methods.addMember = async function(userId, role = 'member', permissions = []) {
  // Check if user is already a member
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  if (existingMember) {
    throw new Error('User is already a member of this team');
  }
  
  this.members.push({
    user: userId,
    role,
    permissions,
    status: 'active',
  });
  
  return this.save();
};

// Method to remove member
teamSchema.methods.removeMember = async function(userId) {
  const memberIndex = this.members.findIndex(m => m.user.toString() === userId.toString());
  if (memberIndex === -1) {
    throw new Error('User is not a member of this team');
  }
  
  this.members.splice(memberIndex, 1);
  return this.save();
};

// Method to update member role
teamSchema.methods.updateMemberRole = async function(userId, newRole) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member) {
    throw new Error('User is not a member of this team');
  }
  
  member.role = newRole;
  return this.save();
};

// Method to check if user has permission
teamSchema.methods.hasPermission = function(userId, resource, action) {
  const member = this.members.find(m => 
    m.user.toString() === userId.toString() && m.status === 'active'
  );
  
  if (!member) return false;
  
  // Owners and admins have all permissions
  if (member.role === 'owner' || member.role === 'admin') return true;
  
  // Check specific permissions
  const permission = member.permissions.find(p => p.resource === resource);
  if (!permission) return false;
  
  return permission.actions.includes(action);
};

// Method to invite user
teamSchema.methods.inviteUser = async function(email, role, invitedBy, message = '') {
  // Generate invitation token
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  // Set expiration (7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  this.invitations.push({
    email,
    role,
    invitedBy,
    token,
    expiresAt,
    message,
  });
  
  await this.save();
  
  // In production, send email invitation here
  // await sendInvitationEmail(email, token, this.name, message);
  
  return token;
};

// Method to accept invitation
teamSchema.methods.acceptInvitation = async function(token, userId) {
  const invitation = this.invitations.find(inv => 
    inv.token === token && inv.status === 'pending' && inv.expiresAt > new Date()
  );
  
  if (!invitation) {
    throw new Error('Invalid or expired invitation');
  }
  
  // Add user as member
  await this.addMember(userId, invitation.role, invitation.permissions);
  
  // Update invitation status
  invitation.status = 'accepted';
  invitation.acceptedAt = new Date();
  
  return this.save();
};

// Method to calculate team productivity score
teamSchema.methods.calculateProductivityScore = function() {
  if (this.members.length === 0) return 0;
  
  const activeMembers = this.members.filter(m => m.status === 'active');
  if (activeMembers.length === 0) return 0;
  
  // Calculate average member metrics
  const totalReliability = activeMembers.reduce((sum, m) => sum + (m.metrics.reliabilityScore || 0), 0);
  const totalCollaboration = activeMembers.reduce((sum, m) => sum + (m.metrics.collaborationScore || 0), 0);
  
  const avgReliability = totalReliability / activeMembers.length;
  const avgCollaboration = totalCollaboration / activeMembers.length;
  
  // Combine with team-level metrics
  const productivityScore = (
    (avgReliability * 0.4) +
    (avgCollaboration * 0.3) +
    (this.analytics.performance.productivity.onTimeDeliveryRate * 0.3)
  );
  
  return Math.round(productivityScore);
};

// Method to update member activity
teamSchema.methods.updateMemberActivity = async function(userId, activityData) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member) return;
  
  // Update metrics based on activity
  if (activityData.taskCompleted) {
    member.metrics.tasksCompleted++;
  }
  
  if (activityData.taskAssigned) {
    member.metrics.tasksAssigned++;
  }
  
  member.metrics.lastActive = new Date();
  
  return this.save();
};

// Method to generate team report
teamSchema.methods.generateReport = async function(period = 'monthly') {
  const Task = mongoose.model('Task');
  const Goal = mongoose.model('Goal');
  
  // Calculate date range based on period
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'weekly':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarterly':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'yearly':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }
  
  const memberIds = this.members.map(m => m.user);
  
  // Get team tasks for the period
  const tasks = await Task.find({
    user: { $in: memberIds },
    createdAt: { $gte: startDate, $lte: endDate },
  });
  
  // Get team goals for the period
  const goals = await Goal.find({
    user: { $in: memberIds },
    'timeframe.startDate': { $gte: startDate },
  });
  
  // Calculate metrics
  const report = {
    period: { start: startDate, end: endDate },
    team: {
      name: this.name,
      memberCount: this.activeMembersCount,
    },
    tasks: {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      overdue: tasks.filter(t => t.deadline && new Date() > t.deadline && !t.completed).length,
      avgCompletionTime: this.calculateAvgCompletionTime(tasks),
    },
    goals: {
      total: goals.length,
      completed: goals.filter(g => g.status === 'completed').length,
      onTrack: goals.filter(g => g.measurement.progress.percentage >= 50).length,
    },
    productivity: this.calculateProductivityScore(),
    topPerformers: this.getTopPerformers(),
    insights: this.generateInsights(tasks, goals),
  };
  
  return report;
};

// Helper method to calculate average completion time
teamSchema.methods.calculateAvgCompletionTime = function(tasks) {
  const completedTasks = tasks.filter(t => t.completed && t.actualDuration);
  if (completedTasks.length === 0) return 0;
  
  const totalTime = completedTasks.reduce((sum, t) => sum + t.actualDuration, 0);
  return Math.round(totalTime / completedTasks.length);
};

// Helper method to get top performers
teamSchema.methods.getTopPerformers = function() {
  return this.members
    .filter(m => m.status === 'active')
    .sort((a, b) => {
      const scoreA = (a.metrics.reliabilityScore + a.metrics.collaborationScore) / 2;
      const scoreB = (b.metrics.reliabilityScore + b.metrics.collaborationScore) / 2;
      return scoreB - scoreA;
    })
    .slice(0, 5)
    .map(m => ({
      user: m.user,
      score: Math.round((m.metrics.reliabilityScore + m.metrics.collaborationScore) / 2),
      tasksCompleted: m.metrics.tasksCompleted,
    }));
};

// Helper method to generate insights
teamSchema.methods.generateInsights = function(tasks, goals) {
  const insights = [];
  
  // Task completion insights
  const completionRate = tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0;
  
  if (completionRate > 85) {
    insights.push({
      type: 'positive',
      message: 'Team has excellent task completion rate',
      value: `${completionRate.toFixed(1)}%`,
    });
  } else if (completionRate < 60) {
    insights.push({
      type: 'warning',
      message: 'Task completion rate needs improvement',
      value: `${completionRate.toFixed(1)}%`,
    });
  }
  
  // Goal progress insights
  const goalsOnTrack = goals.filter(g => g.measurement.progress.percentage >= 75).length;
  if (goals.length > 0 && (goalsOnTrack / goals.length) > 0.8) {
    insights.push({
      type: 'positive',
      message: 'Most team goals are on track',
      value: `${goalsOnTrack}/${goals.length}`,
    });
  }
  
  // Collaboration insights
  const avgCollaboration = this.members.reduce((sum, m) => sum + (m.metrics.collaborationScore || 0), 0) / this.members.length;
  if (avgCollaboration > 80) {
    insights.push({
      type: 'positive',
      message: 'Strong team collaboration',
      value: `${avgCollaboration.toFixed(0)}/100`,
    });
  }
  
  return insights;
};

// Static method to find teams by member
teamSchema.statics.findByMember = function(userId) {
  return this.find({
    'members.user': userId,
    'members.status': 'active',
    status: 'active',
  });
};

// Static method to find public teams
teamSchema.statics.findPublic = function() {
  return this.find({
    'settings.privacy.visibility': 'public',
    status: 'active',
  });
};

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;