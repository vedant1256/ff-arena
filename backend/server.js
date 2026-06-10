// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const walletRoutes = require('./routes/walletRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes'); 

const app = express();
const server = http.createServer(app);

// 🚀 THE BULLETPROOF CORS ARRAY
const allowedOrigins = [
  'http://localhost:3000',
  'https://ff-arena-dfd5.vercel.app'
];

// Fallback just in case you update your Render environment variable later
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// 1. Initialize the Live Socket Engine
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true
    }
});

// 2. Inject Socket.io into every request so controllers can broadcast
app.use((req, res, next) => {
    req.io = io;
    next();
});

// 3. Configure Express CORS for the REST API
app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes); 

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`🚀 Server and Socket Engine running on port ${PORT}`));