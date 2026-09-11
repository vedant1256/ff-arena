// frontend/app/terms/page.tsx
export default function TermsConditions() {
  return (
    <div className="min-h-[70vh] max-w-4xl mx-auto py-12 px-4 text-gray-300">
      <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-8 tracking-wider uppercase border-b border-gray-800 pb-4">
        Terms & Conditions
      </h1>

      <div className="space-y-6 text-sm md:text-base leading-relaxed">
        <p>
          Welcome to VPS EsportsHub. By accessing or using our platform, you agree to be bound by these Terms and Conditions.
        </p>

        <h2 className="text-xl font-bold text-red-400 mt-6">1. Eligibility & Restricted States</h2>
        <p>
          You must be at least <strong>18 years old</strong> to participate in real-money tournaments. <br/>
          <strong>IMPORTANT:</strong> Residents of <strong>Andhra Pradesh, Assam, Odisha, Telangana, Nagaland, and Sikkim</strong> are strictly prohibited from participating in cash contests due to state laws. If found violating this, your account will be suspended and funds forfeited.
        </p>

        <h2 className="text-xl font-bold text-[#00F0FF] mt-6">2. Skill-Based Gaming</h2>
        <p>
          VPS EsportsHub is a platform for skill-based esports tournaments. The outcome of any match depends purely on the participant's gaming skills, knowledge, and execution. We do not offer games of chance or gambling.
        </p>

        <h2 className="text-xl font-bold text-[#00F0FF] mt-6">3. Fair Play & Anti-Cheat</h2>
        <p>
          Any use of third-party hacks, unauthorized emulators, or teaming up in solo matches will result in an immediate and permanent ban. The Admin's decision regarding match results and disputes is final.
        </p>

        <h2 className="text-xl font-bold text-[#00F0FF] mt-6">4. Wallet & Withdrawals</h2>
        <p>
          Funds deposited into the Deposit Wallet can only be used to enter tournaments. Only winnings accumulated in the Winning Wallet are eligible for withdrawal. Bonus funds cannot be withdrawn.
        </p>
      </div>
    </div>
  );
}