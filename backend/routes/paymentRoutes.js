const express = require('express');
const { protect } = require('../middleware/auth');
const { submitUtr, getPaymentStatus } = require('../controllers/paymentController');

const router = express.Router();

router.post('/submit-utr', protect, submitUtr);
router.get('/status/:tournamentId', protect, getPaymentStatus);

module.exports = router;
