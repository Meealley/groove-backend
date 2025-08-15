const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require("../controllers/authcontroller")
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Private route
router.get('/me', protect, getMe);

module.exports = router;
