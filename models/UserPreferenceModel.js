const mongoose = require("mongoose");

const userPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // One preference document per user
  },
  
  // Working Schedule Preferences
  workingHours: {
    start: { 
      type: String, 
      default: "09:00",
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter valid time format (HH:MM)"]
    },
    end: { 
      type: String, 
      default: "17:00",
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter valid time format (HH:MM)"]
    }
  },
  
  workingDays: {
    type: [Number],
    default: [1, 2, 3, 4, 5], // Monday to Friday
    validate: {
      validator: function(days) {
        return days.every(day => day >= 0 && day <= 6);
      },
      message: "Working days must be between 0 (Sunday) and 6 (Saturday)"
    }
  },
  
  // Productivity Tracking
  productiveHours: [{
    day: { 
      type: Number, 
      min: 0, 
      max: 6,
      required: true
    }, // 0 = Sunday, 6 = Saturday
    hours: [{ 
      type: Number, 
      min: 0, 
      max: 23 
    }] // [9, 10, 14, 15] - most productive hours
  }],
  
  // Break Preferences for Focus Sessions
  breakPreferences: {
    shortBreak: { 
      type: Number, 
      default: 5,
      min: 1,
      max: 15
    }, // minutes
    longBreak: { 
      type: Number, 
      default: 15,
      min: 10,
      max: 60
    }, // minutes
    breakFrequency: { 
      type: Number, 
      default: 25,
      min: 15,
      max: 90
    } // work minutes before break
  },
  
  // Notification Preferences
  notifications: {
    taskReminders: {
      type: Boolean,
      default: true
    },
    deadlineAlerts: {
      type: Boolean,
      default: true
    },
    dailySummary: {
      type: Boolean,
      default: true
    },
    productivityInsights: {
      type: Boolean,
      default: true
    },
    // How many minutes before deadline to send alert
    deadlineAlertTiming: {
      type: Number,
      default: 60, // 1 hour before
      min: 5,
      max: 1440 // max 24 hours
    }
  },
  
  // Task Estimation Preferences
  estimation: {
    bufferPercentage: {
      type: Number,
      default: 25, // Add 25% buffer to estimates
      min: 0,
      max: 100
    },
    preferredEstimationMethod: {
      type: String,
      enum: ["conservative", "realistic", "optimistic"],
      default: "realistic"
    }
  },
  
  // UI/UX Preferences
  interface: {
    theme: {
      type: String,
      enum: ["light", "dark", "auto"],
      default: "auto"
    },
    defaultTaskView: {
      type: String,
      enum: ["list", "calendar", "kanban"],
      default: "list"
    },
    taskSortBy: {
      type: String,
      enum: ["dueDate", "priority", "createdAt", "alphabetical"],
      default: "dueDate"
    },
    showCompletedTasks: {
      type: Boolean,
      default: false
    }
  },
  
  // Location-based preferences
  location: {
    enableLocationReminders: {
      type: Boolean,
      default: false
    },
    homeLocation: {
      name: String,
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: function(coords) {
            // Allow empty/undefined coordinates
            if (!coords || coords.length === 0) return true;
            return coords.length === 2 && 
                   coords[0] >= -180 && coords[0] <= 180 && 
                   coords[1] >= -90 && coords[1] <= 90;
          },
          message: "Invalid coordinates format. Must be [longitude, latitude] with longitude between -180 and 180, latitude between -90 and 90"
        }
      }
    },
    workLocation: {
      name: String,
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: function(coords) {
            // Allow empty/undefined coordinates
            if (!coords || coords.length === 0) return true;
            return coords.length === 2 && 
                   coords[0] >= -180 && coords[0] <= 180 && 
                   coords[1] >= -90 && coords[1] <= 90;
          },
          message: "Invalid coordinates format. Must be [longitude, latitude] with longitude between -180 and 180, latitude between -90 and 90"
        }
      }
    }
  },
  
  // Privacy & Data
  privacy: {
    shareProductivityData: {
      type: Boolean,
      default: false
    },
    allowAnalytics: {
      type: Boolean,
      default: true
    }
  },
  
  // AI Features
  aiFeatures: {
    enableSmartScheduling: {
      type: Boolean,
      default: true
    },
    enableDurationEstimation: {
      type: Boolean,
      default: true
    },
    learningMode: {
      type: String,
      enum: ["aggressive", "moderate", "conservative"],
      default: "moderate"
    }
  }
  
}, { 
  timestamps: true 
});

// Index is automatically created by unique: true on user field

// Create default preferences when user registers
userPreferenceSchema.statics.createDefaultPreferences = async function(userId) {
  const existingPrefs = await this.findOne({ user: userId });
  if (!existingPrefs) {
    await this.create({ user: userId });
  }
};

// Method to update specific preference category
userPreferenceSchema.methods.updateCategory = function(category, data) {
  if (this[category]) {
    Object.assign(this[category], data);
    return this.save();
  }
  throw new Error(`Category ${category} does not exist`);
};

// Method to get user's productive hours for a specific day
userPreferenceSchema.methods.getProductiveHours = function(dayOfWeek) {
  const dayPrefs = this.productiveHours.find(p => p.day === dayOfWeek);
  return dayPrefs ? dayPrefs.hours : [];
};

// Method to check if user is in working hours
userPreferenceSchema.methods.isWorkingTime = function(datetime = new Date()) {
  const day = datetime.getDay();
  const hour = datetime.getHours();
  const minute = datetime.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  // Check if it's a working day
  if (!this.workingDays.includes(day)) {
    return false;
  }
  
  // Check if it's within working hours
  const startTime = this.workingHours.start.split(':');
  const endTime = this.workingHours.end.split(':');
  const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
  const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
  
  return timeInMinutes >= startMinutes && timeInMinutes <= endMinutes;
};

const UserPreference = mongoose.model("UserPreference", userPreferenceSchema);

module.exports = UserPreference;