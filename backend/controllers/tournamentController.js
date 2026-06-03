// backend/controllers/tournamentController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Fetch All Tournaments
const getTournaments = async (req, res) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { scheduledAt: 'desc' }
    });
    res.status(200).json(tournaments);
  } catch (error) {
    console.error("Fetch Tournaments Error:", error);
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
};

// 2. Create a Tournament
const createTournament = async (req, res) => {
  try {
    const tournament = await prisma.tournament.create({
      data: req.body
    });
    if(req.io) req.io.emit('tournamentCreated', tournament);
    res.status(201).json(tournament);
  } catch (error) {
    console.error("Create Tournament Error:", error);
    res.status(500).json({ error: 'Failed to create tournament' });
  }
};

// 3. Join a Tournament
const joinTournament = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const userId = req.user.id;

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

    if (user.walletBalance < tournament.entryFee) {
      return res.status(400).json({ error: 'Insufficient funds. Please recharge your wallet.' });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          walletBalance: { decrement: tournament.entryFee },
          tournaments: { connect: { id: tournamentId } } 
        }
      }),
      prisma.transaction.create({
        data: {
          userId: userId,
          amount: tournament.entryFee,
          type: 'DEBIT',
          description: `Entry Fee: ${tournament.title}`
        }
      }),
      prisma.tournament.update({
        where: { id: tournamentId },
        data: { currentParticipants: { increment: 1 } }
      })
    ]);

    res.status(200).json({ message: 'Successfully joined the match!' });
  } catch (error) {
    console.error("Join Tournament Error:", error);
    res.status(500).json({ error: 'Server error while joining tournament.' });
  }
};

// 4. Update Tournament Details / Release Room
const updateTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, roomId, roomPassword, isRoomReleased } = req.body;

    const tournament = await prisma.tournament.update({
      where: { id },
      data: { status, roomId, roomPassword }
    });

    if (isRoomReleased && req.io) {
      req.io.emit('roomDataReleased', {
        tournamentId: tournament.id,
        title: tournament.title,
        roomId: tournament.roomId,
        roomPassword: tournament.roomPassword
      });
    }

    res.status(200).json({ message: 'Tournament updated successfully!', tournament });
  } catch (error) {
    console.error("Update Tournament Error:", error);
    res.status(500).json({ error: 'Failed to update tournament' });
  }
};

// 5. Declare Match Winner & Disburse Prize Pool
const declareWinner = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const { winnerUid } = req.body;

    if (!winnerUid) return res.status(400).json({ error: "Winner Free Fire UID is required." });

    // Find tournament and ensure it hasn't already been paid out
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return res.status(404).json({ error: "Tournament not found." });
    if (tournament.status === 'COMPLETED') return res.status(400).json({ error: "Winner has already been declared for this match." });

    // Find the player using their unique Free Fire Game UID
    const winner = await prisma.user.findFirst({ where: { freeFireUid: winnerUid } });
    if (!winner) return res.status(404).json({ error: `No player found on this platform with Free Fire UID: ${winnerUid}` });

    // Execute heavy transaction: Pay the winner and close the match simultaneously
    await prisma.$transaction([
      // A. Close the tournament status permanently
      prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'COMPLETED' }
      }),
      // B. Top up winner's account balance with the prize money
      prisma.user.update({
        where: { id: winner.id },
        data: { walletBalance: { increment: tournament.prizePool } }
      }),
      // C. File a credit history ledger record for their wallet auditing
      prisma.transaction.create({
        data: {
          userId: winner.id,
          amount: tournament.prizePool,
          type: 'CREDIT',
          description: `CHAMPION PRIZE: ${tournament.title}`
        }
      })
    ]);

    res.status(200).json({ message: `Payout successful! ₹${tournament.prizePool} credited to ${winner.username}.` });
  } catch (error) {
    console.error("Winner Declaration Error:", error);
    res.status(500).json({ error: "Server error executing match completion payout loop." });
  }
};

// 6. NEW: Delete a tournament permanently
const deleteTournament = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    // Delete it using Prisma
    await prisma.tournament.delete({ where: { id } });
    
    res.status(200).json({ message: 'Tournament deleted successfully.' });
  } catch (error) {
    console.error("Delete Tournament Error:", error);
    res.status(500).json({ error: 'Failed to delete tournament.' });
  }
};

module.exports = { getTournaments, createTournament, joinTournament, updateTournament, declareWinner, deleteTournament };