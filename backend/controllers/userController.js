// backend/controllers/userController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updateProfile = async (req, res) => {
  try {
    const { freeFireUid } = req.body;
    
    // Fixed: Your auth.js uses req.user.id, not req.user.userId
    const userId = req.user.id; 

    // 🛡️ SECURITY PATCH: Validate Free Fire UID format
    if (!freeFireUid || typeof freeFireUid !== 'string') {
      return res.status(400).json({ error: 'Free Fire UID is required.' });
    }
    const sanitizedUid = freeFireUid.trim();
    if (!/^\d{1,12}$/.test(sanitizedUid)) {
      return res.status(400).json({ error: 'Free Fire UID must be numeric and at most 12 digits.' });
    }

    // Update the user in the Neon database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { freeFireUid: sanitizedUid },
      // 🛡️ SECURITY PATCH: Only return safe fields, never passwordHash or balances
      select: { id: true, username: true, email: true, freeFireUid: true }
    });

    res.status(200).json({ message: 'Profile updated successfully!', user: updatedUser });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ error: 'Server error while saving profile.' });
  }
};

module.exports = { updateProfile };