// frontend/app/leaderboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Swords, Loader2, IndianRupee } from 'lucide-react';
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
        // Backend se top 10 players laa rahe hain
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
    <div className="min-h-[85vh] py-10 px-4 flex flex-col items-center relative">
      {/* Background Glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#00F0FF]/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="mb-10 flex flex-col items-center relative z-10">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest text-white flex items-center gap-3 uppercase">
          <Trophy size={40} className="text-[#00F0FF]" /> 
          HALL OF <span className="text-[#00F0FF]">FAME</span>
        </h1>
        <p className="text-gray-400 mt-2 text-sm md:text-base tracking-widest uppercase font-semibold">
          Top Warriors of the Arena
        </p>
      </div>

      <div className="w-full max-w-3xl relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#00F0FF]">
            <Loader2 size={40} className="animate-spin mb-4" />
            <p className="animate-pulse tracking-widest uppercase text-sm font-bold">Loading Rankings...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-center font-bold">
            {error}
          </div>
        ) : players.length === 0 ? (
          <div className="bg-[#11141D] border border-gray-800 p-10 rounded-2xl text-center text-gray-500 flex flex-col items-center">
            <Swords size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-bold">No data available yet.</p>
            <p className="text-sm">Matches need to be played to rank players!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {players.map((player, index) => {
              // Styling logic for Top 3
              const isRank1 = index === 0;
              const isRank2 = index === 1;
              const isRank3 = index === 2;

              return (
                <div 
                  key={player.id} 
                  className={`relative overflow-hidden rounded-2xl flex items-center justify-between p-4 md:p-6 transition-transform hover:scale-[1.02] ${
                    isRank1 ? 'bg-gradient-to-r from-yellow-500/20 to-[#11141D] border border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.15)]' :
                    isRank2 ? 'bg-gradient-to-r from-gray-300/20 to-[#11141D] border border-gray-400/50' :
                    isRank3 ? 'bg-gradient-to-r from-amber-700/30 to-[#11141D] border border-amber-700/50' :
                    'bg-[#11141D] border border-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    {/* Rank Icon */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#0A0C10] border border-gray-800 flex-shrink-0">
                      {isRank1 ? <Crown size={28} className="text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" /> :
                       isRank2 ? <Medal size={24} className="text-gray-300" /> :
                       isRank3 ? <Medal size={24} className="text-amber-600" /> :
                       <span className="text-xl font-bold text-gray-500">#{index + 1}</span>}
                    </div>

                    {/* Player Info */}
                    <div>
                      <h3 className={`text-lg md:text-xl font-extrabold uppercase tracking-wider ${isRank1 ? 'text-yellow-500' : 'text-white'}`}>
                        {player.username}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                        <Swords size={14} className="text-purple-400" /> {player.paidMatchesCount} Paid Matches
                      </p>
                    </div>
                  </div>

                  {/* Winnings Display */}
                  <div className="text-right flex flex-col items-end">
                    <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Total Winnings</p>
                    <div className={`flex items-center gap-1 font-black text-xl md:text-2xl ${
                      isRank1 ? 'text-yellow-400' : 
                      isRank2 ? 'text-gray-200' : 
                      isRank3 ? 'text-amber-500' : 
                      'text-green-400'
                    }`}>
                      <IndianRupee size={20} />
                      {player.winningBalance.toFixed(0)}
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