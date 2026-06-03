// backend/routes/walletRoutes.js
const express = require('express');
const { getWallet, createOrder, verifyPayment } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getWallet);
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

module.exports = router;