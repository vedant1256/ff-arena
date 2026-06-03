// backend/controllers/walletController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay with your API keys (we will use these in the final task)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// @desc    Get logged-in user's wallet balance & history
// @route   GET /api/wallet
const getWallet = async (req, res) => {
    try {
        // Unifying the balance to pull directly from the User table
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { walletBalance: true }
        });

        const transactions = await prisma.transaction.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // If walletBalance is null/undefined, default to 0
        res.status(200).json({ balance: user.walletBalance || 0, transactions });
    } catch (error) {
        console.error("Error fetching wallet:", error);
        res.status(500).json({ error: 'Server error fetching wallet.' });
    }
};

// @desc    Step 1: Create a Razorpay Order
// @route   POST /api/wallet/create-order
const createOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount.' });

        const options = {
            amount: amount * 100, // Razorpay uses paise
            currency: "INR",
            receipt: `rcpt_${req.user.id}_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        // Log the pending transaction
        await prisma.transaction.create({
            data: {
                userId: req.user.id,
                amount: parseFloat(amount),
                type: 'DEPOSIT',
                status: 'PENDING',
                razorpayOrderId: order.id
            }
        });

        res.status(200).json(order);
    } catch (error) {
        console.error("Order Creation Error:", error);
        res.status(500).json({ error: 'Failed to create payment order.' });
    }
};

// @desc    Step 2: Verify Razorpay Payment Signature
// @route   POST /api/wallet/verify
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const userId = req.user.id;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            await prisma.transaction.update({
                where: { razorpayOrderId: razorpay_order_id },
                data: { status: 'FAILED' }
            });
            return res.status(400).json({ error: "Invalid payment signature!" });
        }

        const pendingTx = await prisma.transaction.findUnique({ where: { razorpayOrderId: razorpay_order_id } });
        
        if (!pendingTx || pendingTx.status === 'SUCCESS') {
            return res.status(400).json({ error: 'Transaction invalid or already processed.' });
        }

        // Add money to the USER table safely
        await prisma.$transaction([
            prisma.transaction.update({
                where: { razorpayOrderId: razorpay_order_id },
                data: { status: 'SUCCESS', razorpayPaymentId: razorpay_payment_id }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { walletBalance: { increment: pendingTx.amount } }
            })
        ]);

        res.status(200).json({ message: "Payment verified successfully!" });
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ error: 'Server error verifying payment.' });
    }
};

module.exports = { getWallet, createOrder, verifyPayment };