// backend/controllers/adminController.js
const prisma = require('../config/db');

// @desc    Update tournament details & Broadcast Room Data
// @route   PUT /api/admin/tournaments/:id
const updateTournament = async (req, res) => {
    try {
        const { roomId, roomPassword, status } = req.body;
        const tournamentId = req.params.id;

        const updatedTournament = await prisma.tournament.update({
            where: { id: tournamentId },
            data: { roomId, roomPassword, status }
        });

        // LIVE BROADCAST: If room details are added, send them to all connected players instantly
        if (roomId && roomPassword) {
            req.io.emit('roomDataReleased', {
                tournamentId: updatedTournament.id,
                title: updatedTournament.title,
                roomId: updatedTournament.roomId,
                roomPassword: updatedTournament.roomPassword
            });
        }

        res.status(200).json({ 
            message: 'Tournament updated successfully!', 
            tournament: updatedTournament 
        });
    } catch (error) {
        console.error("Error updating tournament:", error);
        res.status(500).json({ error: 'Server error updating tournament.' });
    }
};

// @desc    Get all players registered for a specific tournament
// @route   GET /api/admin/tournaments/:id/players
const getTournamentPlayers = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const participants = await prisma.tournamentParticipant.findMany({
            where: { tournamentId },
            include: {
                user: { select: { id: true, username: true, freeFireUid: true } }
            }
        });
        res.status(200).json(participants);
    } catch (error) {
        console.error("Error fetching players:", error);
        res.status(500).json({ error: 'Server error fetching players.' });
    }
};

// @desc    Get all users for Admin Panel
// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, username: true, email: true, freeFireUid: true, role: true, isBanned: true },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
};

// @desc    Ban or Unban a user
// @route   PUT /api/admin/users/:id/ban
const toggleBanUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { isBanned } = req.body;

        // Prevent admins from banning themselves
        if (userId === req.user.id) {
            return res.status(400).json({ error: "You cannot ban yourself." });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { isBanned }
        });

        res.status(200).json({ message: `User ${isBanned ? 'banned' : 'unbanned'} successfully!`, user: updatedUser });
    } catch (error) {
        console.error("Error toggling ban:", error);
        res.status(500).json({ error: 'Failed to update user ban status.' });
    }
};

module.exports = { updateTournament, getTournamentPlayers, getAllUsers, toggleBanUser };