// backend/controllers/walletController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay with your API keys
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// @desc    Get logged-in user's triple wallet balances & history
// @route   GET /api/wallet
const getWallet = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { 
                depositBalance: true,
                winningBalance: true,
                bonusBalance: true
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        const transactions = await prisma.transaction.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Calculate total combined balance for the frontend's main display
        const totalBalance = (user.depositBalance || 0) + (user.winningBalance || 0) + (user.bonusBalance || 0);

        res.status(200).json({ 
            balance: totalBalance, // Keeps your current frontend from breaking
            depositBalance: user.depositBalance || 0,
            winningBalance: user.winningBalance || 0,
            bonusBalance: user.bonusBalance || 0,
            transactions 
        });
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
            // Mark transaction as failed if signature doesn't match
            await prisma.transaction.update({
                where: { razorpayOrderId: razorpay_order_id },
                data: { status: 'FAILED' }
            });
            return res.status(400).json({ error: "Invalid payment signature!" });
        }

        const pendingTx = await prisma.transaction.findUnique({ 
            where: { razorpayOrderId: razorpay_order_id } 
        });
        
        if (!pendingTx || pendingTx.status === 'SUCCESS') {
            return res.status(400).json({ error: 'Transaction invalid or already processed.' });
        }

        // 💰 UPDATED: Add money strictly to the depositBalance
        await prisma.$transaction([
            prisma.transaction.update({
                where: { razorpayOrderId: razorpay_order_id },
                data: { status: 'SUCCESS', razorpayPaymentId: razorpay_payment_id }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { depositBalance: { increment: pendingTx.amount } }
            })
        ]);

        res.status(200).json({ message: "Payment verified successfully!" });
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ error: 'Server error verifying payment.' });
    }
};

// @desc    Step 3: Request Withdrawal
// @route   POST /api/wallet/withdraw
const requestWithdrawal = async (req, res) => {
    try {
        const { amount, upiId } = req.body;
        const userId = req.user.id;

        if (!amount || amount < 100) return res.status(400).json({ error: 'Minimum withdrawal is ₹100.' });
        if (!upiId) return res.status(400).json({ error: 'UPI ID is required.' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        if (user.winningBalance < amount) {
            return res.status(400).json({ error: 'Insufficient winning balance.' });
        }

        // 🛡️ SECURITY PATCH: Atomic Database Lock to prevent negative balance race conditions
        const result = await prisma.$transaction(async (tx) => {
            const updatedUser = await tx.user.updateMany({
                where: { 
                    id: userId,
                    winningBalance: { gte: amount } // The DB strictly enforces the balance check
                },
                data: { winningBalance: { decrement: amount } }
            });

            if (updatedUser.count === 0) {
                throw new Error("Insufficient balance or concurrent transaction detected.");
            }

            const pendingTx = await tx.transaction.create({
                data: {
                    userId,
                    amount,
                    type: 'DEBIT',
                    status: 'PENDING',
                    description: 'Withdrawal to UPI',
                    upiId
                }
            });

            return pendingTx;
        });

        res.status(200).json({ message: "Withdrawal request submitted successfully!" });
    } catch (error) {
        if (error.message === "Insufficient balance or concurrent transaction detected.") {
            return res.status(400).json({ error: error.message });
        }
        console.error("Withdrawal Request Error:", error);
        res.status(500).json({ error: 'Server error requesting withdrawal.' });
    }
};

module.exports = { getWallet, createOrder, verifyPayment, requestWithdrawal };