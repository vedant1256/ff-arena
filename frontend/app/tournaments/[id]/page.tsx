// frontend/app/tournaments/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Gamepad2, Users, Trophy, ShieldAlert, Key, Loader2, ArrowLeft, Crosshair, Map, CheckSquare, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';

export default function TournamentPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState('');

  // 🚀 FIXED: Added Cache Buster to forcefully override browser memory
  const fetchTournament = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setJoinLoading(true);
      const currentToken = localStorage.getItem('token') || '';
      const config = currentToken ? { headers: { Authorization: `Bearer ${currentToken}` } } : {};
      
      // ?_t=... forces the browser to fetch a completely fresh version from the server
      const res = await api.get(`/tournaments/${id}?_t=${new Date().getTime()}`, config);
      setTournament(res.data);
    } catch (err: any) {
      setError('Failed to load tournament details.');
    } finally {
      setLoading(false);
      if (isManualRefresh) setJoinLoading(false);
    }
  };

  useEffect(() => {
    fetchTournament();

    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(socketUrl);

    socket.on('roomDataReleased', (data: any) => {
      if (data.tournamentId === id) {
        fetchTournament();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  const handleJoin = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!window.confirm(`Join tournament? This will deduct ₹${tournament?.entryFee} from your wallet.`)) return;

    setJoinLoading(true);
    setError('');
    try {
      const currentToken = localStorage.getItem('token') || '';
      await api.post(`/tournaments/${id}/join`, {}, { headers: { Authorization: `Bearer ${currentToken}` } });
      
      await fetchTournament(); 
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join tournament.');
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#090B10] flex items-center justify-center"><Loader2 className="animate-spin text-[#b026ff]" size={40} /></div>;
  if (!tournament) return <div className="min-h-screen bg-[#090B10] text-white flex items-center justify-center">Tournament not found.</div>;

  const isParticipant = user && tournament.participants?.some((p: any) => p.id === user.id);
  const isFull = tournament.currentParticipants >= tournament.maxParticipants;
  const isRegistrationOpen = tournament.status === 'REGISTRATION_OPEN';

  return (
    <div className="min-h-screen bg-[#090B10] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <Link href="/dashboard">
          <button className="flex items-center gap-2 bg-[#11141D] border border-gray-800 px-4 py-2 rounded-lg text-gray-400 hover:text-white transition">
            <ArrowLeft size={16} /> Back to Arena
          </button>
        </Link>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center gap-3">
            <ShieldAlert size={20} /> {error}
          </div>
        )}

        {/* HERO SECTION */}
        <div className="bg-[#11141D] border border-gray-800 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#b026ff] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-[#b026ff]/20 text-[#b026ff] border border-[#b026ff]/30 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                  {tournament.gameName}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border ${isRegistrationOpen ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                  {tournament.status.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight mb-2">{tournament.title}</h1>
              <p className="text-gray-400 flex items-center gap-2">
                Scheduled: <span className="text-white font-medium">{new Date(tournament.scheduledAt).toLocaleString()}</span>
              </p>
            </div>
            
            <div className="bg-[#0A0C10] border border-gray-800 rounded-2xl p-6 text-center min-w-[200px]">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Entry Fee</p>
              <p className="text-3xl font-extrabold text-[#00F0FF]">₹{tournament.entryFee}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* STATS CARDS */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-[#11141D] border border-gray-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
              <Trophy className="text-yellow-500 mb-2" size={28} />
              <p className="text-gray-500 text-xs font-bold uppercase">Prize Pool</p>
              <p className="text-xl font-bold text-white">₹{tournament.prizePool}</p>
            </div>
            <div className="bg-[#11141D] border border-gray-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
              <Users className="text-[#00F0FF] mb-2" size={28} />
              <p className="text-gray-500 text-xs font-bold uppercase">Registered</p>
              <p className="text-xl font-bold text-white">{tournament.currentParticipants} / {tournament.maxParticipants}</p>
            </div>
            <div className="bg-[#11141D] border border-gray-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
              <Map className="text-emerald-400 mb-2" size={28} />
              <p className="text-gray-500 text-xs font-bold uppercase">Map</p>
              <p className="text-xl font-bold text-white">{tournament.map}</p>
            </div>
            <div className="bg-[#11141D] border border-gray-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
              <Crosshair className="text-red-400 mb-2" size={28} />
              <p className="text-gray-500 text-xs font-bold uppercase">Mode</p>
              <p className="text-xl font-bold text-white">{tournament.teamMode}</p>
            </div>
          </div>

          {/* ACTION PANEL */}
          <div className="bg-[#11141D] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-white text-lg mb-4">Registration Status</h3>
              {isParticipant ? (
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl text-center mb-6">
                  <CheckSquare className="mx-auto mb-2" size={24} />
                  <p className="font-bold">You are registered!</p>
                  <p className="text-xs mt-1 text-green-500/80">Entry fee paid.</p>
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  <p className="text-sm text-gray-400">Secure your slot before the lobby fills up. Entry fee will be deducted from your wallet.</p>
                </div>
              )}
            </div>

            {!isParticipant && (
              <button 
                onClick={handleJoin}
                disabled={!isRegistrationOpen || isFull || joinLoading}
                className={`w-full py-4 rounded-xl font-extrabold uppercase tracking-widest transition-all flex justify-center items-center gap-2 ${
                  !isRegistrationOpen || isFull 
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                    : 'bg-[#b026ff] hover:bg-[#901ecc] text-white shadow-[0_0_20px_rgba(176,38,255,0.4)] active:scale-95'
                }`}
              >
                {joinLoading ? <Loader2 className="animate-spin" size={20} /> : (isFull ? 'Lobby Full' : 'Join Match')}
              </button>
            )}
          </div>
        </div>

        {/* 🔒 THE SECURE PAYWALL BOX */}
        {isParticipant && (
          <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
            {tournament.roomId && tournament.roomPassword ? (
              <div className="bg-gradient-to-r from-[#b026ff]/20 to-[#00F0FF]/10 border border-[#b026ff]/50 rounded-2xl p-8 shadow-[0_0_50px_rgba(176,38,255,0.15)]">
                <div className="flex items-center gap-3 mb-6">
                  <Key className="text-[#b026ff]" size={28} />
                  <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Lobby Coordinates Revealed</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#0A0C10] border border-[#b026ff]/30 p-4 rounded-xl">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Room ID</p>
                    <p className="text-2xl font-mono font-bold text-white tracking-widest select-all">{tournament.roomId}</p>
                  </div>
                  <div className="bg-[#0A0C10] border border-[#b026ff]/30 p-4 rounded-xl">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Room Password</p>
                    <p className="text-2xl font-mono font-bold text-[#00F0FF] tracking-widest select-all">{tournament.roomPassword}</p>
                  </div>
                </div>
                <p className="text-red-400 text-xs mt-4 text-center font-bold tracking-widest uppercase">⚠️ Do not share these credentials. Unauthorized IPs will be instantly banned.</p>
              </div>
            ) : (
              <div className="bg-[#0A0C10] border border-gray-800 border-l-4 border-l-yellow-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <Loader2 className="text-yellow-500 animate-spin mb-4" size={32} />
                <h2 className="text-xl font-bold text-white mb-2">Awaiting Lobby Coordinates</h2>
                <p className="text-gray-400 text-sm max-w-md">You are registered! The Overseer will broadcast the Room ID and Password here 10-15 minutes before the match starts.</p>
                
                {/* 🚀 FIXED: Manual Refresh Button added as a fail-safe */}
                <button 
                  onClick={() => fetchTournament(true)}
                  disabled={joinLoading}
                  className="mt-6 flex items-center justify-center gap-2 text-yellow-500 hover:text-yellow-400 bg-yellow-500/10 px-4 py-2 rounded border border-yellow-500/20 text-xs font-bold uppercase transition"
                >
                  <RefreshCw size={14} className={joinLoading ? 'animate-spin' : ''} /> Force Refresh Coordinates
                </button>

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}