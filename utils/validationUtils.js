const validator = require('validator');

// Common validation rules
const validationRules = {
  // Basic field validations
  email: {
    required: true,
    validate: (value) => validator.isEmail(value),
    message: "Valid email address is required"
  },
  
  password: {
    required: true,
    minLength: 6,
    validate: (value) => value && value.length >= 6,
    message: "Password must be at least 6 characters long"
  },
  
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    validate: (value) => value && value.trim().length >= 2 && value.trim().length <= 50,
    message: "Name must be between 2 and 50 characters"
  },
  
  phone: {
    required: false,
    validate: (value) => !value || validator.isMobilePhone(value),
    message: "Valid phone number is required"
  },
  
  url: {
    required: false,
    validate: (value) => !value || validator.isURL(value),
    message: "Valid URL is required"
  },
  
  // Subscription related
  subscriptionPlan: {
    required: true,
    validate: (value) => ['free', 'pro', 'team', 'enterprise'].includes(value),
    message: "Invalid subscription plan"
  },
  
  // Settings validations
  theme: {
    required: false,
    validate: (value) => !value || ['light', 'dark', 'auto'].includes(value),
    message: "Theme must be light, dark, or auto"
  },
  
  density: {
    required: false,
    validate: (value) => !value || ['compact', 'comfortable', 'spacious'].includes(value),
    message: "Density must be compact, comfortable, or spacious"
  },
  
  defaultView: {
    required: false,
    validate: (value) => !value || ['list', 'board', 'calendar', 'timeline'].includes(value),
    message: "Default view must be list, board, calendar, or timeline"
  },
  
  priority: {
    required: false,
    validate: (value) => !value || ['low', 'medium', 'high', 'urgent'].includes(value),
    message: "Priority must be low, medium, high, or urgent"
  },
  
  assistanceLevel: {
    required: false,
    validate: (value) => !value || ['minimal', 'moderate', 'aggressive', 'custom'].includes(value),
    message: "Assistance level must be minimal, moderate, aggressive, or custom"
  },
  
  feedbackFrequency: {
    required: false,
    validate: (value) => !value || ['never', 'weekly', 'monthly'].includes(value),
    message: "Feedback frequency must be never, weekly, or monthly"
  },
  
  dataRetention: {
    required: false,
    validate: (value) => !value || ['1year', '2years', '5years', 'forever'].includes(value),
    message: "Data retention must be 1year, 2years, 5years, or forever"
  },
  
  analyticsLevel: {
    required: false,
    validate: (value) => !value || ['basic', 'detailed', 'comprehensive'].includes(value),
    message: "Analytics level must be basic, detailed, or comprehensive"
  },
  
  // Time validations
  time: {
    required: false,
    validate: (value) => !value || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value),
    message: "Time must be in HH:MM format"
  },
  
  timezone: {
    required: false,
    validate: (value) => {
      if (!value) return true;
      try {
        Intl.DateTimeFormat(undefined, { timeZone: value });
        return true;
      } catch (error) {
        return false;
      }
    },
    message: "Invalid timezone"
  },
  
  // Numeric validations
  positiveInteger: {
    required: false,
    validate: (value) => value === undefined || (Number.isInteger(Number(value)) && Number(value) > 0),
    message: "Must be a positive integer"
  },
  
  percentage: {
    required: false,
    validate: (value) => value === undefined || (Number(value) >= 0 && Number(value) <= 100),
    message: "Must be a percentage between 0 and 100"
  }
};

// Generic field validator
const validateField = (value, rule) => {
  // Check if field is required
  if (rule.required && (value === undefined || value === null || value === '')) {
    return { isValid: false, message: rule.message || "This field is required" };
  }
  
  // If field is not required and empty, skip validation
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return { isValid: true };
  }
  
  // Check custom validation function
  if (rule.validate && !rule.validate(value)) {
    return { isValid: false, message: rule.message || "Invalid value" };
  }
  
  return { isValid: true };
};

// Validate multiple fields
const validateFields = (data, rules) => {
  const errors = {};
  let isValid = true;
  
  for (const [fieldName, rule] of Object.entries(rules)) {
    const value = data[fieldName];
    const validation = validateField(value, rule);
    
    if (!validation.isValid) {
      errors[fieldName] = validation.message;
      isValid = false;
    }
  }
  
  return { isValid, errors };
};

// Validate user registration data
const validateRegistration = (data) => {
  const rules = {
    name: validationRules.name,
    email: validationRules.email,
    password: validationRules.password
  };
  
  return validateFields(data, rules);
};

// Validate user login data
const validateLogin = (data) => {
  const rules = {
    email: validationRules.email,
    password: { 
      required: true, 
      validate: (value) => value && value.length > 0,
      message: "Password is required" 
    }
  };
  
  return validateFields(data, rules);
};

// Validate profile update data
const validateProfileUpdate = (data) => {
  const rules = {
    firstName: { ...validationRules.name, required: false },
    lastName: { ...validationRules.name, required: false },
    email: { ...validationRules.email, required: false },
    phone: validationRules.phone,
    bio: { 
      required: false, 
      validate: (value) => !value || value.length <= 500,
      message: "Bio must be 500 characters or less" 
    },
    title: { 
      required: false, 
      validate: (value) => !value || value.length <= 100,
      message: "Title must be 100 characters or less" 
    },
    company: { 
      required: false, 
      validate: (value) => !value || value.length <= 100,
      message: "Company must be 100 characters or less" 
    },
    timezone: validationRules.timezone
  };
  
  return validateFields(data, rules);
};

// Validate work preferences
const validateWorkPreferences = (data) => {
  const errors = {};
  let isValid = true;
  
  // Validate working hours structure
  if (data.workingHours) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
      if (data.workingHours[day]) {
        const dayData = data.workingHours[day];
        
        if (dayData.start && !validationRules.time.validate(dayData.start)) {
          errors[`workingHours.${day}.start`] = "Invalid start time format";
          isValid = false;
        }
        
        if (dayData.end && !validationRules.time.validate(dayData.end)) {
          errors[`workingHours.${day}.end`] = "Invalid end time format";
          isValid = false;
        }
        
        if (dayData.start && dayData.end && dayData.start >= dayData.end) {
          errors[`workingHours.${day}`] = "Start time must be before end time";
          isValid = false;
        }
      }
    }
  }
  
  // Validate breaks
  if (data.breaks) {
    const numericFields = ['shortBreakDuration', 'longBreakDuration', 'shortBreakFrequency', 'lunchBreakDuration'];
    
    for (const field of numericFields) {
      if (data.breaks[field] !== undefined) {
        const validation = validateField(data.breaks[field], validationRules.positiveInteger);
        if (!validation.isValid) {
          errors[`breaks.${field}`] = validation.message;
          isValid = false;
        }
      }
    }
    
    if (data.breaks.lunchBreakTime) {
      const validation = validateField(data.breaks.lunchBreakTime, validationRules.time);
      if (!validation.isValid) {
        errors['breaks.lunchBreakTime'] = validation.message;
        isValid = false;
      }
    }
  }
  
  // Validate focus settings
  if (data.focus && data.focus.deepWorkBlockDuration !== undefined) {
    const validation = validateField(data.focus.deepWorkBlockDuration, validationRules.positiveInteger);
    if (!validation.isValid) {
      errors['focus.deepWorkBlockDuration'] = validation.message;
      isValid = false;
    }
  }
  
  // Validate task settings
  if (data.tasks) {
    if (data.tasks.defaultPriority) {
      const validation = validateField(data.tasks.defaultPriority, validationRules.priority);
      if (!validation.isValid) {
        errors['tasks.defaultPriority'] = validation.message;
        isValid = false;
      }
    }
    
    const numericTaskFields = ['defaultEstimationBuffer', 'maxDailyTasks', 'preferredTaskDuration'];
    for (const field of numericTaskFields) {
      if (data.tasks[field] !== undefined) {
        const validation = validateField(data.tasks[field], validationRules.positiveInteger);
        if (!validation.isValid) {
          errors[`tasks.${field}`] = validation.message;
          isValid = false;
        }
      }
    }
  }
  
  return { isValid, errors };
};

// Validate subscription upgrade
const validateSubscriptionUpgrade = (data) => {
  const rules = {
    plan: validationRules.subscriptionPlan,
    customerId: { 
      required: false, 
      validate: (value) => !value || typeof value === 'string',
      message: "Customer ID must be a string" 
    },
    subscriptionId: { 
      required: false, 
      validate: (value) => !value || typeof value === 'string',
      message: "Subscription ID must be a string" 
    }
  };
  
  return validateFields(data, rules);
};

// Validate 2FA token
const validate2FAToken = (token) => {
  if (!token) {
    return { isValid: false, message: "2FA token is required" };
  }
  
  if (!/^\d{6}$/.test(token)) {
    return { isValid: false, message: "2FA token must be 6 digits" };
  }
  
  return { isValid: true };
};

// Validate password strength
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }
  
  if (password && password.length > 128) {
    errors.push("Password must be less than 128 characters");
  }
  
  if (password && !/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (password && !/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (password && !/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  // Optional: Special character requirement
  // if (password && !/(?=.*[@$!%*?&])/.test(password)) {
  //   errors.push("Password must contain at least one special character");
  // }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: errors.length === 0 ? 'strong' : errors.length <= 2 ? 'medium' : 'weak'
  };
};

// Sanitize input data
const sanitizeInput = (data, allowedFields) => {
  const sanitized = {};
  
  for (const field of allowedFields) {
    if (data.hasOwnProperty(field)) {
      let value = data[field];
      
      // Trim strings
      if (typeof value === 'string') {
        value = value.trim();
      }
      
      // Convert empty strings to null for optional fields
      if (value === '') {
        value = null;
      }
      
      sanitized[field] = value;
    }
  }
  
  return sanitized;
};

module.exports = {
  validationRules,
  validateField,
  validateFields,
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validateWorkPreferences,
  validateSubscriptionUpgrade,
  validate2FAToken,
  validatePasswordStrength,
  sanitizeInput
};