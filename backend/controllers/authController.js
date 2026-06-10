// backend/controllers/authController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ADMIN_EMAILS = [
  "vedantjadhav30.7.2007@gmail.com",
  "shrikrishnadevkar60@gmail.com",
  "parthpronarkhede@gmail.com"
];

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  try {
    const { username, email, password, hasAcceptedTerms } = req.body;

    if (!hasAcceptedTerms) return res.status(400).json({ error: "You must read and agree to the Arena Rules & Terms." });

    const userExists = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (userExists) return res.status(400).json({ error: "Username or Email already exists." });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const assignedRole = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'ADMIN' : 'PLAYER';

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: assignedRole,
        hasAcceptedTerms: true,
        termsAcceptedAt: new Date(), 
      }
    });

    res.status(201).json({ id: user.id, username: user.username, email: user.email, role: user.role, token: generateToken(user.id) });
  } catch (error) {
    res.status(500).json({ error: "Server error during registration." });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const isAssignedAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());
      const needsAdminUpgrade = isAssignedAdmin && user.role !== 'ADMIN';

      if (!user.hasAcceptedTerms || needsAdminUpgrade) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            role: isAssignedAdmin ? 'ADMIN' : user.role,
            hasAcceptedTerms: true,
            termsAcceptedAt: user.termsAcceptedAt || new Date()
          }
        });
      }
      res.json({ id: user.id, username: user.username, email: user.email, role: user.role, token: generateToken(user.id) });
    } else {
      res.status(401).json({ error: "Invalid credentials." });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error during login." });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { access_token, hasAcceptedTerms } = req.body;

    if (!access_token) return res.status(400).json({ error: "Google token missing from request." });

    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    if (!googleResponse.ok) return res.status(400).json({ error: "Google rejected the authentication token. Please try again." });

    const googleUser = await googleResponse.json();
    if (!googleUser || !googleUser.email) return res.status(400).json({ error: "Failed to securely fetch your email from Google." });

    let user = await prisma.user.findUnique({ where: { email: googleUser.email } });
    const isAssignedAdmin = ADMIN_EMAILS.includes(googleUser.email.toLowerCase());

    if (!user) {
      if (!hasAcceptedTerms) {
        // Returns 200 instead of 403 to bypass strict frontend Axios interceptors
        return res.status(200).json({ 
          requiresTerms: true, 
          message: "Please accept the Arena Rules to create your account." 
        });
      }

      const safeName = googleUser.name ? googleUser.name.replace(/[^a-zA-Z0-9]/g, '') : googleUser.email.split('@')[0];
      const uniqueUsername = `${safeName}${Math.floor(Math.random() * 10000)}`;

      user = await prisma.user.create({
        data: {
          username: uniqueUsername,
          email: googleUser.email,
          passwordHash: '', 
          role: isAssignedAdmin ? 'ADMIN' : 'PLAYER',
          hasAcceptedTerms: true,
          termsAcceptedAt: new Date(),
        }
      });
    } else {
       const needsAdminUpgrade = isAssignedAdmin && user.role !== 'ADMIN';

       if (!user.hasAcceptedTerms || needsAdminUpgrade) {
         user = await prisma.user.update({
           where: { id: user.id },
           data: {
             role: isAssignedAdmin ? 'ADMIN' : user.role,
             hasAcceptedTerms: true,
             termsAcceptedAt: user.termsAcceptedAt || new Date()
           }
         });
       }
    }

    res.json({ id: user.id, username: user.username, email: user.email, role: user.role, token: generateToken(user.id) });
  } catch (error) {
    res.status(500).json({ error: "Server encountered a critical error during Google authentication." });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, email: true, role: true, freeFireUid: true, walletBalance: true, hasAcceptedTerms: true }
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user data." });
  }
};

module.exports = { registerUser, loginUser, googleLogin, getMe };