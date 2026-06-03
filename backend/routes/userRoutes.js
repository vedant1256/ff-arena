// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth'); // Fixed: using protect

// PUT Request to update profile
router.put('/profile', protect, updateProfile); // Fixed: using protect

module.exports = router;