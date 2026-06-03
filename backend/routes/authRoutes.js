// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

const { registerUser, loginUser, googleLogin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes for standard login/signup
router.post('/register', registerUser);
router.post('/login', loginUser);

// PUBLIC ROUTE: Google Authentication (This fixes your 404 error!)
router.post('/google', googleLogin);

// Protected route to get current user data
router.get('/me', protect, getMe);

module.exports = router;