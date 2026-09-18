// backend/controllers/authController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 🛑 Razorpay Restricted States
const RESTRICTED_STATES = [
  "Andhra Pradesh", "Assam", "Odisha", "Telangana", "Nagaland", "Sikkim"
];
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const registerUser = async (req, res) => {
  try {
    // 🚀 NEW: Added referralCode to the incoming request body
    const { username, email, password, hasAcceptedTerms, state, referralCode } = req.body;

    if (!username || !email || !password || !state) {
      return res.status(400).json({ error: 'Please fill all required fields.' });
    }

    if (RESTRICTED_STATES.includes(state)) {
      return res.status(403).json({ error: 'Cash tournaments are banned in your state. Registration not allowed.' });
    }

    if (hasAcceptedTerms !== true) {
      return res.status(403).json({ error: 'You must confirm that you are 18+ and agree to the Terms & Conditions.' });
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // 🚀 NEW: Check if the provided referral code belongs to a valid user
    let referredById = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } });
      if (referrer) referredById = referrer.id;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword, 
        hasAcceptedTerms: true,
        termsAcceptedAt: new Date(),
        state: state, // 🚀 NEW: Save the user's state permanently
        referredBy: referredById // 🚀 NEW: Link the accounts silently
      },
    });

    if (user) {
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        hasAcceptedTerms: user.hasAcceptedTerms,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ error: 'Failed to create user account.' });
    }
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(401).json({ error: 'Invalid email or password credentials.' });
    
    if (!user.passwordHash) return res.status(401).json({ error: 'This account was created with Google. Please use Google Login.' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (isMatch) {
      res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        hasAcceptedTerms: user.hasAcceptedTerms,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password credentials.' });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

const googleLogin = async (req, res) => {
  try {
    let { email, name, displayName, googleId, uid, access_token, state, hasAcceptedTerms, referralCode } = req.body;

    if (access_token && !email) {
      const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const googleData = await googleResponse.json();
      if (!googleData.email) return res.status(400).json({ error: 'Google Authentication failed. Invalid access token.' });
      
      email = googleData.email;
      name = googleData.name || googleData.given_name;
      googleId = googleData.sub;
    }

    if (!email) return res.status(400).json({ error: 'Google Authentication failed. Email is missing.' });

    const finalName = name || displayName || email.split('@')[0];
    const finalGoogleId = googleId || uid || email;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // 🚀 Validate state and terms ONLY for new signups
      if (!state || RESTRICTED_STATES.includes(state)) {
        return res.status(403).json({ error: 'Cash tournaments are banned in your state. Registration not allowed.' });
      }

      if (hasAcceptedTerms !== true) {
        return res.status(403).json({ error: 'You must confirm that you are 18+ and agree to the Terms & Conditions.' });
      }

      const safeUsername = finalName.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 10000);
      
      let referredById = null;
      if (referralCode) {
        const referrer = await prisma.user.findUnique({ where: { referralCode } });
        if (referrer) referredById = referrer.id;
      }

      user = await prisma.user.create({
        data: {
          username: safeUsername,
          email: email,
          passwordHash: await bcrypt.hash(finalGoogleId + process.env.JWT_SECRET, 10), 
          hasAcceptedTerms: true,
          termsAcceptedAt: new Date(),
          state: state, 
          referredBy: referredById 
        },
      });
    }

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      hasAcceptedTerms: user.hasAcceptedTerms,
      token: generateToken(user.id),
    });
  } catch (error) {
    // 🛡️ SECURITY PATCH: Never leak internal error details to the client
    console.error("Detailed Google Login Error:", error.message || error);
    res.status(500).json({ error: 'Google login failed. Please try again later.' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        depositBalance: true,  
        winningBalance: true,  
        bonusBalance: true,    
        freeFireUid: true,
        hasAcceptedTerms: true,
        referralCode: true // 🚀 NEW: Sent to frontend so players can share their code!
      }
    });
    
    if (!user) return res.status(404).json({ error: 'User profile not found.' });
    res.status(200).json(user);
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ error: 'Server error while fetching profile details.' });
  }
};

const acceptTerms = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { hasAcceptedTerms: true, termsAcceptedAt: new Date() },
      select: { id: true, hasAcceptedTerms: true }
    });
    res.status(200).json({ message: "Arena Rules accepted successfully", user });
  } catch (error) {
    console.error("Accept Terms Error:", error);
    res.status(500).json({ error: "Failed to update agreement status." });
  }
};

// 🏆 NEW: Fetch Top 10 Players for Leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const topPlayers = await prisma.user.findMany({
      where: { role: 'PLAYER' }, // Hide Admins from the leaderboard
      orderBy: { paidMatchesCount: 'desc' }, // Rank by most matches played
      take: 10, // Top 10 only
      select: {
        id: true,
        username: true,
        paidMatchesCount: true
        // 🛡️ SECURITY PATCH: winningBalance removed — financial data is private
      }
    });
    
    res.status(200).json(topPlayers);
  } catch (error) {
    console.error("Leaderboard Fetch Error:", error);
    res.status(500).json({ error: 'Server error while fetching leaderboard.' });
  }
};

module.exports = { registerUser, loginUser, googleLogin, getMe, acceptTerms, getLeaderboard };