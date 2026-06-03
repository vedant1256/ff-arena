const express = require("express");
const router = express.Router();
const Tournament = require("../models/Tournament");
const { Payment } = require("../models/Payment");
const { protect } = require("../middleware/auth");

// ==================== SUBMIT PAYMENT (after UPI pay) ====================
// POST /api/payments/submit
router.post("/submit", protect, async (req, res) => {
  try {
    const { tournamentId, utrId } = req.body;

    if (!tournamentId || !utrId) {
      return res.status(400).json({ success: false, message: "Tournament ID and UTR are required" });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    if (tournament.status === "completed" || tournament.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Tournament is no longer accepting entries" });
    }

    if (tournament.participants.length >= tournament.slots) {
      return res.status(400).json({ success: false, message: "Tournament is full" });
    }

    // Check if already joined
    const alreadyJoined = tournament.participants.find(
      (p) => p.userId.toString() === req.user._id.toString()
    );
    if (alreadyJoined) {
      return res.status(400).json({ success: false, message: "Already joined this tournament" });
    }

    // Check if payment already submitted
    const existingPayment = await Payment.findOne({
      tournamentId,
      userId: req.user._id,
      status: { $in: ["pending", "approved"] },
    });
    if (existingPayment) {
      return res.status(400).json({ success: false, message: "Payment already submitted" });
    }

    // Create payment record
    const payment = await Payment.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      ffUID: req.user.ffUID,
      tournamentId,
      tournamentName: tournament.name,
      amount: tournament.entryFee,
      utrId: utrId.trim(),
    });

    // Emit to admin via socket
    const io = req.app.get("io");
    io.emit("new_payment_request", {
      paymentId: payment._id,
      userName: req.user.name,
      tournamentName: tournament.name,
      amount: tournament.entryFee,
      utrId,
    });

    res.status(201).json({
      success: true,
      message: "Payment submitted! Waiting for admin approval.",
      data: payment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== GET MY PAYMENTS ====================
// GET /api/payments/my
router.get("/my", protect, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
