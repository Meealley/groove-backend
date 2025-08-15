// routes/preferenceRoutes.js
const express = require('express');
const router = express.Router();
const {
  getUserPreferences,
  updateUserPreferences,
  updatePreferenceCategory,
  setProductiveHours,
  getProductiveHours,
  checkWorkingTime
} = require('../controllers/userpreferencecontroller');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getUserPreferences)
  .put(protect, updateUserPreferences);

router.put('/:category', protect, updatePreferenceCategory);
router.post('/productive-hours', protect, setProductiveHours);
router.get('/productive-hours/:day', protect, getProductiveHours);
router.get('/is-working-time', protect, checkWorkingTime);

module.exports = router;