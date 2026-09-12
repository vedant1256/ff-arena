// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // 🛡️ NEW: Helmet for Header Security
const rateLimit = require('express-rate-limit'); // 🛡️ NEW: Rate Limiter
const http = require('http'); 
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const walletRoutes = require('./routes/walletRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const userRoutes = require('./routes/userRoutes'); 

const app = express();
const server = http.createServer(app);

// 🚀 THE BULLETPROOF CORS ARRAY
const allowedOrigins = [
  'http://localhost:3000',
  'https://vps-esportshub-dfd5.vercel.app'
];

// Fallback just in case you update your Render environment variable later
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// ==========================================
// 🛡️ 3-LAYER SECURITY GUARDS
// ==========================================

// Guard 1: HELMET (Hides your tech stack and secures HTTP headers)
app.use(helmet());

// Guard 2: CORS (Blocks fake frontends/hackers from accessing your API)
app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));

// Guard 3: RATE LIMITER (Prevents DDoS, Spamming, and Bot attacks)
// General API Limit: 150 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 150, 
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

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

app.use(express.json());

// ==========================================
// 🛣️ ROUTES & SPECIFIC RATE LIMITS
// ==========================================

// Strict Limit for Auth Routes (Prevents Brute Force Password attacks)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Hour
  max: 15, // Max 15 login/register attempts per hour per IP
  message: { error: 'Too many login attempts. Please try again after 1 hour.' }
});

// Protect Auth Routes
app.use('/api/auth', authLimiter, authRoutes); 

// Limit for Tournaments (Prevents API Spamming)
const tournamentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Hour
  max: 200, // Reasonable limit so users can browse tournaments without getting blocked
  message: { error: 'Tournament API limit reached. Please try again later.' }
});

app.use('/api/tournaments', tournamentLimiter, tournamentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/users', userRoutes); 

// ==========================================
// 💬 REAL-TIME CHAT & SOCKET CONNECTIONS
// ==========================================
io.on('connection', (socket) => {
  console.log('User connected to socket:', socket.id);

  // 🚀 NAYA CHAT LISTENER: Jab koi message bheje, sabko broadcast kardo
  socket.on('sendMessage', (messageData) => {
    io.emit('receiveMessage', messageData); 
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`🚀 Server and Socket Engine running on port ${PORT}`));