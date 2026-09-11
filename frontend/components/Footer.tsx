// frontend/components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0A0C10] border-t border-gray-800/50 pt-10 pb-6 mt-20 relative z-10">
      <div className="max-w-6xl mx-auto px-4">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-center md:text-left">
          {/* Brand Info */}
          <div>
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-purple-500 mb-4 tracking-widest uppercase">
              VPS EsportsHub
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              India's premier skill-based Esports tournament platform. Compete with the best, climb the leaderboards, and win real rewards.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Quick Links</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/tournaments" className="hover:text-[#00F0FF] transition">All Tournaments</Link></li>
              <li><Link href="/leaderboard" className="hover:text-[#00F0FF] transition">Leaderboard</Link></li>
              <li><Link href="/dashboard" className="hover:text-[#00F0FF] transition">My Dashboard</Link></li>
            </ul>
          </div>

          {/* Legal Pages (Crucial for Razorpay) */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Legal & Policies</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/terms" className="hover:text-[#00F0FF] transition">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-[#00F0FF] transition">Privacy Policy</Link></li>
              <li><Link href="/refund-policy" className="hover:text-[#00F0FF] transition">Refund & Cancellation Policy</Link></li>
              <li><Link href="/contact" className="hover:text-[#00F0FF] transition">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer for RMG Compliance */}
        <div className="border-t border-gray-800 pt-6 mt-6">
          <p className="text-red-400 font-bold text-[11px] uppercase tracking-wider text-center md:text-justify mb-2">
            This game involves an element of financial risk and may be addictive. Please play responsibly and at your own risk.
          </p>
          <p className="text-gray-500 text-[11px] leading-relaxed text-center md:text-justify mb-4">
            <strong>Disclaimer:</strong> This platform offers skill-based competitive gaming tournaments. It is entirely dependent on the user's skill, knowledge, and experience. We do not support or endorse gambling, betting, or games of chance. Users must be 18 years or older to participate in cash tournaments. Residents of Andhra Pradesh, Assam, Odisha, Telangana, Nagaland, and Sikkim are strictly prohibited from participating in cash contests as per their respective state laws.
          </p>
          <p className="text-gray-600 text-xs text-center">
            © {new Date().getFullYear()} VPS EsportsHub. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}