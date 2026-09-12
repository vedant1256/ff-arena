const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const submitUtr = async (req, res) => {
  try {
    const { tournamentId, utr } = req.body;
    const userId = req.user.id;

    if (!utr || !/^\d{12}$/.test(utr.trim())) {
      return res.status(400).json({ error: 'Valid 12-digit numeric Transaction ID (UTR) is required.' });
    }

    const user = await prisma.user.findUnique({ 
        where: { id: userId },
        include: { tournaments: true } 
    });
    
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });

    if (!tournament) return res.status(404).json({ error: 'Tournament not found.' });
    if (tournament.status !== 'REGISTRATION_OPEN') return res.status(400).json({ error: 'Match registration is closed.' });
    if (tournament.currentParticipants >= tournament.maxParticipants) return res.status(400).json({ error: 'This tournament is full!' });
    if (!user.freeFireUid) return res.status(400).json({ error: 'Please set your Free Fire UID in your Profile first!' });

    const alreadyJoined = user.tournaments?.some(t => t.id === tournamentId);
    if (alreadyJoined) return res.status(400).json({ error: 'You are already registered for this match.' });

    const existingPayment = await prisma.paymentTransaction.findFirst({
      where: { userId, tournamentId, status: { in: ['PENDING_VERIFICATION', 'APPROVED'] } }
    });
    if (existingPayment) return res.status(400).json({ error: 'You already have a pending or approved payment for this match.' });

    // Check if this UTR is already in UnclaimedDeposit (which means the webhook fired BEFORE the user submitted)
    const unclaimed = await prisma.unclaimedDeposit.findUnique({
      where: { utr: utr.trim() }
    });

    let status = 'PENDING_VERIFICATION';
    let creditedAmount = null;

    if (unclaimed) {
      // Fast-track approval if webhook arrived early and amount matches
      if (unclaimed.amount >= tournament.entryFee) {
        status = 'APPROVED';
        creditedAmount = unclaimed.amount;

        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { tournaments: { connect: { id: tournamentId } } }
          }),
          prisma.tournament.update({
            where: { id: tournamentId },
            data: { currentParticipants: { increment: 1 } }
          }),
          prisma.unclaimedDeposit.delete({ where: { id: unclaimed.id } })
        ]);
      } else {
        status = 'FAILED_MISMATCH';
        creditedAmount = unclaimed.amount;
        await prisma.unclaimedDeposit.delete({ where: { id: unclaimed.id } });
      }
    }

    const paymentTransaction = await prisma.paymentTransaction.create({
      data: {
        userId,
        tournamentId,
        submittedUtr: utr.trim(),
        expectedAmount: tournament.entryFee,
        creditedAmount,
        status,
        verifiedAt: status !== 'PENDING_VERIFICATION' ? new Date() : null
      }
    });

    res.status(200).json({ 
      message: status === 'APPROVED' ? 'Payment auto-verified successfully!' : 'UTR submitted successfully! Waiting for verification.',
      status: paymentTransaction.status
    });
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('submittedUtr')) {
      return res.status(400).json({ error: 'This UTR has already been submitted by someone.' });
    }
    console.error("Submit UTR Error:", error);
    res.status(500).json({ error: 'Server error while submitting join request.' });
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const userId = req.user.id;

    const payment = await prisma.paymentTransaction.findFirst({
      where: { userId, tournamentId },
      orderBy: { createdAt: 'desc' }
    });

    if (!payment) return res.status(404).json({ error: 'No payment found' });

    res.status(200).json({ status: payment.status });
  } catch (error) {
    console.error("Get Payment Status Error:", error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
};

module.exports = {
  submitUtr,
  getPaymentStatus
};
