// frontend/app/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../lib/axios';
import { Gamepad2, Map as MapIcon, Diamond, AlertTriangle, Copy, User, Users, ShieldAlert } from 'lucide-react'; 
import WalletModal from '../../components/WalletModal';
import ProfileModal from '../../components/ProfileModal';

interface Tournament {
  id: string; title: string; gameName: string; map: string; teamMode: string;
  minLevel: number; entryFee: number; prizePool: number;
  currentParticipants: number; maxParticipants: number; status: string; scheduledAt: string;
}

const ADMIN_EMAILS = [
  "vedantjadhav30.7.2007@gmail.com",
  "shrikrishnadevkar60@gmail.com",
  "parthpronarkhede@gmail.com"
];

export default function DashboardPage() {
  const { user, login, logout } = useAuthStore(); 
  const router = useRouter();
  
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [liveRoomData, setLiveRoomData] = useState<any | null>(null);

  const [isUserAdmin, setIsUserAdmin] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const config = { headers: { Authorization: `Bearer ${currentToken}` } };

    try {
      const profileRes = await api.get('/auth/me', config);
      if (profileRes.data) {
        const serverUser = profileRes.data;
        const serverEmail = serverUser.email?.trim().toLowerCase();
        
        if (serverUser.role === 'ADMIN' || (serverEmail && ADMIN_EMAILS.includes(serverEmail))) {
          setIsUserAdmin(true);
        }
        login(currentToken as any, serverUser as any); 
      }
    } catch (error: any) {
      console.error("Profile sync error:", error);
      if (error.response?.status === 401) {
        logout();
        router.push('/login');
        return; 
      }
    }

    try {
      const walletRes = await api.get('/wallet', config);
      setBalance(walletRes.data.balance || 0);
      setTransactions(walletRes.data.transactions || []);
    } catch (error) {
      console.error("Wallet fetch error:", error);
    }

    try {
      const tournamentsRes = await api.get('/tournaments', config);
      setTournaments(tournamentsRes.data);
    } catch (error) {
      console.error("Tournament fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [login, logout, router]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (!user && !token) {
      router.push('/login');
      return;
    }
    
    fetchDashboardData();

    // 🚀 DYNAMIC URL: Connects to live backend for WebSockets
    const backendUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:5000';
    
    const socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => console.log('Socket connected successfully!'));

    socket.on('roomDataReleased', (data) => {
      setLiveRoomData(data);
      setTimeout(() => setLiveRoomData(null), 600000); 
    });

    return () => {
      socket.disconnect(); 
    };
  }, [user, router, fetchDashboardData]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleJoinTournament = async (tournamentId: string, entryFee: number) => {
    if (balance < entryFee) return alert(`Insufficient funds! You need ₹${entryFee}.`);
    if (!window.confirm(`Spend ₹${entryFee} to join this tournament?`)) return;

    try {
      const currentToken = localStorage.getItem('token') || '';
      await api.post(`/tournaments/${tournamentId}/join`, {}, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      alert('Successfully secured your slot!');
      fetchDashboardData(); 
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to join tournament.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const filteredTournaments = tournaments.filter(t => {
    if (activeTab === 'All') return true;
    const searchStr = `${t.title} ${t.gameName} ${t.teamMode}`.toLowerCase();
    return searchStr.includes(activeTab.toLowerCase());
  });

  if (loading) return <div className="flex justify-center items-center min-h-screen text-[#00F0FF] bg-[#090B10]">Loading Arena...</div>;

  return (
    <div className="min-h-screen bg-[#090B10] text-white -mt-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-6 pb-12 font-sans relative overflow-hidden">
      
      {liveRoomData && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md bg-[#11141D] border border-[#00F0FF] rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.3)] p-6 animate-pulse-glow">
          <div className="flex items-center gap-3 mb-4 text-[#00F0FF]"><AlertTriangle className="animate-bounce" /><h2 className="text-xl font-bold uppercase tracking-widest">Match Starting!</h2></div>
          <p className="text-gray-400 text-sm mb-4">Room details for <strong className="text-white">{liveRoomData.title}</strong> have just been released.</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-[#0A0C10] border border-gray-800 rounded-lg p-3">
              <div><p className="text-xs text-gray-500 uppercase font-bold">Room ID</p><p className="text-lg font-bold text-white tracking-wider">{liveRoomData.roomId}</p></div>
              <button onClick={() => copyToClipboard(liveRoomData.roomId)} className="text-[#00F0FF] hover:text-white transition p-2 bg-[#00F0FF]/10 rounded-md"><Copy size={18} /></button>
            </div>
            <div className="flex justify-between items-center bg-[#0A0C10] border border-gray-800 rounded-lg p-3">
              <div><p className="text-xs text-gray-500 uppercase font-bold">Password</p><p className="text-lg font-bold text-yellow-500 tracking-wider">{liveRoomData.roomPassword}</p></div>
              <button onClick={() => copyToClipboard(liveRoomData.roomPassword)} className="text-yellow-500 hover:text-white transition p-2 bg-yellow-500/10 rounded-md"><Copy size={18} /></button>
            </div>
          </div>
          <button onClick={() => setLiveRoomData(null)} className="mt-4 w-full text-xs text-gray-500 hover:text-gray-300">Dismiss Warning</button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-800/50 pb-4 relative z-10">
        <div className="flex items-center gap-2"><Gamepad2 className="text-[#b026ff]" size={28} /><h1 className="text-2xl font-bold tracking-wider">FF Arena</h1></div>
        <div className="flex items-center gap-3 md:gap-4 text-sm font-medium flex-wrap justify-center">
          <span className="text-gray-400 hover:text-white cursor-pointer transition hidden md:block">Tournaments</span>
          {isUserAdmin && (
            <Link href="/admin"><button className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 px-3 py-1.5 rounded flex items-center gap-2 hover:bg-yellow-500/30 transition shadow-[0_0_15px_rgba(234,179,8,0.2)]">👑 Admin</button></Link>
          )}
          <button onClick={() => setIsWalletOpen(true)} className="bg-[#11141D] border border-cyan-900/50 px-3 py-1.5 rounded flex items-center gap-2 text-cyan-400 hover:bg-[#1a1e2b] transition active:scale-95"><Diamond size={14} /> {balance.toFixed(0)} | ₹{balance.toFixed(0)}</button>
          <button onClick={() => setIsProfileOpen(true)} className="bg-[#b026ff]/10 border border-[#b026ff]/30 text-[#b026ff] px-3 py-1.5 rounded hover:bg-[#b026ff]/20 transition flex items-center gap-2"><User size={14} /> Profile</button>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition ml-1 md:ml-2">Logout</button>
        </div>
      </div>

      {/* Refactored Single-Line Rules Section */}
      <div className="bg-[#11141D] border border-red-900/40 rounded-2xl p-4 md:p-6 mb-8 relative z-10 shadow-[0_0_20px_rgba(220,38,38,0.05)]">
        <h2 className="text-lg md:text-xl font-bold text-red-500 mb-4 flex items-center gap-2 uppercase tracking-wider">
          <ShieldAlert size={20} className="text-red-500" /> Arena Rules & Guidelines
        </h2>
        <ul className="flex flex-col gap-2.5 text-xs md:text-sm text-gray-300">
          <li className="flex items-start md:items-center gap-3 bg-[#0A0C10] p-3 rounded-lg border border-gray-800">
            <span className="text-red-500 font-bold mt-0.5 md:mt-0 leading-none">•</span>
            <span><strong>No PC Players Allowed:</strong> Strictly no PC or Emulator players permitted in any match.</span>
          </li>
          <li className="flex items-start md:items-center gap-3 bg-[#0A0C10] p-3 rounded-lg border border-gray-800">
            <span className="text-red-500 font-bold mt-0.5 md:mt-0 leading-none">•</span>
            <span><strong>Mobile Only:</strong> Platform is for mobile players only. Violators will be kicked and entry fee forfeited.</span>
          </li>
          <li className="flex items-start md:items-center gap-3 bg-[#0A0C10] p-3 rounded-lg border border-gray-800">
            <span className="text-red-500 font-bold mt-0.5 md:mt-0 leading-none">•</span>
            <span><strong>UID Verification:</strong> In-game Free Fire UID must perfectly match your saved Profile UID for payouts.</span>
          </li>
          <li className="flex items-start md:items-center gap-3 bg-[#0A0C10] p-3 rounded-lg border border-gray-800">
            <span className="text-red-500 font-bold mt-0.5 md:mt-0 leading-none">•</span>
            <span><strong>Zero Tolerance:</strong> Hacks, scripts, glitches, or teaming up will result in a permanent ban.</span>
          </li>
          <li className="flex items-start md:items-center gap-3 bg-[#0A0C10] p-3 rounded-lg border border-gray-800">
            <span className="text-red-500 font-bold mt-0.5 md:mt-0 leading-none">•</span>
            <span><strong>Timings:</strong> Join exactly at the scheduled time. Admin decisions are final.</span>
          </li>
        </ul>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 md:gap-3 mb-8 relative z-10">
        {['All', 'Solo', 'Duo', 'Squad', 'Clash Squad', 'Lone Wolf'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${activeTab === tab ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50' : 'bg-transparent text-gray-400 border border-gray-800 hover:border-gray-600'}`}>{tab}</button>
        ))}
      </div>

      {/* Tournaments Grid */}
      {filteredTournaments.length === 0 ? (
        <div className="bg-[#11141D] border border-gray-800 rounded-2xl p-10 text-center relative z-10"><p className="text-gray-500">No active {activeTab !== 'All' ? activeTab : ''} tournaments available. Please check back later.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {filteredTournaments.map((t) => {
            const fillPercentage = Math.min((t.currentParticipants / t.maxParticipants) * 100, 100);
            const isOpen = t.status === 'REGISTRATION_OPEN';

            return (
              <div key={t.id} className="bg-[#11141D] border border-gray-800 rounded-2xl p-5 flex flex-col hover:border-gray-700 transition-colors">
                <div className="flex justify-between items-center mb-4"><span className="bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{t.gameName}</span><span className={`text-xs font-bold flex items-center gap-1 ${isOpen ? 'text-green-400' : 'text-gray-500'}`}>{isOpen ? '🟢 Open' : '🔒 Closed'}</span></div>
                <h3 className="text-xl font-bold text-white mb-1">{t.title}</h3>
                <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-gray-500 text-sm mb-5 font-medium">
                  <div className="flex items-center gap-1"><MapIcon size={14} className="text-gray-400" /> <span>{t.map || 'Bermuda'}</span></div>
                  <div className="flex items-center gap-1"><Users size={14} className="text-gray-400" /> <span>{t.teamMode || 'Solo'}</span></div>
                  <div className="flex items-center gap-1"><ShieldAlert size={14} className="text-gray-400" /> <span>Lvl {t.minLevel || 40}+</span></div>
                </div>
                <div className="bg-[#0A0C10] rounded-xl p-4 flex justify-between items-center mb-5 border border-gray-800/50">
                  <div><p className="text-gray-600 text-xs font-bold uppercase tracking-wider mb-1">Entry Fee</p><p className="text-yellow-500 font-bold text-lg">₹{t.entryFee}</p></div>
                  <div className="text-right"><p className="text-gray-600 text-xs font-bold uppercase tracking-wider mb-1">Prize Pool</p><p className="text-[#00F0FF] font-bold text-lg">₹{t.prizePool}</p></div>
                </div>
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-gray-400 mb-2"><span>Players</span><span>{t.currentParticipants}/{t.maxParticipants}</span></div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5"><div className="bg-[#00F0FF] h-1.5 rounded-full transition-all duration-500" style={{ width: `${fillPercentage}%`, boxShadow: '0 0 10px rgba(0, 240, 255, 0.5)' }}></div></div>
                </div>
                <button onClick={() => handleJoinTournament(t.id, t.entryFee)} disabled={!isOpen} className={`w-full py-3 rounded-xl font-bold transition-all active:scale-95 ${isOpen ? 'bg-gradient-to-r from-[#00F0FF]/20 to-[#00F0FF]/10 border border-[#00F0FF]/50 text-[#00F0FF] hover:bg-[#00F0FF]/30' : 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-800'}`}>
                  {isOpen ? 'JOIN MATCH' : 'MATCH LOCKED'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} balance={balance} transactions={transactions} onPaymentSuccess={fetchDashboardData} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} />
      
      <style dangerouslySetInnerHTML={{__html: `@keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 20px rgba(0,240,255,0.2); } 50% { box-shadow: 0 0 40px rgba(0,240,255,0.6); } } .animate-pulse-glow { animation: pulseGlow 2s infinite; }`}} />
    </div>
  );
}