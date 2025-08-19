const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    // Report identification
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    
    // Report ownership and access
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    
    // Report categorization
    category: {
      type: String,
      enum: [
        "productivity",
        "performance",
        "project_status",
        "time_tracking",
        "goal_progress",
        "team_analytics",
        "financial",
        "compliance",
        "executive_summary",
        "operational",
        "custom"
      ],
      required: true,
    },
    
    type: {
      type: String,
      enum: [
        "dashboard",
        "detailed_report",
        "summary",
        "comparison",
        "trend_analysis",
        "forecast",
        "audit_report",
        "status_report",
        "executive_brief"
      ],
      required: true,
    },
    
    tags: [String],
    
    // Report configuration
    configuration: {
      // Data sources
      dataSources: [{
        source: {
          type: String,
          enum: [
            "tasks",
            "projects", 
            "goals",
            "time_tracking",
            "users",
            "teams",
            "analytics",
            "integrations",
            "custom_query"
          ],
          required: true,
        },
        
        // Filters for the data source
        filters: {
          dateRange: {
            start: Date,
            end: Date,
            period: {
              type: String,
              enum: ["today", "yesterday", "this_week", "last_week", "this_month", "last_month", "this_quarter", "last_quarter", "this_year", "last_year", "custom"],
            },
          },
          
          entities: {
            users: [{
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            }],
            teams: [{
              type: mongoose.Schema.Types.ObjectId,
              ref: "Team",
            }],
            projects: [{
              type: mongoose.Schema.Types.ObjectId,
              ref: "Project",
            }],
            categories: [{
              type: mongoose.Schema.Types.ObjectId,
              ref: "Category",
            }],
          },
          
          conditions: [{
            field: String,
            operator: {
              type: String,
              enum: ["equals", "not_equals", "greater_than", "less_than", "contains", "starts_with", "in", "not_in"],
            },
            value: mongoose.Schema.Types.Mixed,
          }],
          
          aggregation: {
            groupBy: [String],
            having: [{
              field: String,
              operator: String,
              value: mongoose.Schema.Types.Mixed,
            }],
          },
        },
        
        // Custom query for advanced users
        customQuery: {
          collection: String,
          pipeline: [Object], // MongoDB aggregation pipeline
          sql: String,        // SQL query for SQL data sources
        },
        
        // Data transformation
        transformation: {
          calculations: [{
            name: String,
            formula: String,
            type: {
              type: String,
              enum: ["sum", "avg", "count", "min", "max", "percentage", "custom"],
            },
          }],
          
          formatting: [{
            field: String,
            format: {
              type: String,
              enum: ["number", "currency", "percentage", "date", "duration"],
            },
            options: Object,
          }],
        },
      }],
      
      // Report layout and visualization
      layout: {
        format: {
          type: String,
          enum: ["dashboard", "document", "spreadsheet", "presentation"],
          default: "dashboard",
        },
        
        // Page settings
        page: {
          size: {
            type: String,
            enum: ["A4", "A3", "letter", "legal", "custom"],
            default: "A4",
          },
          orientation: {
            type: String,
            enum: ["portrait", "landscape"],
            default: "portrait",
          },
          margins: {
            top: Number,
            right: Number,
            bottom: Number,
            left: Number,
          },
        },
        
        // Sections and components
        sections: [{
          id: String,
          name: String,
          type: {
            type: String,
            enum: [
              "header",
              "footer", 
              "summary",
              "chart",
              "table",
              "kpi",
              "text",
              "image",
              "spacer",
              "page_break"
            ],
          },
          
          position: {
            row: Number,
            column: Number,
            width: Number,
            height: Number,
          },
          
          config: {
            // Chart configuration
            chart: {
              type: {
                type: String,
                enum: [
                  "line",
                  "bar", 
                  "pie",
                  "doughnut",
                  "area",
                  "scatter",
                  "bubble",
                  "radar",
                  "polar",
                  "gauge",
                  "treemap",
                  "heatmap"
                ],
              },
              dataSource: String, // Reference to data source
              xAxis: {
                field: String,
                label: String,
                type: String,
              },
              yAxis: {
                field: String,
                label: String,
                type: String,
              },
              series: [{
                field: String,
                label: String,
                color: String,
                type: String,
              }],
              options: Object, // Chart-specific options
            },
            
            // Table configuration
            table: {
              dataSource: String,
              columns: [{
                field: String,
                header: String,
                width: Number,
                alignment: String,
                format: Object,
                sortable: Boolean,
                filterable: Boolean,
              }],
              pagination: {
                enabled: Boolean,
                pageSize: Number,
              },
              sorting: {
                field: String,
                direction: String,
              },
              totals: {
                enabled: Boolean,
                fields: [String],
              },
            },
            
            // KPI configuration
            kpi: {
              value: {
                dataSource: String,
                field: String,
                calculation: String,
              },
              label: String,
              format: Object,
              target: Number,
              comparison: {
                enabled: Boolean,
                value: Number,
                period: String,
              },
              trend: {
                enabled: Boolean,
                direction: String,
                percentage: Number,
              },
              color: {
                positive: String,
                negative: String,
                neutral: String,
              },
            },
            
            // Text configuration
            text: {
              content: String,
              variables: [String], // Dynamic variables to replace
              formatting: {
                fontSize: Number,
                fontFamily: String,
                fontWeight: String,
                color: String,
                alignment: String,
              },
            },
            
            // Styling
            style: {
              backgroundColor: String,
              borderColor: String,
              borderWidth: Number,
              borderRadius: Number,
              padding: {
                top: Number,
                right: Number,
                bottom: Number,
                left: Number,
              },
              margin: {
                top: Number,
                right: Number,
                bottom: Number,
                left: Number,
              },
            },
          },
        }],
        
        // Global styling
        theme: {
          name: String,
          colors: {
            primary: String,
            secondary: String,
            accent: String,
            background: String,
            text: String,
          },
          fonts: {
            heading: String,
            body: String,
            monospace: String,
          },
        },
      },
      
      // Interactive features
      interactivity: {
        // Drill-down capabilities
        drillDown: {
          enabled: Boolean,
          levels: [{
            field: String,
            reportId: String, // Report to navigate to
          }],
        },
        
        // Filtering
        filters: {
          enabled: Boolean,
          filters: [{
            field: String,
            type: String,
            options: [String],
            defaultValue: mongoose.Schema.Types.Mixed,
          }],
        },
        
        // Real-time updates
        realTime: {
          enabled: Boolean,
          refreshInterval: Number, // seconds
          autoRefresh: Boolean,
        },
      },
    },
    
    // Report scheduling and automation
    scheduling: {
      // Automatic generation
      automated: {
        enabled: {
          type: Boolean,
          default: false,
        },
        
        schedule: {
          frequency: {
            type: String,
            enum: ["daily", "weekly", "monthly", "quarterly", "yearly", "custom"],
          },
          cron: String, // Cron expression for custom scheduling
          timezone: String,
          
          // Schedule constraints
          startDate: Date,
          endDate: Date,
          maxRuns: Number,
        },
        
        // Distribution settings
        distribution: {
          enabled: Boolean,
          recipients: [{
            type: {
              type: String,
              enum: ["user", "team", "email", "webhook"],
            },
            value: String,
            format: {
              type: String,
              enum: ["pdf", "excel", "csv", "json", "html"],
            },
          }],
          
          // Email settings
          email: {
            subject: String,
            body: String,
            attachReport: Boolean,
            embedCharts: Boolean,
          },
        },
      },
      
      // Execution history
      executions: [{
        executedAt: Date,
        status: {
          type: String,
          enum: ["success", "failed", "partial"],
        },
        duration: Number, // milliseconds
        generatedFileId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "File",
        },
        error: String,
        distributionResults: [{
          recipient: String,
          status: String,
          sentAt: Date,
          error: String,
        }],
      }],
    },
    
    // Generated report data
    data: {
      // Last generated data
      lastGenerated: {
        generatedAt: Date,
        generatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        parameters: Object, // Parameters used for generation
        
        // Raw data
        datasets: [{
          name: String,
          source: String,
          data: [Object],
          metadata: {
            totalRows: Number,
            columns: [String],
            generatedAt: Date,
            executionTime: Number,
          },
        }],
        
        // Processed data for visualizations
        processed: {
          charts: [{
            sectionId: String,
            data: Object,
            config: Object,
          }],
          
          tables: [{
            sectionId: String,
            data: [Object],
            pagination: Object,
          }],
          
          kpis: [{
            sectionId: String,
            value: mongoose.Schema.Types.Mixed,
            formattedValue: String,
            comparison: Object,
            trend: Object,
          }],
        },
        
        // Generation performance
        performance: {
          dataFetchTime: Number,
          processingTime: Number,
          renderTime: Number,
          totalTime: Number,
          cacheHit: Boolean,
        },
      },
      
      // Data cache
      cache: {
        enabled: {
          type: Boolean,
          default: true,
        },
        ttl: {
          type: Number,
          default: 3600, // 1 hour in seconds
        },
        lastCached: Date,
        cacheKey: String,
      },
    },
    
    // Report sharing and permissions
    sharing: {
      // Visibility settings
      visibility: {
        type: String,
        enum: ["private", "team", "organization", "public"],
        default: "private",
      },
      
      // Specific user permissions
      permissions: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        permission: {
          type: String,
          enum: ["view", "edit", "admin"],
          default: "view",
        },
        grantedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        grantedAt: Date,
        expiresAt: Date,
      }],
      
      // Public sharing
      publicShare: {
        enabled: {
          type: Boolean,
          default: false,
        },
        token: String,
        expiresAt: Date,
        allowedDomains: [String],
        passwordProtected: Boolean,
        password: String, // Hashed
        viewCount: {
          type: Number,
          default: 0,
        },
      },
      
      // Export and download
      exports: [{
        format: {
          type: String,
          enum: ["pdf", "excel", "csv", "json", "html", "png", "jpg"],
        },
        generatedAt: Date,
        generatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        fileId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "File",
        },
        downloadCount: {
          type: Number,
          default: 0,
        },
        expiresAt: Date,
      }],
    },
    
    // Analytics and usage tracking
    analytics: {
      // View statistics
      views: {
        totalViews: {
          type: Number,
          default: 0,
        },
        uniqueViews: {
          type: Number,
          default: 0,
        },
        lastViewed: Date,
        
        // Detailed view log
        viewLog: [{
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          viewedAt: Date,
          duration: Number, // seconds
          ipAddress: String,
          userAgent: String,
        }],
      },
      
      // Usage patterns
      usage: {
        generationCount: {
          type: Number,
          default: 0,
        },
        avgGenerationTime: Number,
        peakUsageHours: [Number],
        
        // Usage by time period
        dailyUsage: [{
          date: Date,
          views: Number,
          generations: Number,
          exports: Number,
        }],
      },
      
      // Performance metrics
      performance: {
        avgLoadTime: Number,
        errorRate: Number,
        cacheHitRate: Number,
        
        // Performance history
        performanceHistory: [{
          date: Date,
          loadTime: Number,
          dataFetchTime: Number,
          renderTime: Number,
        }],
      },
      
      // User engagement
      engagement: {
        bookmarkCount: {
          type: Number,
          default: 0,
        },
        shareCount: {
          type: Number,
          default: 0,
        },
        commentCount: {
          type: Number,
          default: 0,
        },
        
        // User feedback
        ratings: [{
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          rating: {
            type: Number,
            min: 1,
            max: 5,
          },
          feedback: String,
          ratedAt: Date,
        }],
        averageRating: Number,
      },
    },
    
    // Report status and lifecycle
    status: {
      type: String,
      enum: ["draft", "active", "archived", "deprecated"],
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
        configSnapshot: Object,
      }],
    },
    
    // AI and machine learning
    ai: {
      // Auto-insights
      insights: [{
        type: {
          type: String,
          enum: ["trend", "anomaly", "correlation", "prediction", "recommendation"],
        },
        title: String,
        description: String,
        confidence: {
          type: Number,
          min: 0,
          max: 1,
        },
        impact: {
          type: String,
          enum: ["low", "medium", "high"],
        },
        discoveredAt: Date,
        dataPoints: [Object],
      }],
      
      // Predictive analytics
      predictions: [{
        metric: String,
        predictedValue: Number,
        confidence: Number,
        timeframe: String,
        basedOn: [String],
        createdAt: Date,
      }],
      
      // Automated recommendations
      recommendations: [{
        type: String,
        recommendation: String,
        reasoning: String,
        priority: {
          type: String,
          enum: ["low", "medium", "high"],
        },
        implemented: {
          type: Boolean,
          default: false,
        },
        createdAt: Date,
      }],
    },
    
    // Integration and data sources
    integrations: [{
      service: String,
      configuration: Object,
      enabled: {
        type: Boolean,
        default: true,
      },
      lastSync: Date,
      syncStatus: {
        type: String,
        enum: ["success", "failed", "pending"],
      },
      error: String,
    }],
    
    // Comments and collaboration
    comments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    }],
    
    // Bookmarks and favorites
    bookmarks: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      bookmarkedAt: Date,
      notes: String,
    }],
    
    // Related reports
    relationships: [{
      report: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Report",
      },
      relationship: {
        type: String,
        enum: ["parent", "child", "related", "template"],
      },
      description: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes
reportSchema.index({ createdBy: 1, status: 1 });
reportSchema.index({ team: 1 });
reportSchema.index({ category: 1, type: 1 });
reportSchema.index({ "sharing.visibility": 1 });
reportSchema.index({ "scheduling.automated.enabled": 1 });
reportSchema.index({ "analytics.views.lastViewed": -1 });

// Virtual for version string
reportSchema.virtual('versionString').get(function() {
  return `${this.version.major}.${this.version.minor}.${this.version.patch}`;
});

// Virtual for is cached
reportSchema.virtual('isCached').get(function() {
  if (!this.data.cache.enabled) return false;
  
  const cacheAge = Date.now() - this.data.cache.lastCached;
  return cacheAge < (this.data.cache.ttl * 1000);
});

// Method to generate report
reportSchema.methods.generate = async function(parameters = {}, userId = null) {
  const startTime = Date.now();
  
  try {
    // Check cache first
    if (this.isCached && !parameters.forceRefresh) {
      return this.data.lastGenerated;
    }
    
    // Fetch data from all sources
    const datasets = await this.fetchData(parameters);
    
    // Process data for visualizations
    const processed = await this.processData(datasets);
    
    // Generate insights
    const insights = await this.generateInsights(datasets);
    
    const generationData = {
      generatedAt: new Date(),
      generatedBy: userId,
      parameters,
      datasets,
      processed,
      performance: {
        totalTime: Date.now() - startTime,
        dataFetchTime: 0, // Would be tracked during fetchData
        processingTime: 0, // Would be tracked during processData
        renderTime: 0, // Would be tracked during rendering
        cacheHit: false,
      },
    };
    
    this.data.lastGenerated = generationData;
    this.data.cache.lastCached = new Date();
    this.analytics.usage.generationCount++;
    
    // Add AI insights
    this.ai.insights.push(...insights);
    
    await this.save();
    
    // Create activity
    if (userId) {
      const Activity = mongoose.model('Activity');
      await Activity.createActivity({
        actor: { user: userId },
        action: {
          type: 'report_generated',
          description: `generated report "${this.title}"`,
          category: 'reporting',
        },
        target: {
          entityType: 'report',
          entityId: this._id,
          entityName: this.title,
        },
      });
    }
    
    return generationData;
    
  } catch (error) {
    throw new Error(`Report generation failed: ${error.message}`);
  }
};

// Method to fetch data from configured sources
reportSchema.methods.fetchData = async function(parameters) {
  const datasets = [];
  
  for (const sourceConfig of this.configuration.dataSources) {
    try {
      let data;
      
      switch (sourceConfig.source) {
        case 'tasks':
          data = await this.fetchTaskData(sourceConfig, parameters);
          break;
        case 'projects':
          data = await this.fetchProjectData(sourceConfig, parameters);
          break;
        case 'time_tracking':
          data = await this.fetchTimeTrackingData(sourceConfig, parameters);
          break;
        case 'analytics':
          data = await this.fetchAnalyticsData(sourceConfig, parameters);
          break;
        default:
          throw new Error(`Unsupported data source: ${sourceConfig.source}`);
      }
      
      datasets.push({
        name: sourceConfig.source,
        source: sourceConfig.source,
        data,
        metadata: {
          totalRows: data.length,
          columns: data.length > 0 ? Object.keys(data[0]) : [],
          generatedAt: new Date(),
        },
      });
      
    } catch (error) {
      console.error(`Error fetching data from ${sourceConfig.source}:`, error);
    }
  }
  
  return datasets;
};

// Method to fetch task data
reportSchema.methods.fetchTaskData = async function(sourceConfig, parameters) {
  const Task = mongoose.model('Task');
  
  const query = this.buildQuery(sourceConfig.filters, parameters);
  
  return Task.find(query)
    .populate('user', 'name email')
    .populate('category', 'name')
    .populate('project', 'name')
    .lean();
};

// Method to fetch project data
reportSchema.methods.fetchProjectData = async function(sourceConfig, parameters) {
  const Project = mongoose.model('Project');
  
  const query = this.buildQuery(sourceConfig.filters, parameters);
  
  return Project.find(query)
    .populate('owner', 'name email')
    .populate('team', 'name')
    .lean();
};

// Method to fetch time tracking data
reportSchema.methods.fetchTimeTrackingData = async function(sourceConfig, parameters) {
  const TimeTracking = mongoose.model('TimeTracking');
  
  const query = this.buildQuery(sourceConfig.filters, parameters);
  
  return TimeTracking.find(query)
    .populate('user', 'name email')
    .populate('task', 'title')
    .populate('project', 'name')
    .lean();
};

// Method to build query from filters
reportSchema.methods.buildQuery = function(filters, parameters) {
  const query = {};
  
  // Date range filter
  if (filters.dateRange) {
    const { start, end, period } = filters.dateRange;
    
    if (period && period !== 'custom') {
      const dates = this.getPeriodDates(period);
      query.createdAt = { $gte: dates.start, $lte: dates.end };
    } else if (start && end) {
      query.createdAt = { $gte: start, $lte: end };
    }
  }
  
  // Entity filters
  if (filters.entities) {
    if (filters.entities.users?.length) {
      query.user = { $in: filters.entities.users };
    }
    if (filters.entities.projects?.length) {
      query.project = { $in: filters.entities.projects };
    }
    if (filters.entities.categories?.length) {
      query.category = { $in: filters.entities.categories };
    }
  }
  
  // Condition filters
  if (filters.conditions) {
    filters.conditions.forEach(condition => {
      const { field, operator, value } = condition;
      
      switch (operator) {
        case 'equals':
          query[field] = value;
          break;
        case 'not_equals':
          query[field] = { $ne: value };
          break;
        case 'greater_than':
          query[field] = { $gt: value };
          break;
        case 'less_than':
          query[field] = { $lt: value };
          break;
        case 'contains':
          query[field] = { $regex: value, $options: 'i' };
          break;
        case 'in':
          query[field] = { $in: value };
          break;
      }
    });
  }
  
  return query;
};

// Method to get dates for predefined periods
reportSchema.methods.getPeriodDates = function(period) {
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_week':
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      break;
    case 'last_week':
      start.setDate(start.getDate() - start.getDay() - 7);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - end.getDay() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'last_month':
      start.setMonth(start.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;
  }
  
  return { start, end };
};

// Method to process data for visualizations
reportSchema.methods.processData = async function(datasets) {
  const processed = {
    charts: [],
    tables: [],
    kpis: [],
  };
  
  // Process each section
  for (const section of this.configuration.layout.sections) {
    switch (section.type) {
      case 'chart':
        processed.charts.push(await this.processChartData(section, datasets));
        break;
      case 'table':
        processed.tables.push(await this.processTableData(section, datasets));
        break;
      case 'kpi':
        processed.kpis.push(await this.processKPIData(section, datasets));
        break;
    }
  }
  
  return processed;
};

// Method to process chart data
reportSchema.methods.processChartData = async function(section, datasets) {
  const dataset = datasets.find(d => d.name === section.config.chart.dataSource);
  if (!dataset) return null;
  
  const chartData = {
    sectionId: section.id,
    config: section.config.chart,
    data: {
      labels: [],
      datasets: [],
    },
  };
  
  // Group data by x-axis field
  const grouped = this.groupBy(dataset.data, section.config.chart.xAxis.field);
  
  chartData.data.labels = Object.keys(grouped);
  
  // Process each series
  section.config.chart.series.forEach(series => {
    const seriesData = chartData.data.labels.map(label => {
      const items = grouped[label];
      return this.calculateAggregation(items, series.field, 'sum');
    });
    
    chartData.data.datasets.push({
      label: series.label,
      data: seriesData,
      backgroundColor: series.color,
    });
  });
  
  return chartData;
};

// Method to process KPI data
reportSchema.methods.processKPIData = async function(section, datasets) {
  const dataset = datasets.find(d => d.name === section.config.kpi.value.dataSource);
  if (!dataset) return null;
  
  const value = this.calculateAggregation(
    dataset.data,
    section.config.kpi.value.field,
    section.config.kpi.value.calculation
  );
  
  return {
    sectionId: section.id,
    value,
    formattedValue: this.formatValue(value, section.config.kpi.format),
    comparison: section.config.kpi.comparison,
    trend: section.config.kpi.trend,
  };
};

// Helper method to group data by field
reportSchema.methods.groupBy = function(data, field) {
  return data.reduce((groups, item) => {
    const key = item[field];
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
};

// Helper method to calculate aggregations
reportSchema.methods.calculateAggregation = function(data, field, type) {
  const values = data.map(item => item[field]).filter(val => val != null);
  
  switch (type) {
    case 'sum':
      return values.reduce((sum, val) => sum + val, 0);
    case 'avg':
      return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    case 'count':
      return values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      return 0;
  }
};

// Helper method to format values
reportSchema.methods.formatValue = function(value, format) {
  if (!format) return value.toString();
  
  switch (format.type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: format.currency || 'USD',
      }).format(value);
    case 'percentage':
      return `${(value * 100).toFixed(format.decimals || 1)}%`;
    case 'number':
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: format.decimals || 0,
        maximumFractionDigits: format.decimals || 0,
      }).format(value);
    default:
      return value.toString();
  }
};

// Method to generate AI insights
reportSchema.methods.generateInsights = async function(datasets) {
  const insights = [];
  
  // This would contain AI/ML logic to analyze data and generate insights
  // For now, implementing basic trend analysis
  
  for (const dataset of datasets) {
    if (dataset.data.length > 1) {
      // Simple trend analysis
      const trend = this.analyzeTrend(dataset.data);
      
      if (trend.direction !== 'stable') {
        insights.push({
          type: 'trend',
          title: `${dataset.source} Trend Analysis`,
          description: `${dataset.source} is showing a ${trend.direction} trend with ${trend.change}% change`,
          confidence: trend.confidence,
          impact: trend.significance > 0.1 ? 'high' : 'medium',
          discoveredAt: new Date(),
          dataPoints: [trend],
        });
      }
    }
  }
  
  return insights;
};

// Helper method to analyze trends
reportSchema.methods.analyzeTrend = function(data) {
  if (data.length < 2) return { direction: 'stable', change: 0, confidence: 0 };
  
  // Simple linear trend calculation
  const values = data.map((item, index) => ({ x: index, y: item.value || 0 }));
  
  const n = values.length;
  const sumX = values.reduce((sum, p) => sum + p.x, 0);
  const sumY = values.reduce((sum, p) => sum + p.y, 0);
  const sumXY = values.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXX = values.reduce((sum, p) => sum + p.x * p.x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared for confidence
  const yMean = sumY / n;
  const ssRes = values.reduce((sum, p) => {
    const predicted = slope * p.x + intercept;
    return sum + Math.pow(p.y - predicted, 2);
  }, 0);
  const ssTot = values.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0);
  const rSquared = 1 - (ssRes / ssTot);
  
  const firstValue = values[0].y;
  const lastValue = values[n - 1].y;
  const change = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  
  return {
    direction: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable',
    change: Math.abs(change),
    confidence: rSquared,
    significance: Math.abs(slope),
  };
};

// Method to export report
reportSchema.methods.exportReport = async function(format = 'pdf', userId = null) {
  // Generate report if not already generated
  if (!this.data.lastGenerated) {
    await this.generate({}, userId);
  }
  
  // Create export record
  const exportRecord = {
    format,
    generatedAt: new Date(),
    generatedBy: userId,
    downloadCount: 0,
  };
  
  // This would contain actual export logic for different formats
  // For now, just creating a placeholder
  
  this.sharing.exports.push(exportRecord);
  await this.save();
  
  return exportRecord;
};

// Static method to get report analytics
reportSchema.statics.getReportAnalytics = async function(teamId = null, period = 'month') {
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
    createdAt: { $gte: startDate, $lte: endDate },
  };
  
  if (teamId) {
    matchStage.team = new mongoose.Types.ObjectId(teamId);
  }
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalReports: { $sum: 1 },
        totalViews: { $sum: '$analytics.views.totalViews' },
        totalGenerations: { $sum: '$analytics.usage.generationCount' },
        avgRating: { $avg: '$analytics.engagement.averageRating' },
        categories: { $addToSet: '$category' },
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalReports: 0,
    totalViews: 0,
    totalGenerations: 0,
    avgRating: 0,
    categories: [],
  };
};

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;