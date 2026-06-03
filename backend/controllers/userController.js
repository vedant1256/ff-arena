// backend/controllers/userController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updateProfile = async (req, res) => {
  try {
    const { freeFireUid } = req.body;
    
    // Fixed: Your auth.js uses req.user.id, not req.user.userId
    const userId = req.user.id; 

    // Update the user in the Neon database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { freeFireUid: freeFireUid },
    });

    res.status(200).json({ message: 'Profile updated successfully!', user: updatedUser });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ error: 'Server error while saving profile.' });
  }
};

module.exports = { updateProfile };