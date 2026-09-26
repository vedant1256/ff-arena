// frontend/components/layout/Navbar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Trophy, ShieldAlert, Bell, X, CheckCircle2 } from 'lucide-react';
import WalletModal from '../WalletModal'; 
import ProfileModal from '../ProfileModal';
import BottomNav from './BottomNav';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/useAuthStore';


const ADMIN_EMAILS = [
  "vedantjadhav30.7.2007@gmail.com",
  "shrikrishnadevkar51@gmail.com",
  "parthpronarkhede@gmail.com"
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuthStore();
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [balance, setBalance] = useState(0);

  const fetchNavbarData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return; 

      const walletRes = await api.get('/wallet');
      setBalance(walletRes.data.balance !== undefined ? walletRes.data.balance : 0);

      // Also get user profile if not populated
      if (!user) {
        const userRes = await api.get('/auth/me');
        if (userRes.data && setUser) {
          setUser(userRes.data.user || userRes.data);
        }
      }
    } catch (error) {
      // Fallback demo balance matching mockup
      setBalance((prev) => prev > 0 ? prev : 0);
    }
  };

  useEffect(() => {
    if (pathname === '/login' || pathname === '/signup' || pathname === '/register') return;
    fetchNavbarData();
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  // Hide on authentication pages
  if (pathname === '/login' || pathname === '/signup' || pathname === '/register') return null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-brand-borderLight px-4 py-3 shadow-sm">
        <div className="max-w-md md:max-w-5xl lg:max-w-6xl mx-auto flex items-center justify-between gap-3">
          
          {/* Brand Crest and Title */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-brand-indigo via-brand-violet to-brand-teal p-[1.5px] shadow-sm group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center overflow-hidden">
                <svg className="w-5 h-5 text-brand-indigo" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4zm0 2.18l7 3.12v4.7c0 4.54-3.14 8.78-7 9.88-3.86-1.1-7-5.34-7-9.88V7.3l7-3.12zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-wider font-gaming bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-teal bg-clip-text text-transparent uppercase leading-none">
                VPS ESPORTSHUB
              </h1>
              <span className="text-[10px] text-brand-teal font-bold tracking-wider flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-mint animate-pulse"></span>
                FREE FIRE ARENA
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-4 text-xs font-bold text-slate-600">
            <Link href="/dashboard" className="hover:text-brand-indigo transition-colors">
              Lobby
            </Link>
            <Link href="/leaderboard" className="flex items-center gap-1 hover:text-brand-indigo transition-colors">
              <Trophy size={14} className="text-amber-500" /> Leaderboard
            </Link>
            {(user?.role === 'ADMIN' || (user?.email && ADMIN_EMAILS.includes(user.email))) && (
              <Link href="/admin" className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full hover:bg-amber-100 transition-colors">
                <ShieldAlert size={14} /> Admin
              </Link>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            
            {/* Quick Wallet Badge */}
            <div 
              onClick={() => setIsWalletOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-50 border border-brand-borderLight shadow-sm cursor-pointer hover:border-brand-indigo/40 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-brand-amber font-bold text-xs">
                ₹
              </div>
              <span className="text-xs font-bold text-slate-800 tracking-tight">
                {balance.toLocaleString('en-IN')}
              </span>
              <button
                aria-label="Add Cash to Wallet"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsWalletOpen(true);
                }}
                className="w-5 h-5 rounded-full bg-brand-indigo text-white flex items-center justify-center font-bold text-xs hover:bg-brand-violet transition-colors ml-0.5 shadow-sm active:scale-95"
                type="button"
              >
                +
              </button>
            </div>

            {/* Notification Bell Icon */}
            <div className="relative">
              <button
                aria-label="View Notifications"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full bg-slate-50 border border-brand-borderLight text-slate-600 hover:text-slate-900 transition-colors shadow-sm active:scale-95"
                type="button"
              >
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-coral rounded-full ring-2 ring-white"></span>
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-brand-borderLight rounded-2xl shadow-card-hover p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-brand-borderLight mb-3">
                    <span className="text-xs font-bold text-slate-900 uppercase font-gaming tracking-wide">Notifications</span>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-brand-indigo mt-1 flex-shrink-0"></span>
                      <div>
                        <p className="font-bold text-slate-900">Welcome to VPS ESPORTSHUB!</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">Mobile-only daily custom rooms & cash cups are live.</p>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-brand-borderLight flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-brand-mint mt-1 flex-shrink-0"></span>
                      <div>
                        <p className="font-bold text-slate-900">Instant Wallet Payouts</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">Automated UPI payouts enabled for verified mobile warriors.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Logout Button */}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1 p-2 rounded-full text-slate-400 hover:text-brand-coral transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>

          </div>
        </div>
      </header>

      {/* Fixed Bottom Navigation Dock for Mobile & Web App */}
      <BottomNav 
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        user={user}
      />

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        balance={balance}
        transactions={[]} 
        onPaymentSuccess={() => {
          fetchNavbarData();
        }}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
      />
    </>
  );
}