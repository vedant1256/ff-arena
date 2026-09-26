// frontend/app/refund-policy/page.tsx
export default function RefundPolicy() {
  return (
    <div className="min-h-[70vh] max-w-3xl mx-auto py-8 px-4 text-slate-700">
      <div className="bg-white border border-brand-borderLight rounded-3xl p-6 sm:p-8 shadow-card-hover">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-gaming text-slate-900 mb-6 tracking-wider uppercase border-b border-brand-borderLight pb-4 bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-teal bg-clip-text text-transparent">
          Refund & Cancellation Policy
        </h1>

        <div className="space-y-5 text-xs sm:text-sm leading-relaxed">
          <p>
            At VPS EsportsHub, we strive to ensure a fair and competitive environment for all our players. Please read our refund and cancellation policy carefully before participating in any paid tournaments.
          </p>

          <h2 className="text-sm sm:text-base font-bold text-brand-indigo mt-4 font-gaming uppercase tracking-wide">
            1. Tournament Entry Fees & Withdrawals
          </h2>
          <p>
            Once a user registers and pays the entry fee for a tournament, the transaction is considered final. We do not offer refunds if a player decides to back out, forgets to join the match, or faces personal connectivity issues. Furthermore, <strong>Withdrawals from the Winning Wallet are final and non-refundable.</strong>
          </p>

          <h2 className="text-sm sm:text-base font-bold text-brand-indigo mt-4 font-gaming uppercase tracking-wide">
            2. Cancellations by Administration
          </h2>
          <p>
            If a tournament is cancelled by the admin or fails to execute due to technical issues from our end, <strong>entry fees will be refunded to the Deposit Wallet within 24 hours.</strong>
          </p>

          <h2 className="text-sm sm:text-base font-bold text-brand-indigo mt-4 font-gaming uppercase tracking-wide">
            3. Ban & Disqualification
          </h2>
          <p>
            Any player found using hacks, emulators (if strictly mobile-only), teaming up in solo matches, or violating the terms of fair play will be immediately disqualified. No refunds will be provided to disqualified players, and their accounts may be permanently banned.
          </p>

          <h2 className="text-sm sm:text-base font-bold text-brand-indigo mt-4 font-gaming uppercase tracking-wide">
            4. Withdrawal Processing & Refund Timeframe
          </h2>
          <p>
            If an eligible refund is requested and approved by our support team, the amount will be processed and credited back to the user's original payment method or wallet within <strong>5 to 7 working days</strong>.
          </p>

          <h2 className="text-sm sm:text-base font-bold text-brand-indigo mt-4 font-gaming uppercase tracking-wide">
            5. Contact Us
          </h2>
          <p>
            If you believe you have been charged incorrectly or have any issues regarding a match, please contact our support team at <strong className="text-brand-indigo">support@vpsesportshub.com</strong> within 24 hours of the incident.
          </p>
        </div>
      </div>
    </div>
  );
}