const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
      issuer: 'ProductivityApp',
      audience: 'ProductivityApp-Users'
    }
  );
};

// Generate refresh token (longer expiry)
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
      issuer: 'ProductivityApp',
      audience: 'ProductivityApp-Users'
    }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'ProductivityApp',
      audience: 'ProductivityApp-Users'
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
      issuer: 'ProductivityApp',
      audience: 'ProductivityApp-Users'
    });
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Decode token without verification (for inspection)
const decodeToken = (token) => {
  return jwt.decode(token);
};

// Generate API key token (for integrations)
const generateApiToken = (userId, permissions = ['read']) => {
  return jwt.sign(
    { 
      id: userId, 
      type: 'api',
      permissions 
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '1year', // API tokens have longer expiry
      issuer: 'ProductivityApp',
      audience: 'ProductivityApp-API'
    }
  );
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  decodeToken,
  generateApiToken
};