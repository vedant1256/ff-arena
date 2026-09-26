// frontend/app/leaderboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Swords, Loader2 } from 'lucide-react';
import api from '../../lib/axios';

interface Player {
  id: string;
  username: string;
  paidMatchesCount: number;
  winningBalance: number;
}

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get('/auth/leaderboard');
        setPlayers(response.data);
      } catch (err) {
        console.error("Leaderboard error:", err);
        setError('Failed to load leaderboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="max-w-md md:max-w-3xl mx-auto px-4 py-6 flex flex-col items-center">
      {/* Title Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mb-2 shadow-sm">
          <Trophy size={26} />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-wider font-gaming uppercase bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-teal bg-clip-text text-transparent">
          HALL OF FAME
        </h1>
        <p className="text-slate-500 mt-0.5 text-xs font-medium tracking-wide">
          Top warriors of the Free Fire arena
        </p>
      </div>

      <div className="w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-brand-indigo">
            <Loader2 size={32} className="animate-spin mb-2" />
            <p className="tracking-widest uppercase text-xs font-bold text-slate-400">Loading Rankings...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-brand-coral p-4 rounded-2xl text-center text-xs font-bold">
            {error}
          </div>
        ) : players.length === 0 ? (
          <div className="bg-white border border-brand-borderLight p-8 rounded-3xl text-center text-slate-500 shadow-card-subtle flex flex-col items-center">
            <Swords size={40} className="mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No battle records yet</p>
            <p className="text-xs text-slate-400 mt-1">Play matches to claim your spot on the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {players.map((player, index) => {
              const isRank1 = index === 0;
              const isRank2 = index === 1;
              const isRank3 = index === 2;

              return (
                <div 
                  key={player.id} 
                  className={`rounded-2xl flex items-center justify-between p-3.5 sm:p-4 transition-all shadow-card-subtle ${
                    isRank1 ? 'bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 border border-amber-200' :
                    isRank2 ? 'bg-gradient-to-r from-slate-50 via-white to-slate-50/40 border border-slate-200' :
                    isRank3 ? 'bg-gradient-to-r from-orange-50/60 via-white to-orange-50/30 border border-orange-200' :
                    'bg-white border border-brand-borderLight'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 border border-brand-borderLight flex-shrink-0">
                      {isRank1 ? <Crown size={20} className="text-amber-500" /> :
                       isRank2 ? <Medal size={18} className="text-slate-400" /> :
                       isRank3 ? <Medal size={18} className="text-amber-700" /> :
                       <span className="text-xs font-bold text-slate-500">#{index + 1}</span>}
                    </div>

                    {/* Player Info */}
                    <div>
                      <h3 className={`text-sm sm:text-base font-extrabold font-gaming uppercase tracking-wider ${isRank1 ? 'text-amber-700' : 'text-slate-900'}`}>
                        {player.username}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Swords size={11} className="text-brand-indigo" /> {player.paidMatchesCount} Paid Matches
                      </p>
                    </div>
                  </div>

                  {/* Winnings Display */}
                  <div className="text-right flex flex-col items-end">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Total Winnings</p>
                    <div className={`flex items-center font-black font-gaming text-base sm:text-lg ${
                      isRank1 ? 'text-amber-600' : 
                      isRank2 ? 'text-slate-700' : 
                      isRank3 ? 'text-orange-600' : 
                      'text-emerald-600'
                    }`}>
                      <span>₹</span>
                      {(player.winningBalance || 0).toLocaleString('en-IN')}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}