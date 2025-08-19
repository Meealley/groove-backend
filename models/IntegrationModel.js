const mongoose = require("mongoose");

const integrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Integration service details
    service: {
      type: String,
      enum: [
        "google_calendar",
        "google_drive",
        "microsoft_outlook",
        "microsoft_teams",
        "slack",
        "trello",
        "asana",
        "jira",
        "notion",
        "todoist",
        "zapier",
        "ifttt",
        "github",
        "gitlab",
        "figma",
        "zoom",
        "calendly",
        "spotify",
        "weather_api",
        "location_services",
        "email_smtp",
        "sms_provider",
        "webhook_custom"
      ],
      required: true,
    },
    // Service display information
    serviceInfo: {
      displayName: String,
      description: String,
      category: {
        type: String,
        enum: [
          "calendar",
          "storage",
          "communication",
          "project_management", 
          "productivity",
          "automation",
          "development",
          "design",
          "media",
          "utilities",
          "custom"
        ],
      },
      icon: String,
      color: String,
      website: String,
    },
    // Authentication configuration
    auth: {
      type: {
        type: String,
        enum: ["oauth2", "api_key", "basic_auth", "bearer_token", "webhook", "none"],
        required: true,
      },
      // OAuth2 configuration
      oauth: {
        clientId: String,
        clientSecret: String, // Should be encrypted
        accessToken: String,  // Should be encrypted
        refreshToken: String, // Should be encrypted
        tokenExpiry: Date,
        scopes: [String],
        authUrl: String,
        tokenUrl: String,
      },
      // API Key configuration
      apiKey: {
        key: String, // Should be encrypted
        keyName: String, // e.g., "X-API-Key"
        location: {
          type: String,
          enum: ["header", "query", "body"],
          default: "header",
        },
      },
      // Basic Auth configuration
      basicAuth: {
        username: String,
        password: String, // Should be encrypted
      },
      // Bearer Token configuration
      bearerToken: {
        token: String, // Should be encrypted
      },
      // Webhook configuration
      webhook: {
        url: String,
        secret: String, // Should be encrypted
        events: [String],
      },
    },
    // Integration status
    status: {
      type: String,
      enum: ["active", "inactive", "error", "pending", "expired", "suspended"],
      default: "pending",
    },
    // Configuration and settings
    config: {
      // Sync settings
      sync: {
        enabled: {
          type: Boolean,
          default: true,
        },
        direction: {
          type: String,
          enum: ["bidirectional", "import_only", "export_only"],
          default: "bidirectional",
        },
        frequency: {
          type: String,
          enum: ["real_time", "every_5min", "every_15min", "hourly", "daily", "manual"],
          default: "every_15min",
        },
        lastSync: Date,
        nextSync: Date,
      },
      // Data mapping configuration
      mapping: {
        // Field mappings between services
        fields: [{
          localField: String,
          externalField: String,
          transformation: String, // JS function as string for data transformation
          required: Boolean,
        }],
        // Custom mapping rules
        rules: [{
          condition: String, // JS condition as string
          action: String,    // Action to take
          priority: Number,
        }],
      },
      // Filtering settings
      filters: {
        // Import filters
        import: {
          dateRange: {
            start: Date,
            end: Date,
          },
          keywords: [String],
          categories: [String],
          exclude: [String],
        },
        // Export filters
        export: {
          categories: [String],
          priorities: [String],
          tags: [String],
          exclude: [String],
        },
      },
      // Feature-specific settings
      features: {
        // Calendar integration specific
        calendar: {
          defaultCalendar: String,
          createEvents: Boolean,
          updateEvents: Boolean,
          deleteEvents: Boolean,
          syncReminders: Boolean,
          conflictResolution: {
            type: String,
            enum: ["local_wins", "external_wins", "manual_resolve", "merge"],
            default: "manual_resolve",
          },
        },
        // Task management integration specific
        tasks: {
          defaultProject: String,
          syncSubtasks: Boolean,
          syncProgress: Boolean,
          syncComments: Boolean,
          createProjects: Boolean,
        },
        // Communication integration specific
        communication: {
          channels: [String],
          notificationTypes: [String],
          mentionHandling: Boolean,
          autoRespond: Boolean,
        },
        // File storage integration specific
        storage: {
          rootFolder: String,
          autoUpload: Boolean,
          syncMetadata: Boolean,
          conflictResolution: String,
        },
      },
    },
    // Performance and monitoring
    performance: {
      // API usage statistics
      apiUsage: {
        totalRequests: {
          type: Number,
          default: 0,
        },
        successfulRequests: {
          type: Number,
          default: 0,
        },
        failedRequests: {
          type: Number,
          default: 0,
        },
        rateLimitHits: {
          type: Number,
          default: 0,
        },
        avgResponseTime: {
          type: Number,
          default: 0,
        },
        lastRequestTime: Date,
      },
      // Sync statistics
      syncStats: {
        totalSyncs: {
          type: Number,
          default: 0,
        },
        successfulSyncs: {
          type: Number,
          default: 0,
        },
        failedSyncs: {
          type: Number,
          default: 0,
        },
        itemsSynced: {
          type: Number,
          default: 0,
        },
        lastSyncDuration: Number, // milliseconds
        avgSyncDuration: Number,
      },
      // Health metrics
      health: {
        score: {
          type: Number,
          min: 0,
          max: 100,
          default: 100,
        },
        uptime: {
          type: Number,
          min: 0,
          max: 100,
          default: 100,
        },
        reliability: {
          type: Number,
          min: 0,
          max: 100,
          default: 100,
        },
        lastHealthCheck: Date,
      },
    },
    // Error handling and logging
    errors: [{
      timestamp: Date,
      type: {
        type: String,
        enum: [
          "auth_error",
          "api_error", 
          "sync_error",
          "rate_limit",
          "network_error",
          "data_error",
          "config_error"
        ],
      },
      message: String,
      details: Object, // Error details
      resolved: {
        type: Boolean,
        default: false,
      },
      resolvedAt: Date,
      resolution: String,
    }],
    // Sync history and logs
    syncHistory: [{
      timestamp: Date,
      direction: {
        type: String,
        enum: ["import", "export", "bidirectional"],
      },
      status: {
        type: String,
        enum: ["success", "partial", "failed"],
      },
      itemsProcessed: Number,
      itemsSuccessful: Number,
      itemsFailed: Number,
      duration: Number, // milliseconds
      details: {
        added: Number,
        updated: Number,
        deleted: Number,
        skipped: Number,
      },
      conflicts: [{
        item: String,
        type: String,
        resolution: String,
      }],
    }],
    // Webhook handling
    webhooks: {
      enabled: {
        type: Boolean,
        default: false,
      },
      endpoint: String,
      events: [String],
      retryPolicy: {
        maxRetries: {
          type: Number,
          default: 3,
        },
        backoffMultiplier: {
          type: Number,
          default: 2,
        },
        initialDelay: {
          type: Number,
          default: 1000,
        },
      },
      security: {
        verifySignature: Boolean,
        allowedIPs: [String],
        requireHttps: Boolean,
      },
    },
    // Data transformation and business logic
    transformations: [{
      name: String,
      description: String,
      type: {
        type: String,
        enum: ["import", "export", "bidirectional"],
      },
      code: String, // JavaScript transformation function
      enabled: Boolean,
      testCases: [{
        input: Object,
        expectedOutput: Object,
        description: String,
      }],
    }],
    // Advanced features
    advanced: {
      // Custom API endpoints
      customEndpoints: [{
        name: String,
        url: String,
        method: {
          type: String,
          enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        },
        headers: Object,
        parameters: Object,
        enabled: Boolean,
      }],
      // Automation rules
      automationRules: [{
        trigger: {
          type: String,
          enum: ["data_change", "time_based", "external_event", "user_action"],
        },
        condition: String, // JavaScript condition
        action: String,    // JavaScript action
        enabled: Boolean,
        lastExecuted: Date,
        executionCount: Number,
      }],
      // Data validation rules
      validationRules: [{
        field: String,
        rule: String, // JavaScript validation function
        errorMessage: String,
        enabled: Boolean,
      }],
    },
    // Integration metadata
    metadata: {
      version: String,
      integrationVersion: String,
      createdBy: String,
      tags: [String],
      notes: String,
      // Custom properties
      customProperties: Object,
    },
    // User preferences
    userPreferences: {
      notifications: {
        syncSuccess: Boolean,
        syncFailure: Boolean,
        authExpiry: Boolean,
        quotaWarning: Boolean,
      },
      ui: {
        showInSidebar: Boolean,
        iconPosition: String,
        customName: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
integrationSchema.index({ user: 1, service: 1 }, { unique: true });
integrationSchema.index({ user: 1, status: 1 });
integrationSchema.index({ "config.sync.nextSync": 1 });
integrationSchema.index({ service: 1, status: 1 });

// Pre-save middleware to encrypt sensitive data
integrationSchema.pre('save', function(next) {
  // In production, implement proper encryption for sensitive fields
  // This is a placeholder for the encryption logic
  if (this.isModified('auth.oauth.accessToken')) {
    // this.auth.oauth.accessToken = encrypt(this.auth.oauth.accessToken);
  }
  if (this.isModified('auth.apiKey.key')) {
    // this.auth.apiKey.key = encrypt(this.auth.apiKey.key);
  }
  next();
});

// Method to test connection
integrationSchema.methods.testConnection = async function() {
  try {
    const result = await this.makeAPIRequest('GET', '/test', {});
    
    this.performance.health.score = 100;
    this.performance.health.lastHealthCheck = new Date();
    this.status = 'active';
    
    await this.save();
    return { success: true, message: 'Connection successful' };
    
  } catch (error) {
    this.errors.push({
      timestamp: new Date(),
      type: 'api_error',
      message: error.message,
      details: { endpoint: '/test' },
    });
    
    this.performance.health.score = Math.max(0, this.performance.health.score - 20);
    this.status = 'error';
    
    await this.save();
    return { success: false, message: error.message };
  }
};

// Method to make API requests
integrationSchema.methods.makeAPIRequest = async function(method, endpoint, data = {}) {
  const startTime = Date.now();
  
  try {
    // Build request configuration based on auth type
    const requestConfig = this.buildRequestConfig(method, endpoint, data);
    
    // Make the actual API request (using axios or similar)
    // const response = await axios(requestConfig);
    
    // Update performance metrics
    this.performance.apiUsage.totalRequests++;
    this.performance.apiUsage.successfulRequests++;
    this.performance.apiUsage.lastRequestTime = new Date();
    this.performance.apiUsage.avgResponseTime = 
      (this.performance.apiUsage.avgResponseTime + (Date.now() - startTime)) / 2;
    
    await this.save();
    
    // Return mock response for example
    return { data: { success: true }, status: 200 };
    
  } catch (error) {
    this.performance.apiUsage.totalRequests++;
    this.performance.apiUsage.failedRequests++;
    
    if (error.response?.status === 429) {
      this.performance.apiUsage.rateLimitHits++;
    }
    
    this.errors.push({
      timestamp: new Date(),
      type: this.categorizeError(error),
      message: error.message,
      details: { method, endpoint, status: error.response?.status },
    });
    
    await this.save();
    throw error;
  }
};

// Helper method to build request configuration
integrationSchema.methods.buildRequestConfig = function(method, endpoint, data) {
  const config = {
    method,
    url: `${this.getBaseURL()}${endpoint}`,
    data,
    headers: {},
  };
  
  // Add authentication based on type
  switch (this.auth.type) {
    case 'oauth2':
      config.headers['Authorization'] = `Bearer ${this.auth.oauth.accessToken}`;
      break;
    case 'api_key':
      if (this.auth.apiKey.location === 'header') {
        config.headers[this.auth.apiKey.keyName] = this.auth.apiKey.key;
      } else if (this.auth.apiKey.location === 'query') {
        config.params = { [this.auth.apiKey.keyName]: this.auth.apiKey.key };
      }
      break;
    case 'basic_auth':
      const credentials = Buffer.from(`${this.auth.basicAuth.username}:${this.auth.basicAuth.password}`).toString('base64');
      config.headers['Authorization'] = `Basic ${credentials}`;
      break;
    case 'bearer_token':
      config.headers['Authorization'] = `Bearer ${this.auth.bearerToken.token}`;
      break;
  }
  
  return config;
};

// Helper method to get base URL for service
integrationSchema.methods.getBaseURL = function() {
  const baseURLs = {
    google_calendar: 'https://www.googleapis.com/calendar/v3',
    google_drive: 'https://www.googleapis.com/drive/v3',
    microsoft_outlook: 'https://graph.microsoft.com/v1.0',
    slack: 'https://slack.com/api',
    trello: 'https://api.trello.com/1',
    asana: 'https://app.asana.com/api/1.0',
    jira: 'https://your-domain.atlassian.net/rest/api/3',
    notion: 'https://api.notion.com/v1',
    github: 'https://api.github.com',
    // Add more service URLs as needed
  };
  
  return baseURLs[this.service] || '';
};

// Helper method to categorize errors
integrationSchema.methods.categorizeError = function(error) {
  if (error.response?.status === 401 || error.response?.status === 403) {
    return 'auth_error';
  } else if (error.response?.status === 429) {
    return 'rate_limit';
  } else if (error.response?.status >= 500) {
    return 'api_error';
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return 'network_error';
  } else {
    return 'api_error';
  }
};

// Method to perform sync operation
integrationSchema.methods.performSync = async function(direction = 'bidirectional') {
  const syncStart = Date.now();
  const syncRecord = {
    timestamp: new Date(),
    direction,
    status: 'success',
    itemsProcessed: 0,
    itemsSuccessful: 0,
    itemsFailed: 0,
    details: { added: 0, updated: 0, deleted: 0, skipped: 0 },
    conflicts: [],
  };
  
  try {
    // Update sync status
    this.config.sync.lastSync = new Date();
    this.performance.syncStats.totalSyncs++;
    
    // Perform the actual sync based on service type
    let syncResult;
    
    switch (this.service) {
      case 'google_calendar':
        syncResult = await this.syncGoogleCalendar(direction);
        break;
      case 'trello':
        syncResult = await this.syncTrello(direction);
        break;
      case 'slack':
        syncResult = await this.syncSlack(direction);
        break;
      default:
        syncResult = await this.genericSync(direction);
    }
    
    // Update sync record with results
    Object.assign(syncRecord, syncResult);
    syncRecord.duration = Date.now() - syncStart;
    
    // Update performance metrics
    this.performance.syncStats.successfulSyncs++;
    this.performance.syncStats.itemsSynced += syncRecord.itemsSuccessful;
    this.performance.syncStats.lastSyncDuration = syncRecord.duration;
    this.performance.syncStats.avgSyncDuration = 
      (this.performance.syncStats.avgSyncDuration + syncRecord.duration) / 2;
    
    // Schedule next sync
    this.scheduleNextSync();
    
  } catch (error) {
    syncRecord.status = 'failed';
    syncRecord.duration = Date.now() - syncStart;
    
    this.performance.syncStats.failedSyncs++;
    this.errors.push({
      timestamp: new Date(),
      type: 'sync_error',
      message: error.message,
      details: { direction },
    });
  }
  
  this.syncHistory.push(syncRecord);
  
  // Keep only last 50 sync records
  if (this.syncHistory.length > 50) {
    this.syncHistory = this.syncHistory.slice(-50);
  }
  
  await this.save();
  return syncRecord;
};

// Method to schedule next sync
integrationSchema.methods.scheduleNextSync = function() {
  if (!this.config.sync.enabled) return;
  
  const now = new Date();
  let nextSync = new Date(now);
  
  switch (this.config.sync.frequency) {
    case 'every_5min':
      nextSync.setMinutes(nextSync.getMinutes() + 5);
      break;
    case 'every_15min':
      nextSync.setMinutes(nextSync.getMinutes() + 15);
      break;
    case 'hourly':
      nextSync.setHours(nextSync.getHours() + 1);
      break;
    case 'daily':
      nextSync.setDate(nextSync.getDate() + 1);
      break;
    default:
      return; // Manual or real-time sync
  }
  
  this.config.sync.nextSync = nextSync;
};

// Service-specific sync methods
integrationSchema.methods.syncGoogleCalendar = async function(direction) {
  const Task = mongoose.model('Task');
  const Schedule = mongoose.model('Schedule');
  
  let result = {
    itemsProcessed: 0,
    itemsSuccessful: 0,
    itemsFailed: 0,
    details: { added: 0, updated: 0, deleted: 0, skipped: 0 },
  };
  
  if (direction === 'import' || direction === 'bidirectional') {
    // Import events from Google Calendar
    try {
      const events = await this.makeAPIRequest('GET', '/events');
      
      for (const event of events.data.items || []) {
        try {
          const existingSchedule = await Schedule.findOne({
            'integrations.googleCalendarEventId': event.id,
          });
          
          if (existingSchedule) {
            // Update existing
            result.details.updated++;
          } else {
            // Create new schedule/task
            result.details.added++;
          }
          
          result.itemsSuccessful++;
        } catch (error) {
          result.itemsFailed++;
        }
        result.itemsProcessed++;
      }
    } catch (error) {
      throw new Error(`Failed to import from Google Calendar: ${error.message}`);
    }
  }
  
  if (direction === 'export' || direction === 'bidirectional') {
    // Export tasks/schedules to Google Calendar
    const schedules = await Schedule.find({
      user: this.user,
      'integrations.syncStatus': { $ne: 'synced' },
    });
    
    for (const schedule of schedules) {
      try {
        const eventData = this.transformScheduleToCalendarEvent(schedule);
        
        if (schedule.integrations.googleCalendarEventId) {
          // Update existing event
          await this.makeAPIRequest('PUT', `/events/${schedule.integrations.googleCalendarEventId}`, eventData);
          result.details.updated++;
        } else {
          // Create new event
          const response = await this.makeAPIRequest('POST', '/events', eventData);
          schedule.integrations.googleCalendarEventId = response.data.id;
          result.details.added++;
        }
        
        schedule.integrations.syncStatus = 'synced';
        schedule.integrations.lastSyncAt = new Date();
        await schedule.save();
        
        result.itemsSuccessful++;
      } catch (error) {
        result.itemsFailed++;
      }
      result.itemsProcessed++;
    }
  }
  
  return result;
};

// Generic sync method for services without specific implementation
integrationSchema.methods.genericSync = async function(direction) {
  return {
    itemsProcessed: 0,
    itemsSuccessful: 0,
    itemsFailed: 0,
    details: { added: 0, updated: 0, deleted: 0, skipped: 0 },
  };
};

// Helper method to transform schedule to calendar event
integrationSchema.methods.transformScheduleToCalendarEvent = function(schedule) {
  return {
    summary: schedule.task?.title || 'Task',
    description: schedule.task?.description || '',
    start: {
      dateTime: schedule.scheduledStart.toISOString(),
    },
    end: {
      dateTime: schedule.scheduledEnd.toISOString(),
    },
  };
};

// Method to refresh authentication tokens
integrationSchema.methods.refreshAuth = async function() {
  if (this.auth.type !== 'oauth2') {
    throw new Error('Token refresh only supported for OAuth2');
  }
  
  if (!this.auth.oauth.refreshToken) {
    throw new Error('No refresh token available');
  }
  
  try {
    // Make refresh token request
    const refreshData = {
      grant_type: 'refresh_token',
      refresh_token: this.auth.oauth.refreshToken,
      client_id: this.auth.oauth.clientId,
      client_secret: this.auth.oauth.clientSecret,
    };
    
    // const response = await axios.post(this.auth.oauth.tokenUrl, refreshData);
    
    // Update tokens (mock response)
    this.auth.oauth.accessToken = 'new_access_token';
    this.auth.oauth.tokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    this.status = 'active';
    
    await this.save();
    return true;
    
  } catch (error) {
    this.status = 'expired';
    this.errors.push({
      timestamp: new Date(),
      type: 'auth_error',
      message: `Token refresh failed: ${error.message}`,
    });
    
    await this.save();
    throw error;
  }
};

// Static method to find integrations due for sync
integrationSchema.statics.findDueForSync = function() {
  return this.find({
    status: 'active',
    'config.sync.enabled': true,
    'config.sync.nextSync': { $lte: new Date() },
  });
};

// Static method to clean up old sync history
integrationSchema.statics.cleanupSyncHistory = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  await this.updateMany(
    {},
    {
      $pull: {
        syncHistory: { timestamp: { $lt: cutoffDate } },
        errors: { timestamp: { $lt: cutoffDate } },
      },
    }
  );
};

const Integration = mongoose.model("Integration", integrationSchema);

module.exports = Integration;