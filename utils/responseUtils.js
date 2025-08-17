// Standard API response utility functions for consistent responses

// Success response
const sendSuccessResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

// Error response
const sendErrorResponse = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = errors;
  }

  // Don't send stack trace in production
  if (process.env.NODE_ENV === 'development' && res.locals.error) {
    response.stack = res.locals.error.stack;
  }

  return res.status(statusCode).json(response);
};

// Validation error response
const sendValidationError = (res, errors) => {
  return sendErrorResponse(res, 'Validation failed', 400, errors);
};

// Not found response
const sendNotFoundResponse = (res, resource = 'Resource') => {
  return sendErrorResponse(res, `${resource} not found`, 404);
};

// Unauthorized response
const sendUnauthorizedResponse = (res, message = 'Access denied') => {
  return sendErrorResponse(res, message, 401);
};

// Forbidden response
const sendForbiddenResponse = (res, message = 'Insufficient permissions') => {
  return sendErrorResponse(res, message, 403);
};

// Conflict response
const sendConflictResponse = (res, message = 'Resource already exists') => {
  return sendErrorResponse(res, message, 409);
};

// Rate limit response
const sendRateLimitResponse = (res, message = 'Too many requests') => {
  return sendErrorResponse(res, message, 429);
};

// Server error response
const sendServerErrorResponse = (res, message = 'Internal server error') => {
  return sendErrorResponse(res, message, 500);
};

// Paginated response
const sendPaginatedResponse = (res, data, pagination, message = 'Success') => {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      current: pagination.current || 1,
      total: pagination.total || 1,
      limit: pagination.limit || 20,
      totalRecords: pagination.totalRecords || 0,
      hasNext: pagination.hasNext || false,
      hasPrev: pagination.hasPrev || false
    },
    timestamp: new Date().toISOString()
  };

  return res.status(200).json(response);
};

// Created response
const sendCreatedResponse = (res, data, message = 'Created successfully') => {
  return sendSuccessResponse(res, data, message, 201);
};

// Updated response
const sendUpdatedResponse = (res, data, message = 'Updated successfully') => {
  return sendSuccessResponse(res, data, message, 200);
};

// Deleted response
const sendDeletedResponse = (res, message = 'Deleted successfully') => {
  return sendSuccessResponse(res, null, message, 200);
};

// No content response
const sendNoContentResponse = (res) => {
  return res.status(204).send();
};

// Custom status response
const sendCustomResponse = (res, statusCode, data, message) => {
  return sendSuccessResponse(res, data, message, statusCode);
};

// Response with meta information
const sendResponseWithMeta = (res, data, meta = {}, message = 'Success') => {
  const response = {
    success: true,
    message,
    data,
    meta,
    timestamp: new Date().toISOString()
  };

  return res.status(200).json(response);
};

// Bulk operation response
const sendBulkOperationResponse = (res, results, message = 'Bulk operation completed') => {
  const response = {
    success: true,
    message,
    results: {
      total: results.total || 0,
      successful: results.successful || 0,
      failed: results.failed || 0,
      errors: results.errors || []
    },
    timestamp: new Date().toISOString()
  };

  return res.status(200).json(response);
};

// Export operation response
const sendExportResponse = (res, data, filename, format = 'json') => {
  const contentTypes = {
    json: 'application/json',
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };

  res.setHeader('Content-Type', contentTypes[format] || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

  if (format === 'json') {
    return res.json({
      success: true,
      message: 'Export completed',
      data,
      exportInfo: {
        filename,
        format,
        recordCount: Array.isArray(data) ? data.length : 0,
        exportedAt: new Date().toISOString()
      }
    });
  }

  return res.send(data);
};

// Health check response
const sendHealthCheckResponse = (res, status = 'healthy', details = {}) => {
  const response = {
    success: true,
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    details
  };

  const statusCode = status === 'healthy' ? 200 : 503;
  return res.status(statusCode).json(response);
};

// API version response
const sendApiVersionResponse = (res, version = '1.0.0', features = []) => {
  const response = {
    success: true,
    version,
    features,
    documentation: `${process.env.APP_URL}/api/docs`,
    timestamp: new Date().toISOString()
  };

  return res.status(200).json(response);
};

// Middleware to attach response utilities to res object
const attachResponseUtilities = (req, res, next) => {
  res.sendSuccess = (data, message, statusCode) => sendSuccessResponse(res, data, message, statusCode);
  res.sendError = (message, statusCode, errors) => sendErrorResponse(res, message, statusCode, errors);
  res.sendValidationError = (errors) => sendValidationError(res, errors);
  res.sendNotFound = (resource) => sendNotFoundResponse(res, resource);
  res.sendUnauthorized = (message) => sendUnauthorizedResponse(res, message);
  res.sendForbidden = (message) => sendForbiddenResponse(res, message);
  res.sendConflict = (message) => sendConflictResponse(res, message);
  res.sendRateLimit = (message) => sendRateLimitResponse(res, message);
  res.sendServerError = (message) => sendServerErrorResponse(res, message);
  res.sendPaginated = (data, pagination, message) => sendPaginatedResponse(res, data, pagination, message);
  res.sendCreated = (data, message) => sendCreatedResponse(res, data, message);
  res.sendUpdated = (data, message) => sendUpdatedResponse(res, data, message);
  res.sendDeleted = (message) => sendDeletedResponse(res, message);
  res.sendNoContent = () => sendNoContentResponse(res);
  res.sendCustom = (statusCode, data, message) => sendCustomResponse(res, statusCode, data, message);
  res.sendWithMeta = (data, meta, message) => sendResponseWithMeta(res, data, meta, message);
  res.sendBulkOperation = (results, message) => sendBulkOperationResponse(res, results, message);
  res.sendExport = (data, filename, format) => sendExportResponse(res, data, filename, format);
  res.sendHealthCheck = (status, details) => sendHealthCheckResponse(res, status, details);
  res.sendApiVersion = (version, features) => sendApiVersionResponse(res, version, features);

  next();
};

// Format validation errors from express-validator
const formatValidationErrors = (errors) => {
  const formatted = {};
  
  errors.forEach(error => {
    if (!formatted[error.param]) {
      formatted[error.param] = [];
    }
    formatted[error.param].push(error.msg);
  });
  
  return formatted;
};

// Format Mongoose validation errors
const formatMongooseErrors = (error) => {
  const formatted = {};
  
  if (error.errors) {
    Object.keys(error.errors).forEach(key => {
      formatted[key] = error.errors[key].message;
    });
  }
  
  return formatted;
};

// Create consistent error object
const createErrorObject = (message, code = null, field = null) => {
  const error = { message };
  
  if (code) error.code = code;
  if (field) error.field = field;
  
  return error;
};

// Log API request/response (for monitoring)
const logApiCall = (req, res, responseTime) => {
  const log = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user ? req.user._id : null,
    timestamp: new Date().toISOString()
  };
  
  // In production, you'd send this to a logging service
  console.log('API Call:', JSON.stringify(log));
};

module.exports = {
  sendSuccessResponse,
  sendErrorResponse,
  sendValidationError,
  sendNotFoundResponse,
  sendUnauthorizedResponse,
  sendForbiddenResponse,
  sendConflictResponse,
  sendRateLimitResponse,
  sendServerErrorResponse,
  sendPaginatedResponse,
  sendCreatedResponse,
  sendUpdatedResponse,
  sendDeletedResponse,
  sendNoContentResponse,
  sendCustomResponse,
  sendResponseWithMeta,
  sendBulkOperationResponse,
  sendExportResponse,
  sendHealthCheckResponse,
  sendApiVersionResponse,
  attachResponseUtilities,
  formatValidationErrors,
  formatMongooseErrors,
  createErrorObject,
  logApiCall
};