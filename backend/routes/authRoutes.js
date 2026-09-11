// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

// 🚀 NEW: Added getLeaderboard to the imports
const { registerUser, loginUser, googleLogin, getMe, acceptTerms, getLeaderboard } = require('../controllers/authController');

// 🚀 FIXED: Importing from '../middleware/auth' instead of 'authMiddleware'
const { protect } = require('../middleware/auth'); 

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);

// NAYA ROUTE: Terms accept karne ke liye
router.put('/accept-terms', protect, acceptTerms);

// 🏆 NEW: Leaderboard Route (Public so anyone can see top players)
router.get('/leaderboard', getLeaderboard);

module.exports = router;