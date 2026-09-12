// frontend/components/layout/Navbar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Trophy, Gamepad2, ShieldAlert, LayoutDashboard, Wallet } from 'lucide-react';
import WalletModal from '../WalletModal'; 
import api from '../../lib/axios';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchNavbarData = async () => {
      try {
        // 🚀 FIX: Check if token exists before calling the wallet API
        const token = localStorage.getItem('token');
        if (!token) return; 

        const walletRes = await api.get('/wallet');
        setBalance(walletRes.data.balance || 0);
      } catch (error) {
        console.error("Navbar data fetch error", error);
      }
    };
    
    // Call the function
    fetchNavbarData();
  }, [pathname]); // 🚀 FIX: Re-run this check whenever the route changes (like after login)

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  // Hide Navbar on authentication pages
  if (pathname === '/login' || pathname === '/signup' || pathname === '/register') return null;

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-[#0A0C10]/95 backdrop-blur-md border-b border-gray-800 h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-4 w-full flex justify-between items-center">
          
          {/* 🎮 Logo Section */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/icons/logo.jpg" alt="VPS EsportsHub Logo" className="h-8 w-8 rounded-full border border-[#00F0FF]/30 object-cover hidden sm:block" />
            <span className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-purple-500 tracking-wider uppercase">
              VPS EsportsHub
            </span>
          </Link>

          {/* 🔗 Navigation Options */}
          <div className="flex items-center gap-3 sm:gap-5">

            <Link href="/leaderboard" className="hidden md:flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-300 hover:text-yellow-500 transition">
              <Trophy size={16} className="text-yellow-500" /> Leaderboard
            </Link>

            <Link href="/admin" className="hidden sm:flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/50 hover:bg-yellow-500/20 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-yellow-500 transition">
              <ShieldAlert size={16} /> Admin
            </Link>

            <button
              onClick={() => setIsWalletOpen(true)}
              className="flex items-center gap-1.5 bg-[#11141D] border border-cyan-900/50 hover:border-[#00F0FF] px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-white transition"
            >
              <Wallet size={16} className="text-[#00F0FF]" />
              ₹{balance.toFixed(0)}
            </button>

            <Link href="/dashboard" className="hidden sm:flex items-center gap-1.5 bg-[#00F0FF]/10 border border-[#00F0FF]/50 hover:bg-[#00F0FF]/20 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-[#00F0FF] transition">
              <LayoutDashboard size={16} /> Dashboard
            </Link>

            <button onClick={handleLogout} className="flex items-center gap-1 text-xs sm:text-sm font-bold text-gray-400 hover:text-red-400 transition ml-1">
              <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
            </button>
            
          </div>
        </div>
      </nav>

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        balance={balance}
        transactions={[]} 
        onPaymentSuccess={() => {
          api.get('/wallet').then(res => setBalance(res.data.balance || 0));
        }}
      />
    </>
  );
}