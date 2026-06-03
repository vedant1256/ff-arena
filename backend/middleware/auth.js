// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // SAFETY CHECK: Prevent "jwt malformed" crashes if frontend sends string "undefined" or "null"
      if (!token || token === 'undefined' || token === 'null') {
        return res.status(401).json({ error: 'Not authorized, invalid token format' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach the user to the request, excluding the password hash
      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true, email: true, role: true, isBanned: true }
      });

      if (!req.user) {
        return res.status(401).json({ error: 'Not authorized, user no longer exists' });
      }

      if (req.user.isBanned) {
        return res.status(403).json({ error: 'Your account has been banned from the platform.' });
      }

      next();
    } catch (error) {
      // Cleanly catch the error without crashing the server terminal
      return res.status(401).json({ error: 'Not authorized, token failed or expired' });
    }
  } else {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Not authorized. Overseer access required.' });
  }
};

module.exports = { protect, admin };