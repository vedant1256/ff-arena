// frontend/app/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore"; 
import { ShieldAlert, PlusCircle, Users, Ban, CheckCircle, ArrowLeft, Radio, Save, Trophy, Trash2 } from 'lucide-react';

const getDefaultDateTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const ADMIN_EMAILS = [
  "vedantjadhav30.7.2007@gmail.com",
  "shrikrishnadevkar60@gmail.com",
  "parthpronarkhede@gmail.com"
];

export default function AdminPage() {
  const router = useRouter();
  const { logout } = useAuthStore(); 
  
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  const [activeTab, setActiveTab] = useState<'TOURNAMENTS' | 'PLAYERS'>('TOURNAMENTS');
  const [formData, setFormData] = useState({ 
    title: '', gameName: 'Battle Royale', map: 'Bermuda', teamMode: 'Solo',
    minLevel: 40, entryFee: 0, prizePool: 0, maxParticipants: 48, scheduledAt: getDefaultDateTime() 
  });
  
  const [tMessage, setTMessage] = useState('');
  const [players, setPlayers] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [pMessage, setPMessage] = useState('');
  const [editData, setEditData] = useState<{[key: string]: { roomId: string, roomPassword: string, status: string }}>({});
  const [winnerInputs, setWinnerInputs] = useState<{[key: string]: string}>({});

  // 🔒 STRICT VERIFICATION WITH 401 LOGOUT FAIL-SAFE
  useEffect(() => {
    const verifyAdminAccess = async () => {
      const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const config = { headers: { Authorization: `Bearer ${currentToken}` } };

      try {
        const res = await api.get('/auth/me', config);
        const serverUser = res.data;
        const serverEmail = serverUser.email?.trim().toLowerCase();

        if (serverUser.role === 'ADMIN' || (serverEmail && ADMIN_EMAILS.includes(serverEmail))) {
          setIsUserAdmin(true);
          fetchPlayers(config);
          fetchTournaments(config);
        } else {
          router.push('/dashboard');
        }
      } catch (err: any) {
        console.error("Auth check failed:", err);
        // 🔥 If the token is dead, wipe the state and go to login
        if (err.response?.status === 401) {
          logout();
        }
        router.push('/login');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifyAdminAccess();
  }, [router, logout]);

  const fetchPlayers = async (config: any) => {
    try { const res = await api.get('/admin/users', config); setPlayers(res.data); } 
    catch (err) { console.error(err); }
  };

  const fetchTournaments = async (config: any) => {
    try {
      const res = await api.get('/tournaments', config);
      setTournaments(res.data);
      const initialEditState: any = {};
      res.data.forEach((t: any) => {
        initialEditState[t.id] = { roomId: t.roomId || '', roomPassword: t.roomPassword || '', status: t.status };
      });
      setEditData(initialEditState);
    } catch (err) { console.error(err); }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const currentToken = localStorage.getItem('token') || '';
      const payload = {
        ...formData,
        entryFee: parseFloat(formData.entryFee.toString()),
        prizePool: parseFloat(formData.prizePool.toString()),
        maxParticipants: parseInt(formData.maxParticipants.toString(), 10),
        minLevel: parseInt(formData.minLevel.toString(), 10),
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
      };
      await api.post('/tournaments', payload, { headers: { Authorization: `Bearer ${currentToken}` } });
      setTMessage('Tournament created successfully!');
      setFormData({ title: '', gameName: 'Battle Royale', map: 'Bermuda', teamMode: 'Solo', minLevel: 40, entryFee: 0, prizePool: 0, maxParticipants: 48, scheduledAt: getDefaultDateTime() });
      
      const config = { headers: { Authorization: `Bearer ${currentToken}` } };
      fetchTournaments(config);
      setTimeout(() => setTMessage(''), 3000);
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to create tournament.'); }
  };

  const handleUpdateTournament = async (tournamentId: string, isRoomReleased: boolean = false) => {
    try {
      const currentToken = localStorage.getItem('token') || '';
      const config = { headers: { Authorization: `Bearer ${currentToken}` } };
      
      const data = editData[tournamentId];
      await api.put(`/tournaments/${tournamentId}`, { ...data, isRoomReleased }, config);
      if (isRoomReleased) alert("🚨 ROOM DETAILS BROADCASTED LIVE TO ALL PLAYERS!");
      else alert("Tournament saved.");
      fetchTournaments(config);
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to update match.'); }
  };

  const handleDeclareWinner = async (tournamentId: string) => {
    const uid = winnerInputs[tournamentId];
    if (!uid || !uid.trim()) return alert("Please enter a valid Free Fire Game UID.");
    if (!window.confirm(`Confirm payout? This will instantly credit the prize money to UID: ${uid}`)) return;

    try {
      const currentToken = localStorage.getItem('token') || '';
      const config = { headers: { Authorization: `Bearer ${currentToken}` } };
      
      const res = await api.post(`/tournaments/${tournamentId}/winner`, { winnerUid: uid.trim() }, config);
      alert(res.data.message);
      fetchTournaments(config);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to settle match payout.');
    }
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    if (!window.confirm("⚠️ Are you sure you want to PERMANENTLY delete this tournament? This action cannot be undone.")) return;
    try {
      const currentToken = localStorage.getItem('token') || '';
      const config = { headers: { Authorization: `Bearer ${currentToken}` } };

      await api.delete(`/tournaments/${tournamentId}`, config);
      alert("Tournament deleted successfully.");
      fetchTournaments(config); 
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete tournament.');
    }
  };

  const handleEditChange = (id: string, field: string, value: string) => {
    setEditData(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleBanToggle = async (userId: string, currentBanStatus: boolean) => {
    if (!window.confirm(`Are you sure you want to ${currentBanStatus ? 'UNBAN' : 'BAN'} this player?`)) return;
    try {
      const currentToken = localStorage.getItem('token') || '';
      const config = { headers: { Authorization: `Bearer ${currentToken}` } };

      await api.put(`/admin/users/${userId}/ban`, { isBanned: !currentBanStatus }, config);
      setPMessage(`Player successfully ${currentBanStatus ? 'unbanned' : 'banned'}.`);
      
      const res = await api.get('/admin/users', config); 
      setPlayers(res.data);
      
      setTimeout(() => setPMessage(''), 3000);
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to update player.'); }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#090B10] flex flex-col justify-center items-center gap-4 text-[#00F0FF]">
        <ShieldAlert size={40} className="animate-pulse" />
        <h2 className="text-xl font-bold tracking-widest uppercase">Verifying Overseer Credentials...</h2>
      </div>
    );
  }

  if (!isUserAdmin) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-[#b026ff]" size={40} />
          <div>
            <h1 className="text-3xl font-extrabold uppercase text-[#b026ff] tracking-wider" style={{ textShadow: '0 0 10px rgba(176, 38, 255, 0.5)' }}>OVERSEER PANEL</h1>
            <p className="text-gray-400 text-sm">System Administration & Moderation</p>
          </div>
        </div>
        <Link href="/dashboard">
          <button className="flex items-center gap-2 bg-[#11141D] border border-gray-800 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </Link>
      </div>

      <div className="flex gap-4">
        <button onClick={() => setActiveTab('TOURNAMENTS')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'TOURNAMENTS' ? 'bg-[#b026ff]/20 text-[#b026ff] border border-[#b026ff]/50' : 'bg-[#11141D] text-gray-500 border border-gray-800 hover:text-gray-300'}`}>
          <PlusCircle size={18} /> Manage Tournaments
        </button>
        <button onClick={() => setActiveTab('PLAYERS')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'PLAYERS' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50' : 'bg-[#11141D] text-gray-500 border border-gray-800 hover:text-gray-300'}`}>
          <Users size={18} /> Player Moderation
        </button>
      </div>

      {/* TOURNAMENTS TAB */}
      {activeTab === 'TOURNAMENTS' && (
        <div className="space-y-8">
          <div className="bg-[#11141D] p-8 rounded-2xl border border-gray-800/60 shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">Draft New Tournament</h2>
            {tMessage && <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded mb-6 text-sm">{tMessage}</div>}

            <form onSubmit={handleCreateTournament} className="space-y-5">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tournament Title</label>
                  <input name="title" type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g., Friday Night Showdown" className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Game Category</label>
                  <select name="gameName" value={formData.gameName} onChange={(e) => setFormData({...formData, gameName: e.target.value})} className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none">
                    <option value="Battle Royale">Battle Royale</option>
                    <option value="Clash Squad">Clash Squad</option>
                    <option value="Lone Wolf">Lone Wolf</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Map</label>
                  <select name="map" value={formData.map} onChange={(e) => setFormData({...formData, map: e.target.value})} className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none">
                    <option value="Bermuda">Bermuda</option><option value="Kalahari">Kalahari</option><option value="NeXTerra">NeXTerra</option><option value="Purgatory">Purgatory</option><option value="Solara">Solara</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Team Mode</label>
                  <select name="teamMode" value={formData.teamMode} onChange={(e) => setFormData({...formData, teamMode: e.target.value})} className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none">
                    <option value="Solo">Solo</option><option value="Duo">Duo</option><option value="Squad">Squad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Max Players</label>
                  <input name="maxParticipants" type="number" min="2" max="100" required value={formData.maxParticipants} onChange={(e) => setFormData({...formData, maxParticipants: parseInt(e.target.value)})} className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Min. ID Level</label>
                  <input name="minLevel" type="number" min="1" required value={formData.minLevel} onChange={(e) => setFormData({...formData, minLevel: parseInt(e.target.value)})} className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Start Date & Time</label>
                  <input name="scheduledAt" type="datetime-local" required value={formData.scheduledAt} onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})} style={{ colorScheme: 'dark' }} className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" />
                </div>
                <div className="md:col-span-1 border-t border-gray-800/50 md:border-none pt-4 md:pt-0">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Entry Fee (₹)</label>
                  <input name="entryFee" type="number" min="0" required value={formData.entryFee} onChange={(e) => setFormData({...formData, entryFee: parseFloat(e.target.value)})} className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" />
                </div>
                <div className="md:col-span-2 border-t border-gray-800/50 md:border-none pt-4 md:pt-0">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Prize Pool (₹)</label>
                  <input name="prizePool" type="number" min="0" required value={formData.prizePool} onChange={(e) => setFormData({...formData, prizePool: parseFloat(e.target.value)})} className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-[#b026ff]/20 to-[#b026ff]/10 hover:from-[#b026ff]/30 border border-[#b026ff]/50 text-[#b026ff] font-bold py-3 px-4 rounded-xl mt-4 uppercase active:scale-[0.99] transition-transform">Initialize Tournament</button>
            </form>
          </div>

          <div className="bg-[#11141D] p-8 rounded-2xl border border-gray-800/60 shadow-xl">
            <h2 className="text-xl font-bold mb-6 text-white">Live Matches & Room Management</h2>
            <div className="space-y-6">
              {tournaments.map(t => {
                const isCompleted = t.status === 'COMPLETED';
                return (
                  <div key={t.id} className="bg-[#0A0C10] border border-gray-800 rounded-xl p-5 flex flex-col gap-5 border-l-4 border-l-[#b026ff]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-gray-900">
                      <div>
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                          {t.title} {isCompleted && <span className="text-xs bg-green-500/20 border border-green-500/50 text-green-400 px-2 py-0.5 rounded">Payout Settled</span>}
                        </h3>
                        <p className="text-xs text-gray-500">{new Date(t.scheduledAt).toLocaleString()} | <span className="text-[#00F0FF]">Prize: ₹{t.prizePool}</span></p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <select 
                          disabled={isCompleted}
                          value={editData[t.id]?.status || t.status} 
                          onChange={(e) => handleEditChange(t.id, 'status', e.target.value)}
                          className="bg-gray-900 border border-gray-700 text-xs text-gray-300 rounded px-2 py-1.5 outline-none disabled:opacity-50"
                        >
                          <option value="REGISTRATION_OPEN">Registration Open</option>
                          <option value="REGISTRATION_CLOSED">Registration Closed</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                        <span className="text-xs px-2 py-1.5 bg-gray-800 rounded text-gray-400 border border-gray-700">
                          {t.currentParticipants}/{t.maxParticipants} Registered
                        </span>
                        
                        <button 
                          onClick={() => handleDeleteTournament(t.id)} 
                          title="Delete Tournament Permanently"
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/50 p-1.5 rounded transition ml-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase text-gray-500">Custom Room Coordinates</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            disabled={isCompleted}
                            placeholder="Room ID" 
                            value={editData[t.id]?.roomId || ''} 
                            onChange={(e) => handleEditChange(t.id, 'roomId', e.target.value)}
                            className="w-full bg-[#11141D] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-[#00F0FF] outline-none disabled:opacity-50"
                          />
                          <input 
                            type="text" 
                            disabled={isCompleted}
                            placeholder="Password" 
                            value={editData[t.id]?.roomPassword || ''} 
                            onChange={(e) => handleEditChange(t.id, 'roomPassword', e.target.value)}
                            className="w-full bg-[#11141D] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-[#00F0FF] outline-none disabled:opacity-50"
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button disabled={isCompleted} onClick={() => handleUpdateTournament(t.id, false)} className="flex items-center justify-center gap-1 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded text-xs transition disabled:opacity-50">
                            <Save size={12}/> Save
                          </button>
                          <button disabled={isCompleted} onClick={() => handleUpdateTournament(t.id, true)} className="flex items-center justify-center gap-1 bg-red-500/10 border border-red-500/50 hover:bg-red-500/20 text-red-500 font-bold px-3 py-1.5 rounded text-xs transition disabled:opacity-50">
                            <Radio size={12} className={!isCompleted ? "animate-pulse" : ""}/> Broadcast Coordinates
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 bg-[#0E1118] p-3 rounded-xl border border-gray-900">
                        <label className="block text-xs font-bold uppercase text-yellow-500 flex items-center gap-1">
                          <Trophy size={12}/> Settle Tournament Winner
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder={isCompleted ? "Match Settled" : "Enter Winner's FF UID"}
                            disabled={isCompleted}
                            value={winnerInputs[t.id] || ''}
                            onChange={(e) => setWinnerInputs({...winnerInputs, [t.id]: e.target.value})}
                            className="flex-1 bg-[#11141D] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                          <button 
                            disabled={isCompleted}
                            onClick={() => handleDeclareWinner(t.id)}
                            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-800 text-black font-extrabold px-4 py-2 rounded text-xs uppercase tracking-wider transition disabled:text-gray-600 disabled:cursor-not-allowed"
                          >
                            Disburse
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {tournaments.length === 0 && <p className="text-gray-500 text-sm">No tournaments found. Draft one above!</p>}
            </div>
          </div>
        </div>
      )}

      {/* PLAYERS TAB */}
      {activeTab === 'PLAYERS' && (
        <div className="bg-[#11141D] p-8 rounded-2xl border border-gray-800/60 shadow-xl">
          <h2 className="text-xl font-bold mb-6 text-white">Player Database</h2>
          {pMessage && <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded mb-6 text-sm">{pMessage}</div>}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs uppercase text-gray-500">
                  <th className="py-3 px-4">Gamer Tag</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">FF UID</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {players.map(p => (
                  <tr key={p.id} className="border-b border-gray-900/50 hover:bg-[#0A0C10]/50 transition">
                    <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                      {p.isBanned && <Ban size={14} className="text-red-500" />}
                      <span className={p.isBanned ? 'line-through text-red-500/70' : ''}>{p.username}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">{p.email}</td>
                    <td className="py-4 px-4 text-gray-400 text-sm">{p.freeFireUid || 'N/A'}</td>
                    <td className="py-4 px-4">
                      <span className={`text-xs px-2 py-1 rounded font-bold ${p.role === 'ADMIN' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-800 text-gray-400'}`}>{p.role}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {p.role !== 'ADMIN' && (
                        <button onClick={() => handleBanToggle(p.id, p.isBanned)} className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center justify-end gap-1 ml-auto ${p.isBanned ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}>
                          {p.isBanned ? <><CheckCircle size={14}/> UNBAN</> : <><Ban size={14}/> BAN</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}