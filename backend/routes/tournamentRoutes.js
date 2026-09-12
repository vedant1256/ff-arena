// backend/routes/tournamentRoutes.js
const express = require('express');
const router = express.Router();

const { 
  getTournaments, 
  getTournamentById,
  createTournament, 
  joinTournament, 
  updateTournament, 
  declareWinner, 
  deleteTournament,
  submitMatchResult,     
  getPendingResults,     
  verifyMatchResult,     
  getPendingJoinRequests,
  verifyJoinRequest,
  getRoomCredentials
} = require('../controllers/tournamentController');

const { protect, admin } = require('../middleware/auth');

// ==========================================
// 🎮 STANDARD TOURNAMENT ROUTES
// ==========================================
router.get('/', getTournaments);
router.get('/:id', getTournamentById);
router.get('/:id/room-credentials', protect, getRoomCredentials);

// 💰 UTR Verification Join
router.post('/:id/join', protect, joinTournament); 

// 📸 Player submits result
router.post('/:id/submit-result', protect, submitMatchResult); 

// ==========================================
// 🛡️ ADMIN VERIFICATION ROUTES (Join Requests)
// ==========================================
// IMPORTANT: Place these before /:id generic routes if there's overlap, but here they are prefixed with /admin
router.get('/admin/join-requests', protect, admin, getPendingJoinRequests);
router.post('/admin/join-requests/:requestId/verify', protect, admin, verifyJoinRequest);

// ==========================================
// 🛡️ ADMIN VERIFICATION ROUTES (Match Results)
// ==========================================
router.get('/admin/pending-results', protect, admin, getPendingResults);
router.post('/admin/verify-result/:resultId', protect, admin, verifyMatchResult);

// ==========================================
// 🛡️ ADMIN CORE MATCH MANAGEMENT
// ==========================================
router.post('/', protect, admin, createTournament);
router.put('/:id', protect, admin, updateTournament);
router.post('/:id/declare-winner', protect, admin, declareWinner);
router.delete('/:id', protect, admin, deleteTournament);

module.exports = router;