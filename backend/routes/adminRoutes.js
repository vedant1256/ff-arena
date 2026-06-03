// backend/routes/adminRoutes.js
const express = require('express');
const { updateTournament, getTournamentPlayers, getAllUsers, toggleBanUser } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.use(admin);

router.put('/tournaments/:id', updateTournament);
router.get('/tournaments/:id/players', getTournamentPlayers);

// NEW ROUTES
router.get('/users', getAllUsers);
router.put('/users/:id/ban', toggleBanUser);

module.exports = router;