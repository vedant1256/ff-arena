// frontend/components/Footer.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // Hide on auth pages
  if (pathname === '/login' || pathname === '/signup' || pathname === '/register') return null;

  return (
    <footer className="mt-8 pt-4 pb-4 text-center space-y-3 max-w-md md:max-w-4xl mx-auto px-4">
      {/* Quick Navigation Links */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-brand-indigo font-semibold">
        <Link className="hover:underline" href="/terms">Rules</Link>
        <span className="text-slate-300">•</span>
        <Link className="hover:underline" href="/leaderboard">Leaderboard</Link>
        <span className="text-slate-300">•</span>
        <Link className="hover:underline" href="/contact">Support</Link>
        <span className="text-slate-300">•</span>
        <Link className="hover:underline" href="/terms">Terms</Link>
        <span className="text-slate-300">•</span>
        <Link className="hover:underline" href="/privacy">Privacy</Link>
        <span className="text-slate-300">•</span>
        <Link className="hover:underline" href="/refund-policy">Refunds</Link>
      </div>

      {/* Financial Notice & Disclaimer Card */}
      <div className="px-3.5 py-2.5 rounded-xl bg-white border border-brand-borderLight text-[10px] text-slate-500 leading-relaxed text-left shadow-card-subtle">
        <p className="text-slate-800 font-bold tracking-wide uppercase text-[9px] mb-0.5 flex items-center gap-1">
          <span>⚠️ Financial Notice & Disclaimer</span>
        </p>
        This game involves financial risk and may be addictive. Play responsibly and at your own risk. Restricted to 18+ Indian players outside non-permissible states (AP, AS, OD, TS, NL, SK).
      </div>

      {/* Copyright */}
      <p className="text-[10px] text-slate-400">
        © 2026 VPS ESPORTSHUB. All rights reserved.
      </p>
    </footer>
  );
}