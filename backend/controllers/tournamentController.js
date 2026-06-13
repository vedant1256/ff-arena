// backend/controllers/tournamentController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken'); 

const ADMIN_EMAILS = [
  "vedantjadhav30.7.2007@gmail.com",
  "shrikrishnadevkar60@gmail.com",
  "parthpronarkhede@gmail.com"
];

// 1. Fetch All Tournaments (WITH SMART PAYWALL & ADMIN DECODER)
const getTournaments = async (req, res) => {
  try {
    let userId = req.user?.id || null;
    let userRole = req.user?.role || null;
    let userEmail = req.user?.email || null;

    // Manually decode token if req.user is missing (because it's a public route)
    if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (user) {
          userId = user.id;
          userRole = user.role;
          userEmail = user.email;
        }
      } catch (err) {
        console.error("Token decode failed:", err.message);
      }
    }

    // 🚀 FIXED: Backend now perfectly recognizes your email as an Admin!
    const isAdmin = userRole === 'ADMIN' || (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase()));

    const tournaments = await prisma.tournament.findMany({
      orderBy: { scheduledAt: 'desc' },
      include: { participants: { select: { id: true, username: true, freeFireUid: true } } }
    });
    
    // 🛡️ SECURE PAYWALL: Check participation for EACH tournament
    const safeTournaments = tournaments.map(t => {
      const isParticipant = userId && t.participants.some(p => p.id === userId);

      if (isAdmin) {
        return t; // Admin sees everything (Room details + Participant List)
      } else if (isParticipant) {
        // Paid player sees Room Details, but hide other players' private data
        const { participants, ...participantData } = t;
        return participantData; 
      } else {
        // Public/Unpaid player sees NO Room Details and NO participants list
        const { roomId, roomPassword, participants, ...publicData } = t;
        return publicData;
      }
    });

    res.status(200).json(safeTournaments);
  } catch (error) {
    console.error("Fetch Tournaments Error:", error);
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
};

// 2. Fetch Single Tournament 
const getTournamentById = async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: { participants: { select: { id: true } } } 
    });

    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    let userId = req.user?.id || null;
    let userRole = req.user?.role || null;
    let userEmail = req.user?.email || null;

    if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (user) {
          userId = user.id;
          userRole = user.role;
          userEmail = user.email;
        }
      } catch (err) {
        console.error("Soft Auth token decode failed:", err.message);
      }
    }

    const isAdmin = userRole === 'ADMIN' || (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase()));
    const isParticipant = userId && tournament.participants.some(p => p.id === userId);

    if (!isAdmin && !isParticipant) {
      delete tournament.roomId;
      delete tournament.roomPassword;
    }

    res.status(200).json(tournament);
  } catch (error) {
    console.error("Fetch Tournament By ID Error:", error);
    res.status(500).json({ error: 'Failed to fetch tournament details' });
  }
};

// 3. Create a Tournament
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

// 4. Join a Tournament
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

// 5. Update Tournament Details
const updateTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, roomId, roomPassword, isRoomReleased } = req.body;

    const tournament = await prisma.tournament.update({
      where: { id },
      data: { status, roomId, roomPassword }
    });

    if (isRoomReleased && req.io) {
      req.io.emit('roomDataReleased', { tournamentId: tournament.id });
    }

    res.status(200).json({ message: 'Tournament updated successfully!', tournament });
  } catch (error) {
    console.error("Update Tournament Error:", error);
    res.status(500).json({ error: 'Failed to update tournament' });
  }
};

// 6. Declare Match Winner
const declareWinner = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const { winnerUid } = req.body;

    if (!winnerUid) return res.status(400).json({ error: "Winner Free Fire UID is required." });

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return res.status(404).json({ error: "Tournament not found." });
    if (tournament.status === 'COMPLETED') return res.status(400).json({ error: "Winner has already been declared for this match." });

    const winner = await prisma.user.findFirst({ where: { freeFireUid: winnerUid } });
    if (!winner) return res.status(404).json({ error: `No player found on this platform with Free Fire UID: ${winnerUid}` });

    await prisma.$transaction([
      prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'COMPLETED' }
      }),
      prisma.user.update({
        where: { id: winner.id },
        data: { walletBalance: { increment: tournament.prizePool } }
      }),
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

// 7. Delete a tournament
const deleteTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    await prisma.tournament.delete({ where: { id } });
    res.status(200).json({ message: 'Tournament deleted successfully.' });
  } catch (error) {
    console.error("Delete Tournament Error:", error);
    res.status(500).json({ error: 'Failed to delete tournament.' });
  }
};

module.exports = { getTournaments, getTournamentById, createTournament, joinTournament, updateTournament, declareWinner, deleteTournament };