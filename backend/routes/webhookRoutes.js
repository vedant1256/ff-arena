const express = require('express');
const { handleSmsWebhook } = require('../controllers/webhookController');

const router = express.Router();

// Webhook endpoint for SMS automation
router.post('/sms-payment', handleSmsWebhook);

module.exports = router;
