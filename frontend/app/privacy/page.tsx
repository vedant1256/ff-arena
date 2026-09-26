// frontend/app/privacy/page.tsx
export default function PrivacyPolicy() {
  return (
    <div className="min-h-[70vh] max-w-3xl mx-auto py-8 px-4 text-slate-700">
      <div className="bg-white border border-brand-borderLight rounded-3xl p-6 sm:p-8 shadow-card-hover">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-gaming text-slate-900 mb-6 tracking-wider uppercase border-b border-brand-borderLight pb-4 bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-teal bg-clip-text text-transparent">
          Privacy Policy
        </h1>

        <div className="space-y-5 text-xs sm:text-sm leading-relaxed">
          <p>
            At VPS EsportsHub, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy outlines how we collect, use, and safeguard your data.
          </p>

          <h2 className="text-sm sm:text-base font-bold text-brand-indigo mt-4 font-gaming uppercase tracking-wide">
            1. Information We Collect
          </h2>
          <p>
            We collect information you provide directly to us, such as your username, email address, in-game UID, and payment transaction details. We do not store your sensitive financial data on our servers; these are handled securely by authorized payment partners.
          </p>

          <h2 className="text-sm sm:text-base font-bold text-brand-indigo mt-4 font-gaming uppercase tracking-wide">
            2. How We Use Your Information
          </h2>
          <p>
            Your information is used to facilitate tournament matchmaking, process payouts, verify your identity for compliance purposes, and communicate important account updates. 
          </p>

          <h2 className="text-sm sm:text-base font-bold text-brand-indigo mt-4 font-gaming uppercase tracking-wide">
            3. Data Security
          </h2>
          <p>
            We implement industry-standard security measures including encryption and strict access controls to protect your data against unauthorized access.
          </p>

          <h2 className="text-sm sm:text-base font-bold text-brand-indigo mt-4 font-gaming uppercase tracking-wide">
            4. Third-Party Sharing
          </h2>
          <p>
            We do not sell your personal data. We only share necessary details with legally compliant third-party services strictly for operating the tournament platform.
          </p>
        </div>
      </div>
    </div>
  );
}