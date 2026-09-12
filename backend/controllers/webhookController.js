const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const handleSmsWebhook = async (req, res) => {
  try {
    const secret = req.headers['x-webhook-secret'];
    
    // Verify Webhook Secret
    if (secret !== process.env.SMS_WEBHOOK_SECRET) {
      console.error("[WEBHOOK] Unauthorized access attempt.");
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { utr, amount, sender, timestamp } = req.body;
    
    if (!utr || amount === undefined) {
      return res.status(400).json({ error: 'Missing required payload fields' });
    }

    console.log(`[WEBHOOK] Received Payment Notification: UTR=${utr}, Amount=${amount}`);

    // Atomic Transaction for processing the payment
    const result = await prisma.$transaction(async (tx) => {
      // 1. Locate PaymentTransaction
      const payment = await tx.paymentTransaction.findUnique({
        where: { submittedUtr: utr.trim() },
        include: { user: true, tournament: true }
      });

      // 2. If record does not exist -> UnclaimedDeposits
      if (!payment) {
        await tx.unclaimedDeposit.create({
          data: {
            utr: utr.trim(),
            amount: parseFloat(amount),
            sender: sender || null,
            timestamp: timestamp ? new Date(timestamp) : new Date()
          }
        });
        return { status: 'UNCLAIMED' };
      }

      // If already processed, ignore
      if (payment.status !== 'PENDING_VERIFICATION') {
        return { status: 'ALREADY_PROCESSED' };
      }

      // 3. Amount Verification
      const parsedAmount = parseFloat(amount);
      if (parsedAmount >= payment.expectedAmount) {
        // 4. Match Success -> Approve
        // 🛡️ SECURITY PATCH: Atomic Lock on status transition to prevent duplicate concurrent webhook processing
        const updatedPayment = await tx.paymentTransaction.updateMany({
          where: { 
            id: payment.id,
            status: 'PENDING_VERIFICATION' // Strict conditional lock
          },
          data: {
            status: 'APPROVED',
            creditedAmount: parsedAmount,
            verifiedAt: new Date(),
            rawWebhookLog: JSON.stringify(req.body)
          }
        });

        // Check if race condition occurred
        if (updatedPayment.count === 0) {
          return { status: 'ALREADY_PROCESSED' };
        }

        // Add user to tournament
        await tx.user.update({
          where: { id: payment.userId },
          data: { tournaments: { connect: { id: payment.tournamentId } } }
        });

        // Increment tournament participants
        await tx.tournament.update({
          where: { id: payment.tournamentId },
          data: { currentParticipants: { increment: 1 } }
        });

        return { status: 'APPROVED' };
      } else {
        // 5. Amount mismatch -> Fail
        const failedPayment = await tx.paymentTransaction.updateMany({
          where: { 
            id: payment.id,
            status: 'PENDING_VERIFICATION'
          },
          data: {
            status: 'FAILED_MISMATCH',
            creditedAmount: parsedAmount,
            verifiedAt: new Date(),
            rawWebhookLog: JSON.stringify(req.body)
          }
        });

        if (failedPayment.count === 0) {
          return { status: 'ALREADY_PROCESSED' };
        }
        
        return { status: 'FAILED_MISMATCH' };
      }
    });

    return res.status(200).json({ message: 'Webhook processed', result: result.status });
  } catch (error) {
    console.error("[WEBHOOK ERROR]:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  handleSmsWebhook
};
