// frontend/app/privacy/page.tsx
export default function PrivacyPolicy() {
  return (
    <div className="min-h-[70vh] max-w-4xl mx-auto py-12 px-4 text-gray-300">
      <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-8 tracking-wider uppercase border-b border-gray-800 pb-4">
        Privacy Policy
      </h1>

      <div className="space-y-6 text-sm md:text-base leading-relaxed">
        <p>
          At VPS EsportsHub, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy outlines how we collect, use, and safeguard your data.
        </p>

        <h2 className="text-xl font-bold text-[#00F0FF] mt-6">1. Information We Collect</h2>
        <p>
          We collect information you provide directly to us, such as your username, email address, in-game UID, and payment transaction details. We do not store your sensitive financial data (like credit card numbers) on our servers; these are handled securely by our payment gateway partners.
        </p>

        <h2 className="text-xl font-bold text-[#00F0FF] mt-6">2. How We Use Your Information</h2>
        <p>
          Your information is used to facilitate tournament matchmaking, process payouts, verify your identity for compliance purposes, and communicate important account updates. 
        </p>

        <h2 className="text-xl font-bold text-[#00F0FF] mt-6">3. Data Security</h2>
        <p>
          We implement enterprise-level security measures including encryption and strict access controls to protect your data against unauthorized access, alteration, or destruction.
        </p>

        <h2 className="text-xl font-bold text-[#00F0FF] mt-6">4. Third-Party Sharing</h2>
        <p>
          We do not sell your personal data. We may share necessary details with legally compliant third-party services (like payment processors) strictly for the purpose of operating the platform.
        </p>
      </div>
    </div>
  );
}