// frontend/app/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ShieldAlert, X, Trophy, Check, ArrowRight } from 'lucide-react';
import api from '../../lib/axios';
import TournamentCard from '../../components/TournamentCard';



export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(true);
  const [filter, setFilter] = useState('All');
  const [showRulesModal, setShowRulesModal] = useState(false);

  const filters = ['All', 'Solo', 'Duo', 'Squad', 'Clash Squad'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setAuthChecked(true);

    const fetchTournaments = async () => {
      try {
        const res = await api.get('/tournaments', { headers: { Authorization: `Bearer ${token}` } });
        if (Array.isArray(res.data) && res.data.length > 0) {
          setTournaments(res.data);
        } else {
          setTournaments([]);
        }
      } catch (error) {
        console.warn("Using default tournament data:", error);
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, [router]);



  // Find spotlight tournament (prefer Kalahari or first open)
  const spotlightTournament = tournaments.find(t => t.teamMode === 'Squad' || t.title.toLowerCase().includes('kalahari')) || tournaments[0] || null;
  const spotlightSlots = spotlightTournament?.currentParticipants || 9;
  const spotlightMax = spotlightTournament?.maxParticipants || 12;
  const spotlightPercentage = Math.min((spotlightSlots / spotlightMax) * 100, 100);

  // Filter tournaments
  const filteredTournaments = tournaments.filter(t => {
    if (tab === 'my-matches') {
      return t.isUserParticipant || t.status === 'REGISTRATION_OPEN';
    }
    if (filter === 'All') return true;
    return (
      (t.teamMode && t.teamMode.toLowerCase().includes(filter.toLowerCase())) ||
      (t.gameName && t.gameName.toLowerCase().includes(filter.toLowerCase()))
    );
  });

  return (
    <div className="max-w-md md:max-w-4xl lg:max-w-5xl mx-auto px-4 pt-3.5 space-y-4">
      
      {/* BEGIN: WelcomeAndQuickStatusBanner */}
      <section className="rounded-2xl bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/80 border border-indigo-100/80 p-3.5 shadow-card-subtle flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>Welcome, Champion!</span>
            <span className="text-base">⚡</span>
          </h2>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Ready to dominate today's custom rooms?</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-brand-borderLight shadow-sm">
          <svg className="w-3.5 h-3.5 text-brand-mint" fill="currentColor" viewBox="0 0 20 20">
            <path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd" />
          </svg>
          <span className="text-[10px] font-bold text-slate-700 tracking-wide uppercase">Mobile Only</span>
        </div>
      </section>
      {/* END: WelcomeAndQuickStatusBanner */}

      {/* BEGIN: FeaturedSpotlightTournament */}
      {spotlightTournament && !loading && (
      <section className="relative rounded-3xl p-4 bg-white border border-indigo-100 shadow-card-hover overflow-hidden">
        {/* Light decorative background accents */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-gradient-to-br from-indigo-100/70 to-purple-100/40 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-teal-100/50 rounded-full blur-xl pointer-events-none"></div>

        {/* Header badges */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-brand-indigo border border-indigo-200/70 text-[10px] font-bold tracking-wider uppercase">
              {spotlightTournament?.gameName || 'FREE FIRE'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-brand-amber border border-amber-200 text-[10px] font-bold uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse"></span>
              MEGA EVENT
            </span>
          </div>
          <div className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 flex items-center gap-1 shadow-sm">
            <svg className="w-3 h-3 text-brand-indigo" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Starts: <span className="text-brand-indigo font-bold">01h 45m</span></span>
          </div>
        </div>

        {/* Title & Match Info */}
        <div className="mt-3 relative z-10">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 font-gaming tracking-wide flex items-center gap-1.5">
            🏆 {spotlightTournament?.title || 'Kalahari Mega Squad Championship'}
          </h3>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-1">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path clipRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" fillRule="evenodd" />
              </svg>
              {spotlightTournament?.map || 'Kalahari'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              {spotlightTournament?.teamMode || 'Squad (4v4)'}
            </span>
          </div>
        </div>

        {/* Entry and Prize Pool Highlighted Cards */}
        <div className="grid grid-cols-2 gap-2.5 mt-3 relative z-10">
          <div className="bg-slate-50/90 border border-slate-200/80 p-2.5 rounded-xl text-center">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">ENTRY FEE</span>
            <span className="text-lg font-black text-amber-600 font-gaming leading-tight">₹{spotlightTournament?.entryFee || 200}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Per Squad</span>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200/80 p-2.5 rounded-xl text-center">
            <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-700 block">PRIZE POOL</span>
            <span className="text-lg font-black text-emerald-600 font-gaming leading-tight">₹{spotlightTournament?.prizePool || 10000}</span>
            <span className="text-[9px] text-emerald-600/80 block mt-0.5">Winner: 60%</span>
          </div>
        </div>

        {/* Progress bar and CTA */}
        <div className="mt-3.5 relative z-10">
          <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
            <span className="text-slate-600">Slots Filled</span>
            <span className="text-brand-indigo font-bold">{spotlightSlots} / {spotlightMax} Teams</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-brand-indigo to-brand-teal h-full rounded-full transition-all duration-500" 
              style={{ width: `${spotlightPercentage}%` }}
            ></div>
          </div>
          
          <Link href={`/tournaments/${spotlightTournament?.id}`}>
            <button 
              className="w-full mt-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-violet text-white font-gaming text-sm font-bold uppercase tracking-wider shadow-glow-primary active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 hover:from-brand-violet hover:to-brand-indigo" 
              type="button"
            >
              <span>Join Now</span>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </Link>
        </div>
      </section>
            )} {/* END: FeaturedSpotlightTournament */}

      {/* BEGIN: FilterPills */}
      <section className="py-0.5" data-purpose="mode-filters">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {filters.map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wide whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-brand-indigo text-white shadow-sm'
                    : 'bg-white border border-brand-borderLight text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-card-subtle'
                }`}
                type="button"
              >
                {f}
              </button>
            );
          })}
        </div>
      </section>
      {/* END: FilterPills */}

      {/* BEGIN: TournamentCardsGrid */}
      <section className="space-y-3" data-purpose="tournaments-list">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-brand-indigo">
            <Loader2 size={32} className="animate-spin mb-2 text-brand-indigo" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Tournaments...</p>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="bg-white border border-brand-borderLight p-8 rounded-2xl text-center text-slate-500 shadow-card-subtle">
            <p className="text-sm font-bold text-slate-700">No tournaments matching "{filter}"</p>
            <p className="text-xs text-slate-400 mt-1">Check back soon for new room registrations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTournaments.map((t) => (
              <TournamentCard 
                key={t.id} 
                tournament={t} 
                onOpenRules={() => setShowRulesModal(true)} 
              />
            ))}
          </div>
        )}
      </section>
      {/* END: TournamentCardsGrid */}

      {/* 🛡️ Arena Rules & Fair Play Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-borderLight rounded-3xl w-full max-w-md shadow-card-hover overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-brand-borderLight bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-brand-coral" size={22} />
                <h3 className="text-base font-extrabold text-slate-900 font-gaming uppercase tracking-wide">
                  Arena Rules & Guidelines
                </h3>
              </div>
              <button 
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-600 max-h-[60vh] overflow-y-auto">
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-coral mt-1.5 flex-shrink-0"></div>
                <p>
                  <strong className="text-slate-900 font-bold">1. Mobile Players Only:</strong> Strictly no PC, emulators, or iPad devices allowed. Detected emulators are disqualified.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-brand-borderLight rounded-xl flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-indigo mt-1.5 flex-shrink-0"></div>
                <p>
                  <strong className="text-slate-900 font-bold">2. UID Verification:</strong> Your Free Fire in-game UID must perfectly match the UID in your Profile for prize payouts.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-brand-borderLight rounded-xl flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-indigo mt-1.5 flex-shrink-0"></div>
                <p>
                  <strong className="text-slate-900 font-bold">3. Zero Tolerance on Cheating:</strong> Scripts, hacks, or glitch exploits result in a permanent ban and forfeiture of funds.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-brand-borderLight rounded-xl flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-indigo mt-1.5 flex-shrink-0"></div>
                <p>
                  <strong className="text-slate-900 font-bold">4. Room Timings:</strong> Room ID & Password are revealed 15 minutes before the match start time. Join promptly.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-brand-borderLight rounded-xl flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-indigo mt-1.5 flex-shrink-0"></div>
                <p>
                  <strong className="text-slate-900 font-bold">5. Fair Play:</strong> Teaming up in Solo matches is strictly prohibited. Admin match recordings are final.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-brand-borderLight">
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full py-2.5 rounded-xl bg-brand-indigo hover:bg-brand-violet text-white font-gaming text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}