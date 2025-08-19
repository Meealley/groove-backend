const mongoose = require("mongoose");

const nlpProcessorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Original user input
    originalInput: {
      type: String,
      required: true,
      trim: true,
    },
    // Processing timestamp
    processedAt: {
      type: Date,
      default: Date.now,
    },
    // Parsed intent and entities
    intent: {
      // Main intent classification
      primary: {
        type: String,
        enum: [
          "create_task",
          "set_reminder",
          "schedule_meeting",
          "update_task",
          "delete_task",
          "query_tasks",
          "set_deadline",
          "add_note",
          "change_priority",
          "mark_complete"
        ],
      },
      // Confidence score for intent classification
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
      },
      // Secondary intents (for complex commands)
      secondary: [{
        intent: String,
        confidence: Number,
      }],
    },
    // Extracted entities
    entities: {
      // Task information
      task: {
        title: String,
        description: String,
        priority: {
          type: String,
          enum: ["low", "medium", "high", "urgent"],
        },
        category: String,
        tags: [String],
      },
      // Time entities
      time: {
        // Specific date/time
        datetime: Date,
        // Relative time expressions
        relative: {
          value: Number,
          unit: {
            type: String,
            enum: ["minutes", "hours", "days", "weeks", "months"],
          },
          direction: {
            type: String,
            enum: ["from_now", "ago", "before", "after"],
          },
        },
        // Recurring patterns
        recurring: {
          pattern: {
            type: String,
            enum: ["daily", "weekly", "monthly", "yearly"],
          },
          interval: Number,
          daysOfWeek: [Number],
          endCondition: {
            type: {
              type: String,
              enum: ["date", "count"],
            },
            value: String,
          },
        },
        // Time range
        range: {
          start: Date,
          end: Date,
          duration: Number, // in minutes
        },
      },
      // Location entities
      location: {
        name: String,
        type: {
          type: String,
          enum: ["home", "office", "specific_address", "general_area"],
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          index: "2dsphere",
        },
        address: String,
      },
      // People entities
      people: [{
        name: String,
        email: String,
        role: String,
        mention_type: {
          type: String,
          enum: ["assignee", "collaborator", "observer", "mention"],
        },
      }],
      // Context entities
      context: {
        urgency_indicators: [String], // "asap", "urgent", "when possible"
        effort_indicators: [String],  // "quick", "complex", "easy"
        mood_indicators: [String],    // "important", "fun", "boring"
      },
    },
    // Processing metadata
    processing: {
      // NLP pipeline stages
      stages: [{
        stage: {
          type: String,
          enum: [
            "tokenization",
            "intent_classification", 
            "entity_extraction",
            "time_parsing",
            "location_parsing",
            "context_analysis",
            "validation",
            "task_generation"
          ],
        },
        success: Boolean,
        confidence: Number,
        duration: Number, // milliseconds
        errors: [String],
      }],
      // Total processing time
      totalProcessingTime: Number, // milliseconds
      // Algorithm version used
      algorithmVersion: String,
      // Model confidence
      overallConfidence: {
        type: Number,
        min: 0,
        max: 1,
      },
    },
    // Generated output
    output: {
      // Generated task(s)
      tasks: [{
        title: String,
        description: String,
        priority: String,
        category: String,
        tags: [String],
        deadline: Date,
        dueDate: Date,
        estimatedDuration: Number,
        reminders: [{
          date: Date,
          type: String,
          location: {
            type: {
              type: String,
              enum: ["Point"],
            },
            coordinates: [Number],
          },
        }],
        recurring: {
          isRecurring: Boolean,
          pattern: {
            type: String,
            interval: Number,
            daysOfWeek: [Number],
          },
        },
      }],
      // Generated reminders
      reminders: [{
        message: String,
        datetime: Date,
        type: String,
        location: Object,
      }],
      // Suggested actions
      suggestions: [{
        type: {
          type: String,
          enum: [
            "add_tag",
            "set_category", 
            "adjust_priority",
            "split_task",
            "add_dependency",
            "schedule_time"
          ],
        },
        suggestion: String,
        confidence: Number,
        reasoning: String,
      }],
    },
    // User feedback
    feedback: {
      // Whether user accepted the parsed result
      accepted: Boolean,
      // User corrections
      corrections: [{
        field: String,
        original_value: String,
        corrected_value: String,
        correction_type: {
          type: String,
          enum: ["wrong_extraction", "missed_entity", "wrong_intent"],
        },
      }],
      // User satisfaction rating
      satisfaction: {
        type: Number,
        min: 1,
        max: 5,
      },
      // Additional feedback
      notes: String,
    },
    // Learning data
    learning: {
      // Whether this example should be used for training
      use_for_training: {
        type: Boolean,
        default: true,
      },
      // Difficulty level of this parsing
      difficulty: {
        type: String,
        enum: ["easy", "medium", "hard", "very_hard"],
      },
      // Common patterns identified
      patterns: [{
        pattern_type: String,
        pattern_value: String,
        frequency: Number,
      }],
    },
    // Validation and errors
    validation: {
      // Whether parsing was successful
      isValid: {
        type: Boolean,
        default: false,
      },
      // Validation errors
      errors: [{
        type: {
          type: String,
          enum: [
            "ambiguous_time",
            "conflicting_information",
            "missing_required_info",
            "invalid_format",
            "unsupported_pattern"
          ],
        },
        message: String,
        field: String,
        severity: {
          type: String,
          enum: ["warning", "error", "critical"],
        },
      }],
      // Confidence thresholds met
      confidence_thresholds: {
        intent: Boolean,
        entities: Boolean,
        overall: Boolean,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
nlpProcessorSchema.index({ user: 1, processedAt: -1 });
nlpProcessorSchema.index({ "intent.primary": 1 });
nlpProcessorSchema.index({ "processing.overallConfidence": -1 });
nlpProcessorSchema.index({ "feedback.accepted": 1 });

// Static method to process natural language input
nlpProcessorSchema.statics.processInput = async function(userId, input, options = {}) {
  const processor = new this({
    user: userId,
    originalInput: input,
    processing: {
      stages: [],
      algorithmVersion: "1.0.0",
    },
  });
  
  const startTime = Date.now();
  
  try {
    // Stage 1: Tokenization
    await processor.tokenize();
    
    // Stage 2: Intent Classification
    await processor.classifyIntent();
    
    // Stage 3: Entity Extraction
    await processor.extractEntities();
    
    // Stage 4: Time Parsing
    await processor.parseTime();
    
    // Stage 5: Location Parsing
    await processor.parseLocation();
    
    // Stage 6: Context Analysis
    await processor.analyzeContext();
    
    // Stage 7: Validation
    await processor.validate();
    
    // Stage 8: Task Generation
    if (processor.validation.isValid) {
      await processor.generateTasks();
    }
    
    processor.processing.totalProcessingTime = Date.now() - startTime;
    
    // Calculate overall confidence
    processor.calculateOverallConfidence();
    
    await processor.save();
    return processor;
    
  } catch (error) {
    processor.validation.errors.push({
      type: "processing_error",
      message: error.message,
      severity: "critical",
    });
    
    await processor.save();
    throw error;
  }
};

// Tokenization stage
nlpProcessorSchema.methods.tokenize = async function() {
  const startTime = Date.now();
  
  try {
    // Simple tokenization (in production, use more sophisticated NLP library)
    this.tokens = this.originalInput
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
    
    this.processing.stages.push({
      stage: "tokenization",
      success: true,
      confidence: 1.0,
      duration: Date.now() - startTime,
    });
    
  } catch (error) {
    this.processing.stages.push({
      stage: "tokenization",
      success: false,
      confidence: 0,
      duration: Date.now() - startTime,
      errors: [error.message],
    });
  }
};

// Intent classification stage
nlpProcessorSchema.methods.classifyIntent = async function() {
  const startTime = Date.now();
  
  try {
    const input = this.originalInput.toLowerCase();
    
    // Intent patterns (in production, use ML model)
    const intentPatterns = {
      create_task: [
        /(?:create|add|make|new)\s+(?:task|todo|item)/,
        /(?:i need to|have to|must|should)\s+\w+/,
        /remind me to/,
        /(?:todo|task):\s*/,
      ],
      set_reminder: [
        /remind me/,
        /set (?:a )?reminder/,
        /(?:alert|notify) me/,
      ],
      schedule_meeting: [
        /schedule (?:a )?meeting/,
        /book (?:a )?meeting/,
        /meet with/,
      ],
      update_task: [
        /update|modify|change|edit/,
      ],
      mark_complete: [
        /(?:mark|set) (?:as )?(?:complete|done|finished)/,
        /completed?/,
        /finished/,
      ],
    };
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(input)) {
          const score = 0.8; // Simple scoring
          if (score > bestScore) {
            bestScore = score;
            bestMatch = intent;
          }
        }
      }
    }
    
    this.intent.primary = bestMatch || "create_task"; // Default intent
    this.intent.confidence = bestScore || 0.3;
    
    this.processing.stages.push({
      stage: "intent_classification",
      success: true,
      confidence: this.intent.confidence,
      duration: Date.now() - startTime,
    });
    
  } catch (error) {
    this.processing.stages.push({
      stage: "intent_classification",
      success: false,
      confidence: 0,
      duration: Date.now() - startTime,
      errors: [error.message],
    });
  }
};

// Entity extraction stage
nlpProcessorSchema.methods.extractEntities = async function() {
  const startTime = Date.now();
  
  try {
    const input = this.originalInput;
    
    // Extract task title (simplified approach)
    let title = input;
    
    // Remove common command words
    title = title.replace(/^(?:remind me to|i need to|have to|must|should|create task|add task|new task):\s*/i, '');
    title = title.replace(/\s+(?:tomorrow|today|next week|this week).*$/i, '');
    title = title.replace(/\s+(?:at|by|before|after)\s+\d+.*$/i, '');
    
    this.entities.task.title = title.trim();
    
    // Extract priority indicators
    const priorityPatterns = {
      urgent: /urgent|asap|immediately|critical/i,
      high: /important|high priority|priority|urgent/i,
      low: /low priority|when possible|sometime|eventually/i,
    };
    
    for (const [priority, pattern] of Object.entries(priorityPatterns)) {
      if (pattern.test(input)) {
        this.entities.task.priority = priority;
        break;
      }
    }
    
    // Extract context indicators
    this.entities.context.urgency_indicators = [];
    this.entities.context.effort_indicators = [];
    
    if (/urgent|asap|immediately/i.test(input)) {
      this.entities.context.urgency_indicators.push("urgent");
    }
    if (/quick|fast|briefly/i.test(input)) {
      this.entities.context.effort_indicators.push("quick");
    }
    if (/complex|detailed|thorough/i.test(input)) {
      this.entities.context.effort_indicators.push("complex");
    }
    
    this.processing.stages.push({
      stage: "entity_extraction",
      success: true,
      confidence: 0.7,
      duration: Date.now() - startTime,
    });
    
  } catch (error) {
    this.processing.stages.push({
      stage: "entity_extraction",
      success: false,
      confidence: 0,
      duration: Date.now() - startTime,
      errors: [error.message],
    });
  }
};

// Time parsing stage
nlpProcessorSchema.methods.parseTime = async function() {
  const startTime = Date.now();
  
  try {
    const input = this.originalInput.toLowerCase();
    
    // Time patterns
    const timePatterns = {
      specific_time: /(?:at\s+)?(\d{1,2}):?(\d{2})?\s*(am|pm)?/,
      relative_time: /(?:in\s+)?(\d+)\s+(minutes?|hours?|days?|weeks?|months?)/,
      named_times: {
        tomorrow: () => {
          const date = new Date();
          date.setDate(date.getDate() + 1);
          return date;
        },
        today: () => new Date(),
        "next week": () => {
          const date = new Date();
          date.setDate(date.getDate() + 7);
          return date;
        },
        "this week": () => {
          const date = new Date();
          const daysUntilFriday = 5 - date.getDay();
          date.setDate(date.getDate() + daysUntilFriday);
          return date;
        },
      },
    };
    
    // Check for specific times
    const timeMatch = input.match(timePatterns.specific_time);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      const minute = parseInt(timeMatch[2] || '0');
      const period = timeMatch[3];
      
      const date = new Date();
      let adjustedHour = hour;
      
      if (period === 'pm' && hour !== 12) {
        adjustedHour += 12;
      } else if (period === 'am' && hour === 12) {
        adjustedHour = 0;
      }
      
      date.setHours(adjustedHour, minute, 0, 0);
      this.entities.time.datetime = date;
    }
    
    // Check for relative times
    const relativeMatch = input.match(timePatterns.relative_time);
    if (relativeMatch) {
      const value = parseInt(relativeMatch[1]);
      const unit = relativeMatch[2].replace(/s$/, ''); // Remove plural 's'
      
      this.entities.time.relative = {
        value: value,
        unit: unit,
        direction: "from_now",
      };
      
      // Calculate absolute time
      const date = new Date();
      switch (unit) {
        case 'minute':
          date.setMinutes(date.getMinutes() + value);
          break;
        case 'hour':
          date.setHours(date.getHours() + value);
          break;
        case 'day':
          date.setDate(date.getDate() + value);
          break;
        case 'week':
          date.setDate(date.getDate() + (value * 7));
          break;
        case 'month':
          date.setMonth(date.getMonth() + value);
          break;
      }
      this.entities.time.datetime = date;
    }
    
    // Check for named times
    for (const [name, dateFunc] of Object.entries(timePatterns.named_times)) {
      if (input.includes(name)) {
        this.entities.time.datetime = dateFunc();
        break;
      }
    }
    
    // Check for recurring patterns
    if (/every|daily|weekly|monthly/i.test(input)) {
      if (/every day|daily/i.test(input)) {
        this.entities.time.recurring = {
          pattern: "daily",
          interval: 1,
        };
      } else if (/every week|weekly/i.test(input)) {
        this.entities.time.recurring = {
          pattern: "weekly",
          interval: 1,
        };
      } else if (/every month|monthly/i.test(input)) {
        this.entities.time.recurring = {
          pattern: "monthly",
          interval: 1,
        };
      }
    }
    
    this.processing.stages.push({
      stage: "time_parsing",
      success: true,
      confidence: this.entities.time.datetime ? 0.8 : 0.3,
      duration: Date.now() - startTime,
    });
    
  } catch (error) {
    this.processing.stages.push({
      stage: "time_parsing",
      success: false,
      confidence: 0,
      duration: Date.now() - startTime,
      errors: [error.message],
    });
  }
};

// Location parsing stage
nlpProcessorSchema.methods.parseLocation = async function() {
  const startTime = Date.now();
  
  try {
    const input = this.originalInput.toLowerCase();
    
    // Location patterns
    const locationPatterns = {
      at_home: /at home|home|house/,
      at_office: /at (?:the )?office|work|workplace/,
      at_location: /at\s+([^,\n]+)/,
    };
    
    if (locationPatterns.at_home.test(input)) {
      this.entities.location = {
        name: "Home",
        type: "home",
      };
    } else if (locationPatterns.at_office.test(input)) {
      this.entities.location = {
        name: "Office",
        type: "office",
      };
    } else {
      const locationMatch = input.match(locationPatterns.at_location);
      if (locationMatch) {
        this.entities.location = {
          name: locationMatch[1].trim(),
          type: "specific_address",
        };
      }
    }
    
    this.processing.stages.push({
      stage: "location_parsing",
      success: true,
      confidence: this.entities.location ? 0.7 : 0.5,
      duration: Date.now() - startTime,
    });
    
  } catch (error) {
    this.processing.stages.push({
      stage: "location_parsing",
      success: false,
      confidence: 0,
      duration: Date.now() - startTime,
      errors: [error.message],
    });
  }
};

// Context analysis stage
nlpProcessorSchema.methods.analyzeContext = async function() {
  const startTime = Date.now();
  
  try {
    // Analyze sentiment and context
    const input = this.originalInput.toLowerCase();
    
    // Effort estimation
    if (/quick|fast|brief|short/i.test(input)) {
      this.entities.context.effort_indicators.push("quick");
    } else if (/long|detailed|complex|thorough/i.test(input)) {
      this.entities.context.effort_indicators.push("complex");
    }
    
    // Importance indicators
    if (/important|critical|key|essential/i.test(input)) {
      this.entities.context.mood_indicators.push("important");
    }
    
    this.processing.stages.push({
      stage: "context_analysis",
      success: true,
      confidence: 0.6,
      duration: Date.now() - startTime,
    });
    
  } catch (error) {
    this.processing.stages.push({
      stage: "context_analysis",
      success: false,
      confidence: 0,
      duration: Date.now() - startTime,
      errors: [error.message],
    });
  }
};

// Validation stage
nlpProcessorSchema.methods.validate = async function() {
  const startTime = Date.now();
  
  try {
    this.validation.errors = [];
    
    // Check if we have enough information to create a task
    if (!this.entities.task.title || this.entities.task.title.length < 3) {
      this.validation.errors.push({
        type: "missing_required_info",
        message: "Task title is too short or missing",
        field: "title",
        severity: "error",
      });
    }
    
    // Check confidence thresholds
    this.validation.confidence_thresholds = {
      intent: this.intent.confidence >= 0.5,
      entities: this.entities.task.title ? true : false,
      overall: this.intent.confidence >= 0.3,
    };
    
    this.validation.isValid = 
      this.validation.confidence_thresholds.overall &&
      this.validation.errors.filter(e => e.severity === "error").length === 0;
    
    this.processing.stages.push({
      stage: "validation",
      success: true,
      confidence: this.validation.isValid ? 0.8 : 0.4,
      duration: Date.now() - startTime,
    });
    
  } catch (error) {
    this.processing.stages.push({
      stage: "validation",
      success: false,
      confidence: 0,
      duration: Date.now() - startTime,
      errors: [error.message],
    });
  }
};

// Task generation stage
nlpProcessorSchema.methods.generateTasks = async function() {
  const startTime = Date.now();
  
  try {
    const task = {
      title: this.entities.task.title,
      description: this.entities.task.description || "",
      priority: this.entities.task.priority || "medium",
    };
    
    // Add time information
    if (this.entities.time.datetime) {
      task.dueDate = this.entities.time.datetime;
    }
    
    // Add location information as reminder
    if (this.entities.location) {
      task.reminders = [{
        date: this.entities.time.datetime || new Date(),
        type: "location",
        location: {
          type: "Point",
          coordinates: this.entities.location.coordinates || [0, 0],
        },
      }];
    }
    
    // Add recurring information
    if (this.entities.time.recurring) {
      task.recurring = {
        isRecurring: true,
        pattern: this.entities.time.recurring,
      };
    }
    
    // Estimate duration based on context
    if (this.entities.context.effort_indicators.includes("quick")) {
      task.estimatedDuration = 30; // 30 minutes
    } else if (this.entities.context.effort_indicators.includes("complex")) {
      task.estimatedDuration = 180; // 3 hours
    } else {
      task.estimatedDuration = 60; // 1 hour default
    }
    
    this.output.tasks = [task];
    
    // Generate suggestions
    this.output.suggestions = [];
    
    if (!this.entities.task.category) {
      this.output.suggestions.push({
        type: "set_category",
        suggestion: "Consider adding a category to organize this task",
        confidence: 0.7,
        reasoning: "No category was specified in the input",
      });
    }
    
    if (this.entities.context.urgency_indicators.length > 0) {
      this.output.suggestions.push({
        type: "adjust_priority",
        suggestion: "This task seems urgent, consider raising its priority",
        confidence: 0.8,
        reasoning: "Urgency indicators found in the input",
      });
    }
    
    this.processing.stages.push({
      stage: "task_generation",
      success: true,
      confidence: 0.8,
      duration: Date.now() - startTime,
    });
    
  } catch (error) {
    this.processing.stages.push({
      stage: "task_generation",
      success: false,
      confidence: 0,
      duration: Date.now() - startTime,
      errors: [error.message],
    });
  }
};

// Calculate overall confidence
nlpProcessorSchema.methods.calculateOverallConfidence = function() {
  const stages = this.processing.stages.filter(s => s.success);
  
  if (stages.length === 0) {
    this.processing.overallConfidence = 0;
    return;
  }
  
  const totalConfidence = stages.reduce((sum, stage) => sum + (stage.confidence || 0), 0);
  this.processing.overallConfidence = totalConfidence / stages.length;
};


nlpProcessorSchema.methods.learnFromFeedback = function(feedback) {
  this.feedback = feedback;
  

  if (this.processing.overallConfidence > 0.8 && feedback.accepted) {
    this.learning.difficulty = "easy";
  } else if (this.processing.overallConfidence > 0.6 && feedback.accepted) {
    this.learning.difficulty = "medium";
  } else if (feedback.corrections && feedback.corrections.length > 0) {
    this.learning.difficulty = "hard";
  } else {
    this.learning.difficulty = "very_hard";
  }
  
  return this.save();
};

const NLPProcessor = mongoose.model("NLPProcessor", nlpProcessorSchema);

module.exports = NLPProcessor;