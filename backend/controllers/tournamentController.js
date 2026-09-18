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

    const isAdmin = userRole === 'ADMIN' || (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase()));

    const tournaments = await prisma.tournament.findMany({
      orderBy: { scheduledAt: 'desc' },
      include: { participants: { select: { id: true, username: true, freeFireUid: true } } }
    });
    
    const safeTournaments = tournaments.map(t => {
      const isParticipant = userId && t.participants.some(p => p.id === userId);

      if (isAdmin) {
        return t; 
      } else if (isParticipant) {
        const { roomId, roomPassword, participants, ...participantData } = t;
        return participantData; 
      } else {
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

    let isPendingVerification = false;

    if (!isAdmin) {
      delete tournament.roomId;
      delete tournament.roomPassword;
    }

    if (!isAdmin && !isParticipant && userId) {
      const pendingReq = await prisma.matchJoinRequest.findFirst({
        where: { userId, tournamentId: tournament.id, status: 'PENDING' }
      });
      if (pendingReq) isPendingVerification = true;
    }

    res.status(200).json({ ...tournament, isPendingVerification });
  } catch (error) {
    console.error("Fetch Tournament By ID Error:", error);
    res.status(500).json({ error: 'Failed to fetch tournament details' });
  }
};

// 2.5 🛡️ SECURE: Fetch Room Credentials
const getRoomCredentials = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const userId = req.user.id;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    // Enforce 15 minute time gate
    const msUntilStart = new Date(tournament.scheduledAt).getTime() - Date.now();
    const minutesUntilStart = msUntilStart / (1000 * 60);

    if (minutesUntilStart > 15) {
      return res.status(403).json({ error: 'Room details will be revealed 15 minutes before match start.' });
    }

    // Verify user is APPROVED via automated PaymentTransaction or is Admin
    const isAdmin = req.user.role === 'ADMIN' || (req.user.email && ADMIN_EMAILS.includes(req.user.email.toLowerCase()));
    
    if (!isAdmin) {
      const payment = await prisma.paymentTransaction.findFirst({
        where: { userId, tournamentId, status: 'APPROVED' }
      });
      
      // Fallback to manual join requests for legacy users
      const legacyPayment = await prisma.matchJoinRequest.findFirst({
        where: { userId, tournamentId, status: 'APPROVED' }
      });

      if (!payment && !legacyPayment) {
        return res.status(403).json({ error: 'You are not an approved participant for this match.' });
      }
    }

    res.status(200).json({ 
      roomId: tournament.roomId, 
      roomPassword: tournament.roomPassword 
    });

  } catch (error) {
    console.error("Get Room Credentials Error:", error);
    res.status(500).json({ error: 'Failed to fetch room credentials' });
  }
};

// 3. Create a Tournament
const createTournament = async (req, res) => {
  try {
    // 🛡️ SECURITY PATCH: Whitelist only allowed fields to prevent mass assignment
    const { title, description, gameName, map, teamMode, minLevel, entryFee, prizePool, maxParticipants, scheduledAt } = req.body;
    const tournament = await prisma.tournament.create({
      data: { title, description, gameName, map, teamMode, minLevel, entryFee, prizePool, maxParticipants, scheduledAt: new Date(scheduledAt) }
    });
    if(req.io) req.io.emit('tournamentCreated', { id: tournament.id, title: tournament.title });
    res.status(201).json(tournament);
  } catch (error) {
    console.error("Create Tournament Error:", error);
    res.status(500).json({ error: 'Failed to create tournament' });
  }
};

// 4. 💰 Submit UTR to Join a Tournament 
const joinTournament = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const userId = req.user.id;
    const { utr } = req.body;

    if (!utr || utr.trim().length === 0) {
      return res.status(400).json({ error: 'Transaction ID (UTR) is required.' });
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

    const pendingReq = await prisma.matchJoinRequest.findFirst({
      where: { userId, tournamentId, status: 'PENDING' }
    });
    if (pendingReq) return res.status(400).json({ error: 'You already have a pending verification request for this match.' });

    await prisma.matchJoinRequest.create({
      data: {
        userId,
        tournamentId,
        utr: utr.trim()
      }
    });

    res.status(200).json({ message: 'UTR submitted successfully! Admin will verify your payment soon.' });
  } catch (error) {
    console.error("Join Tournament Error:", error);
    res.status(500).json({ error: 'Server error while submitting join request.' });
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

    // 🛡️ SECURITY PATCH: Only emit notification, no credentials over socket
    if (isRoomReleased && req.io) {
      req.io.emit('roomDataReleased', { tournamentId: tournament.id, title: tournament.title });
    }

    res.status(200).json({ message: 'Tournament updated successfully!', tournament });
  } catch (error) {
    console.error("Update Tournament Error:", error);
    res.status(500).json({ error: 'Failed to update tournament' });
  }
};

// 6. Manual Winner Declaration (Kept as fallback for admins)
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
        data: { winningBalance: { increment: tournament.prizePool } }
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

    res.status(200).json({ message: `Payout successful! ₹${tournament.prizePool} credited to ${winner.username}'s Winning Wallet.` });
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

// ==========================================
// 📸 NEW: SCREENSHOT VERIFICATION SYSTEM 
// ==========================================

// 8. Player submits their screenshot URL
const submitMatchResult = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const userId = req.user.id;
    const { imageUrl } = req.body;

    if (!imageUrl) return res.status(400).json({ error: "Screenshot Image URL is required." });

    const tournament = await prisma.tournament.findUnique({ 
      where: { id: tournamentId }, 
      include: { participants: true } 
    });

    if (!tournament) return res.status(404).json({ error: "Tournament not found." });
    
    // Safety checks
    const isParticipant = tournament.participants.some(p => p.id === userId);
    if (!isParticipant) return res.status(403).json({ error: "You didn't participate in this match." });
    if (tournament.status === 'COMPLETED') return res.status(400).json({ error: "This match has already been settled." });

    // Check if player already submitted to prevent spam
    const existing = await prisma.matchResult.findUnique({
      where: { userId_tournamentId: { userId, tournamentId } }
    });

    if (existing) return res.status(400).json({ error: "You have already submitted a screenshot for this match." });

    await prisma.matchResult.create({
      data: { imageUrl, tournamentId, userId }
    });

    res.status(201).json({ message: "Screenshot submitted successfully! Admin will verify soon." });
  } catch (error) {
    console.error("Submit Result Error:", error);
    res.status(500).json({ error: "Failed to submit match result." });
  }
};

// 9. Admin fetches all pending verifications
const getPendingResults = async (req, res) => {
  try {
    const results = await prisma.matchResult.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { id: true, username: true, freeFireUid: true } },
        tournament: { select: { id: true, title: true, prizePool: true, status: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.status(200).json(results);
  } catch (error) {
    console.error("Fetch Pending Results Error:", error);
    res.status(500).json({ error: "Failed to fetch pending results." });
  }
};

// 10. Admin Approves or Rejects the screenshot (AUTO-PAYOUT)
const verifyMatchResult = async (req, res) => {
  try {
    const { resultId } = req.params;
    const { action } = req.body; // Expects 'APPROVE' or 'REJECT'

    const matchResult = await prisma.matchResult.findUnique({
      where: { id: resultId },
      include: { tournament: true, user: true }
    });

    if (!matchResult) return res.status(404).json({ error: "Result not found." });
    if (matchResult.status !== 'PENDING') return res.status(400).json({ error: "This result has already been processed." });

    // ❌ IF ADMIN REJECTS (Fake screenshot)
    if (action === 'REJECT') {
      await prisma.matchResult.update({
        where: { id: resultId },
        data: { status: 'REJECTED' }
      });
      return res.status(200).json({ message: "Screenshot rejected. Player will not receive the payout." });
    }

    // ✅ IF ADMIN APPROVES (Real Winner -> Auto Payout Engine)
    if (action === 'APPROVE') {
      if (matchResult.tournament.status === 'COMPLETED') {
        return res.status(400).json({ error: "A winner was already approved for this match." });
      }

      // 🚀 ATOMIC TRANSACTION: Does everything instantly safely
      await prisma.$transaction([
        // 1. Mark this specific screenshot as APPROVED
        prisma.matchResult.update({
          where: { id: resultId },
          data: { status: 'APPROVED' }
        }),
        // 2. Automatically mark all OTHER pending screenshots for this tournament as REJECTED
        prisma.matchResult.updateMany({
          where: { tournamentId: matchResult.tournamentId, id: { not: resultId }, status: 'PENDING' },
          data: { status: 'REJECTED' }
        }),
        // 3. Close the tournament
        prisma.tournament.update({
          where: { id: matchResult.tournamentId },
          data: { status: 'COMPLETED' }
        }),
        // 4. Inject money into the Winner's Wallet
        prisma.user.update({
          where: { id: matchResult.userId },
          data: { winningBalance: { increment: matchResult.tournament.prizePool } }
        }),
        // 5. Record the transaction
        prisma.transaction.create({
          data: {
            userId: matchResult.userId,
            amount: matchResult.tournament.prizePool,
            type: 'CREDIT',
            description: `CHAMPION PRIZE: ${matchResult.tournament.title}`
          }
        })
      ]);

      return res.status(200).json({ 
        message: `Payout Auto-Triggered! ₹${matchResult.tournament.prizePool} credited to ${matchResult.user.username}. Match closed.` 
      });
    }

    res.status(400).json({ error: "Invalid action. Use APPROVE or REJECT." });
  } catch (error) {
    console.error("Verify Result Error:", error);
    res.status(500).json({ error: "Server error during verification process." });
  }
};

// ==========================================
// 💸 NEW: MANUAL UTR VERIFICATION SYSTEM
// ==========================================

const getPendingJoinRequests = async (req, res) => {
  try {
    const requests = await prisma.matchJoinRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { id: true, username: true, freeFireUid: true } },
        tournament: { select: { id: true, title: true, entryFee: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.status(200).json(requests);
  } catch (error) {
    console.error("Fetch Pending Join Requests Error:", error);
    res.status(500).json({ error: "Failed to fetch requests." });
  }
};

const verifyJoinRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'APPROVE' or 'REJECT'

    const joinReq = await prisma.matchJoinRequest.findUnique({
      where: { id: requestId },
      include: { tournament: true, user: true }
    });

    if (!joinReq) return res.status(404).json({ error: "Request not found." });
    if (joinReq.status !== 'PENDING') return res.status(400).json({ error: "This request has already been processed." });

    if (action === 'REJECT') {
      await prisma.matchJoinRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' }
      });
      return res.status(200).json({ message: "Join request rejected." });
    }

    if (action === 'APPROVE') {
      if (joinReq.tournament.status !== 'REGISTRATION_OPEN') {
        return res.status(400).json({ error: "Tournament is no longer open for registration." });
      }
      if (joinReq.tournament.currentParticipants >= joinReq.tournament.maxParticipants) {
        return res.status(400).json({ error: "Tournament is full." });
      }

      await prisma.$transaction([
        prisma.matchJoinRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED' }
        }),
        prisma.user.update({
          where: { id: joinReq.userId },
          data: { tournaments: { connect: { id: joinReq.tournamentId } } }
        }),
        prisma.tournament.update({
          where: { id: joinReq.tournamentId },
          data: { currentParticipants: { increment: 1 } }
        })
      ]);

      return res.status(200).json({ message: `Player ${joinReq.user.username} approved and added to match.` });
    }

    res.status(400).json({ error: "Invalid action." });
  } catch (error) {
    console.error("Verify Join Request Error:", error);
    res.status(500).json({ error: "Server error during verification." });
  }
};

module.exports = { 
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
};