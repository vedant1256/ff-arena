// frontend/components/layout/BottomNav.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Trophy, Swords, BarChart2, Wallet, User } from 'lucide-react';

interface BottomNavProps {
  onOpenWallet: () => void;
  onOpenProfile: () => void;
  user?: any;
}

export default function BottomNav({ onOpenWallet, onOpenProfile, user }: BottomNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');

  // Hide BottomNav on authentication pages
  if (pathname === '/login' || pathname === '/signup' || pathname === '/register') return null;

  const isLobbyActive = pathname === '/dashboard' && !currentTab;
  const isMyMatchesActive = pathname === '/dashboard' && currentTab === 'my-matches';
  const isLeaderboardActive = pathname === '/leaderboard';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-brand-borderLight safe-padding-bottom shadow-lg"
      data-purpose="bottom-tab-bar"
    >
      <div className="max-w-md mx-auto px-2 py-2 flex items-center justify-around">
        {/* Tab: Lobby */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-0.5 px-3 py-0.5 transition-colors ${
            isLobbyActive ? 'text-brand-indigo font-bold' : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1c1.99-.41 3.53-1.95 3.91-3.96 2.47-.31 4.39-2.39 4.39-4.94V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
            </svg>
          </div>
          <span className="text-[10px] font-bold">Lobby</span>
        </Link>

        {/* Tab: My Matches */}
        <Link
          href="/dashboard?tab=my-matches"
          className={`flex flex-col items-center gap-0.5 px-3 py-0.5 transition-colors ${
            isMyMatchesActive ? 'text-brand-indigo font-bold' : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[10px] font-medium">My Matches</span>
        </Link>

        {/* Tab: Leaderboard */}
        <Link
          href="/leaderboard"
          className={`flex flex-col items-center gap-0.5 px-3 py-0.5 transition-colors ${
            isLeaderboardActive ? 'text-brand-indigo font-bold' : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[10px] font-medium">Leaderboard</span>
        </Link>

        {/* Tab: Wallet */}
        <button
          type="button"
          onClick={onOpenWallet}
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-800 transition-colors px-3 py-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[10px] font-medium">Wallet</span>
        </button>

        {/* Tab: Profile */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-800 transition-colors px-3 py-0.5"
        >
          <div className="w-5 h-5 rounded-full bg-indigo-50 border border-brand-indigo/30 flex items-center justify-center text-[9px] font-bold text-brand-indigo uppercase">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'V'}
          </div>
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </nav>
  );
}
