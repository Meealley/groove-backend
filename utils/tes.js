// Data sanitization - Fixed MongoDB injection prevention
const mongoSanitizeCustom = (req, res, next) => {
  const emailFields = ['email'] // Add other email field names if needed
  
  const sanitize = (payload, keyPath = '') => {
    if (payload && typeof payload === 'object') {
      for (const key in payload) {
        const currentPath = keyPath ? `${keyPath}.${key}` : key;
        
        if (typeof payload[key] === 'string') {
          // Remove MongoDB operators ($ prefix)
          payload[key] = payload[key].replace(/^\$/, '');
          
          // Only remove dots if this is NOT an email field
          const isEmailField = emailFields.some(emailField => 
            key.toLowerCase().includes(emailField.toLowerCase()) ||
            currentPath.toLowerCase().includes(emailField.toLowerCase())
          );
          
          if (!isEmailField) {
            // Remove dots from non-email fields to prevent injection
            payload[key] = payload[key].replace(/\./g, '');
          }
        } else if (typeof payload[key] === 'object') {
          sanitize(payload[key], currentPath);
        }
      }
    }
  };

  // Sanitize request body
  if (req.body) {
    sanitize(req.body);
  }

  // Sanitize query parameters (create a new object to avoid read-only issues)
  if (req.query) {
    const sanitizedQuery = {};
    for (const key in req.query) {
      const isEmailField = emailFields.some(emailField => 
        key.toLowerCase().includes(emailField.toLowerCase())
      );
      
      if (typeof req.query[key] === 'string') {
        let sanitized = req.query[key].replace(/^\$/, '');
        if (!isEmailField) {
          sanitized = sanitized.replace(/\./g, '');
        }
        sanitizedQuery[key] = sanitized;
      } else {
        sanitizedQuery[key] = req.query[key];
      }
    }
    // Override the query object safely
    Object.defineProperty(req, 'query', {
      value: sanitizedQuery,
      writable: true,
      configurable: true
    });
  }

  next();
};