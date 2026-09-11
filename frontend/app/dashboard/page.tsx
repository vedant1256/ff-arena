// frontend/app/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Map, Lock, Gamepad2, Loader2, IndianRupee } from 'lucide-react';
import api from '../../lib/axios';

export default function DashboardPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const filters = ['All', 'Solo', 'Duo', 'Squad', 'Clash Squad', 'Lone Wolf'];

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await api.get('/tournaments');
        setTournaments(res.data);
      } catch (error) {
        console.error("Failed to fetch tournaments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  return (
    <div className="min-h-[85vh] text-gray-300 animate-in fade-in duration-500">
      
      {/* 🔴 5 IMPORTANT ARENA RULES & GUIDELINES */}
      <div className="bg-[#11141D] border border-red-500/20 rounded-2xl p-5 sm:p-8 mb-10 shadow-lg">
        <h2 className="flex items-center gap-3 text-lg sm:text-xl font-black text-red-500 uppercase tracking-widest mb-6">
          <ShieldAlert size={24} /> Arena Rules & Guidelines
        </h2>
        
        <div className="space-y-3">
          <div className="bg-[#0A0C10] border border-gray-800 p-4 rounded-xl flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
            <p className="text-sm"><strong className="text-white">1. No PC Players Allowed:</strong> Strictly no PC or Emulator players permitted in any match.</p>
          </div>
          
          <div className="bg-[#0A0C10] border border-gray-800 p-4 rounded-xl flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
            <p className="text-sm"><strong className="text-white">2. Mobile Only:</strong> Platform is for mobile players only. Violators will be kicked and entry fee forfeited.</p>
          </div>

          <div className="bg-[#0A0C10] border border-gray-800 p-4 rounded-xl flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
            <p className="text-sm"><strong className="text-white">3. UID Verification:</strong> In-game Free Fire UID must perfectly match your saved Profile UID for payouts.</p>
          </div>

          <div className="bg-[#0A0C10] border border-gray-800 p-4 rounded-xl flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
            <p className="text-sm"><strong className="text-white">4. Zero Tolerance:</strong> Hacks, scripts, glitches, or teaming up will result in a permanent ban and <strong>immediate forfeiture of all funds.</strong></p>
          </div>

          <div className="bg-[#0A0C10] border border-gray-800 p-4 rounded-xl flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
            <p className="text-sm"><strong className="text-white">5. Timings:</strong> Join exactly at the scheduled time. Admin decisions are final.</p>
          </div>
        </div>
      </div>

      {/* 🟢 TOURNAMENT FILTERS */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all border ${
              filter === f 
                ? 'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]' 
                : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-600 hover:text-gray-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 🎮 TOURNAMENT FEED */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#00F0FF]">
          <Loader2 size={40} className="animate-spin mb-4" />
          <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading Matches...</p>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Static Fallback Card if no tournaments exist yet */}
          <div className="bg-[#11141D] border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-600 transition-colors">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-[#00F0FF]/10 text-[#00F0FF] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-[#00F0FF]/30">
                  BATTLE ROYALE
                </span>
                <span className="text-gray-500 text-[10px] font-bold flex items-center gap-1 uppercase">
                  <Lock size={12} /> Closed
                </span>
              </div>
              
              <h3 className="text-xl font-black text-white mb-2">Classic Match</h3>
              <div className="flex items-center gap-4 text-xs text-gray-400 font-semibold mb-6">
                <span className="flex items-center gap-1"><Map size={14} className="text-gray-500"/> Bermuda</span>
                <span className="flex items-center gap-1"><Users size={14} className="text-gray-500"/> Solo</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#0A0C10] border border-gray-800 p-3 rounded-xl text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Entry Fee</p>
                  <p className="text-yellow-500 font-black text-lg flex items-center justify-center"><IndianRupee size={16}/> 10</p>
                </div>
                <div className="bg-[#0A0C10] border border-gray-800 p-3 rounded-xl text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Prize Pool</p>
                  <p className="text-green-400 font-black text-lg flex items-center justify-center"><IndianRupee size={16}/> 100</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  <span>Players</span>
                  <span>0/48</span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00F0FF]" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments
            .filter((t: any) => filter === 'All' || t.mode === filter)
            .map((tournament: any) => (
              <div key={tournament.id} className="bg-[#11141D] border border-gray-800 rounded-2xl overflow-hidden hover:border-[#00F0FF]/50 transition-colors p-5">
                <h3 className="text-xl font-black text-white mb-2">{tournament.title}</h3>
                <p className="text-sm text-gray-400 mb-4">Entry: ₹{tournament.entryFee} | Prize: ₹{tournament.prizePool}</p>
                {/* Agar aapka TournamentCard component hai, toh usko yahan use karein */}
              </div>
          ))}
        </div>
      )}
      
    </div>
  );
}