// backend/routes/tournamentRoutes.js
const express = require('express');
const router = express.Router();

// Added deleteTournament to the import!
const { getTournaments, createTournament, joinTournament, updateTournament, declareWinner, deleteTournament } = require('../controllers/tournamentController');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, getTournaments);
router.post('/', protect, admin, createTournament);
router.post('/:id/join', protect, joinTournament);
router.put('/:id', protect, admin, updateTournament);
router.post('/:id/winner', protect, admin, declareWinner);

// NEW: Admin only route to delete tournaments
router.delete('/:id', protect, admin, deleteTournament);

module.exports = router;