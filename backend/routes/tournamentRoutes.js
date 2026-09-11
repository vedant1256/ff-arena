// backend/routes/tournamentRoutes.js
const express = require('express');
const router = express.Router();

// 🚀 NEW: Added screenshot verification functions to the import!
const { 
  getTournaments, 
  createTournament, 
  joinTournament, 
  updateTournament, 
  declareWinner, 
  deleteTournament,
  submitMatchResult,     // Player function
  getPendingResults,     // Admin function
  verifyMatchResult      // Admin function
} = require('../controllers/tournamentController');

const { protect, admin } = require('../middleware/auth');

// ==========================================
// 📸 SCREENSHOT VERIFICATION ROUTES
// ==========================================
// IMPORTANT: Placed above /:id routes to avoid routing conflicts

// Admin fetches all pending screenshots
router.get('/results/pending', protect, admin, getPendingResults);

// Admin approves (Auto-Payout) or rejects a screenshot
router.put('/results/:resultId/verify', protect, admin, verifyMatchResult);


// ==========================================
// 🎮 STANDARD TOURNAMENT ROUTES
// ==========================================
router.get('/', protect, getTournaments);
router.post('/', protect, admin, createTournament);


// ==========================================
// ⚔️ TOURNAMENT SPECIFIC ACTIONS (/:id)
// ==========================================
router.post('/:id/join', protect, joinTournament);

// 🚀 NEW: Player submits their match result screenshot
router.post('/:id/submit-result', protect, submitMatchResult);

router.put('/:id', protect, admin, updateTournament);
router.post('/:id/winner', protect, admin, declareWinner);
router.delete('/:id', protect, admin, deleteTournament);

module.exports = router;