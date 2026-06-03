// backend/socket/index.js

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`🔌 New client connected: ${socket.id}`);

        // 1. User joins a specific tournament "room" for live updates
        socket.on('join-tournament', (tournamentId) => {
            socket.join(`tournament_${tournamentId}`);
            console.log(`User ${socket.id} joined tournament room: ${tournamentId}`);
        });

        // 2. User leaves the room
        socket.on('leave-tournament', (tournamentId) => {
            socket.leave(`tournament_${tournamentId}`);
            console.log(`User ${socket.id} left tournament room: ${tournamentId}`);
        });

        // 3. Handle Disconnect
        socket.on('disconnect', () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });
};