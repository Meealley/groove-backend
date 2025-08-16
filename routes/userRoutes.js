const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, refreshToken, logoutUser, verifyEmail, ver } = require("../controllers/authcontroller")
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Private route
router.get('/me', protect, getMe);

router.post("/refresh", protect, refreshToken);

router.post("/logout", protect, logoutUser);

router.get("/verify-email", verifyEmail);

// router.post("/verify-email", verifyEmailAPI);

module.exports = router;
