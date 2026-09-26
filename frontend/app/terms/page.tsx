// frontend/app/terms/page.tsx
export default function TermsConditions() {
  return (
    <div className="min-h-[70vh] max-w-3xl mx-auto py-8 px-4 text-slate-700">
      <div className="bg-white border border-brand-borderLight rounded-3xl p-6 sm:p-8 shadow-card-hover">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-gaming text-slate-900 mb-6 tracking-wider uppercase border-b border-brand-borderLight pb-4 bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-teal bg-clip-text text-transparent">
          Terms & Conditions
        </h1>

        <div className="space-y-5 text-xs sm:text-sm leading-relaxed">
          <p>
            Welcome to VPS EsportsHub. By accessing or using our platform, you agree to be bound by these Terms and Conditions.
          </p>

          <h2 className="text-sm sm:text-base font-bold text-brand-coral mt-4 font-gaming uppercase tracking-wide">
            1. Eligibility & Restricted States
          </h2>
          <p>
            You must be at least <strong>18 years old</strong> to participate in real-money tournaments. <br/>
            <strong>IMPORTANT:</strong> Residents of <strong>Andhra Pradesh, Assam, Odisha, Telangana, Nagaland, and Sikkim</strong> are strictly prohibited from participating in cash contests due to state laws. If found violating this, your account will be suspended and funds forfeited.
          </p>

          <h2 className="text-sm sm:text-base font-bold text-brand-indigo mt-4 font-gaming uppercase tracking-wide">
            2. Skill-Based Gaming
          </h2>
          <p>
            VPS EsportsHub is a platform for skill-based esports tournaments. The outcome of any match depends purely on the participant's gaming skills, knowledge, and execution. We do not offer games of chance or gambling.
          </p>

          <h2 className="text-sm sm:text-base font-bold text-brand-indigo mt-4 font-gaming uppercase tracking-wide">
            3. Fair Play & Anti-Cheat
          </h2>
          <p>
            Any use of third-party hacks, unauthorized emulators, or teaming up in solo matches will result in an immediate and permanent ban. The Admin's decision regarding match results and disputes is final.
          </p>

          <h2 className="text-sm sm:text-base font-bold text-brand-indigo mt-4 font-gaming uppercase tracking-wide">
            4. Wallet & Withdrawals
          </h2>
          <p>
            Funds deposited into the Deposit Wallet can only be used to enter tournaments. Only winnings accumulated in the Winning Wallet are eligible for withdrawal. Bonus funds cannot be withdrawn.
          </p>
        </div>
      </div>
    </div>
  );
}