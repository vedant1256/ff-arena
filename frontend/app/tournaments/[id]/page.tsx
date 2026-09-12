'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { ShieldAlert, Users, Map, Loader2, ArrowLeft, Lock, Gamepad2, IndianRupee, Key, QrCode, CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

export default function TournamentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 📸 QR Code Modal State
  const [showModal, setShowModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1);
  const [utr, setUtr] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  // Room Credentials State
  const [credentials, setCredentials] = useState<{roomId: string, roomPassword: string} | null>(null);
  const [credError, setCredError] = useState('');

  const fetchRoomCredentials = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/tournaments/${params.id}/room-credentials`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCredentials(res.data);
      setCredError('');
    } catch (err: any) {
      setCredError(err.response?.data?.error || 'Failed to fetch credentials.');
    }
  };

  const fetchTournament = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/tournaments/${params.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setTournament(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch tournament.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournament();

    // 🚀 NEW: Real-time Push Notification for Room Credentials
    const socketURL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(socketURL);

    socket.on('roomDataReleased', (data) => {
      if (data.tournamentId === params.id) {
        toast.success("🚨 Room Credentials are now Live! Click Reveal Credentials.", {
          duration: 6000,
          position: 'top-center',
          icon: '🔥'
        });
        
        // If the user already has credentials visible, or is eligible, re-fetch them
        const token = localStorage.getItem('token');
        if (token) fetchRoomCredentials();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [params.id]);

  const initiateJoin = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setPaymentStep(1);
    setShowModal(true);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (paymentStep === 3) {
      interval = setInterval(async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await api.get(`/payments/status/${params.id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          
          if (res.data.status === 'APPROVED') {
            setSuccess('Payment verified successfully! You are registered.');
            setShowModal(false);
            setUtr('');
            setPaymentStep(1);
            await fetchTournament();
            clearInterval(interval);
            setJoining(false);
          } else if (res.data.status === 'FAILED_MISMATCH') {
            setError('Payment verification failed. The received amount did not match the entry fee.');
            setPaymentStep(2);
            clearInterval(interval);
            setJoining(false);
          }
        } catch (err) {
          console.error('Polling error', err);
        }
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    }
  }, [paymentStep, params.id]);

  const submitUtr = async () => {
    if (!/^\d{12}$/.test(utr.trim())) {
      setError('Please enter a valid 12-digit numeric Transaction ID (UTR).');
      return;
    }
    setJoining(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await api.post(`/payments/submit-utr`, { tournamentId: params.id, utr: utr.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.status === 'APPROVED') {
        setSuccess('Payment auto-verified successfully! You are registered.');
        setShowModal(false);
        setUtr('');
        await fetchTournament();
        setJoining(false);
      } else {
        // Switch to waiting state
        setPaymentStep(3);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit Transaction ID.');
      setJoining(false);
    } 
  };

  if (loading) {
    return (
      <div className="min-h-[85vh] flex flex-col justify-center items-center gap-4 text-[#00F0FF]">
        <Loader2 size={40} className="animate-spin" />
        <h2 className="text-xl font-bold tracking-widest uppercase">Initializing Arena...</h2>
      </div>
    );
  }

  if (error && !tournament && !showModal) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center">
        <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-2xl">
          <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-500 mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link href="/dashboard">
            <button className="bg-[#11141D] border border-gray-800 px-6 py-2 rounded-xl text-white hover:border-gray-600 transition">
              Return to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const isParticipant = tournament.participants?.some((p: any) => p.id === user?.id);
  const isPending = tournament.isPendingVerification;
  const percentage = Math.min(((tournament.currentParticipants || 0) / tournament.maxParticipants) * 100, 100);
  const isFull = tournament.currentParticipants >= tournament.maxParticipants;
  const isClosed = tournament.status !== 'REGISTRATION_OPEN';

  return (
    <div className="max-w-5xl mx-auto space-y-6 mt-6 pb-20 animate-in fade-in duration-500">
      
      {/* 💰 QR PAYMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0A0C10] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition">
              <X size={24} />
            </button>

            {paymentStep === 1 ? (
              <div className="text-center">
                <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">Complete Payment</h2>
                <p className="text-sm text-gray-400 mb-6">Scan the QR code below using any UPI app to pay the entry fee.</p>
                
                <div className="bg-white p-4 rounded-2xl mx-auto w-48 h-48 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  {tournament.entryFee === 10 ? (
                    <img src="/qr-10.png" alt="₹10 QR Code" className="w-full h-full object-contain rounded-xl" />
                  ) : tournament.entryFee === 20 ? (
                    <img src="/qr-20.png" alt="₹20 QR Code" className="w-full h-full object-contain rounded-xl" />
                  ) : tournament.entryFee === 40 ? (
                    <img src="/qr-40.png" alt="₹40 QR Code" className="w-full h-full object-contain rounded-xl" />
                  ) : (
                    <div className="text-center">
                      <QrCode size={64} className="text-gray-900 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-red-600 uppercase">Contact Admin for QR</p>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                  <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-1">Amount to Pay</p>
                  <p className="text-3xl font-black text-yellow-500 flex items-center justify-center gap-1">
                    <IndianRupee size={24}/> {tournament.entryFee}
                  </p>
                </div>

                <button 
                  onClick={() => setPaymentStep(2)}
                  className="w-full py-4 rounded-xl font-black uppercase tracking-widest bg-gradient-to-r from-[#00F0FF] to-[#00b3ff] text-gray-900 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                >
                  I Have Paid
                </button>
              </div>
            ) : paymentStep === 2 ? (
              <div className="text-center">
                <h2 className="text-2xl font-black text-[#00F0FF] uppercase tracking-wider mb-2">Verify Payment</h2>
                <p className="text-sm text-gray-400 mb-8">Enter the 12-digit UTR or Transaction ID from your payment app.</p>
                
                <input
                  type="text"
                  placeholder="e.g. 301234567890"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  className="w-full bg-[#11141D] border border-gray-700 text-white text-center text-xl font-mono tracking-widest rounded-xl p-4 mb-6 focus:outline-none focus:border-[#00F0FF] transition-colors"
                />

                {error && <p className="text-red-500 text-xs font-bold mb-4">{error}</p>}

                <div className="flex gap-4">
                  <button 
                    onClick={() => setPaymentStep(1)}
                    className="flex-1 py-4 rounded-xl font-bold uppercase tracking-widest bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    onClick={submitUtr}
                    disabled={joining}
                    className="flex-[2] py-4 rounded-xl font-black uppercase tracking-widest bg-gradient-to-r from-[#b026ff] to-[#00F0FF] text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50"
                  >
                    {joining ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Submit UTR'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-black text-yellow-500 uppercase tracking-wider mb-2 animate-pulse">Verifying...</h2>
                <p className="text-sm text-gray-400 mb-8">Please wait while our system verifies your payment. This usually takes 1-2 minutes.</p>
                <div className="flex justify-center mb-6">
                  <Loader2 className="animate-spin text-yellow-500" size={48} />
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Do not close this window</p>
              </div>
            )}
          </div>
        </div>
      )}


      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard">
          <button className="flex items-center gap-2 text-gray-400 hover:text-white transition group bg-[#11141D] px-4 py-2 rounded-lg border border-gray-800 hover:border-gray-600">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold uppercase tracking-wider text-xs">Back to Dashboard</span>
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#11141D] border border-gray-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00F0FF]/5 rounded-bl-[100px] blur-3xl -z-0"></div>

            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="bg-[#00F0FF]/10 text-[#00F0FF] text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-[#00F0FF]/30 flex items-center gap-2">
                  <Gamepad2 size={14} /> {tournament.gameName}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border flex items-center gap-1 ${isClosed ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}>
                  {isClosed ? <Lock size={12}/> : <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse mr-1"></div>}
                  {tournament.status.replace(/_/g, ' ')}
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-black text-white mb-6 uppercase tracking-wider leading-tight">
                {tournament.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 font-bold uppercase tracking-wider mb-10">
                <span className="flex items-center gap-2 bg-[#0A0C10] px-4 py-2.5 rounded-xl border border-gray-800">
                  <Map size={16} className="text-[#00F0FF]"/> {tournament.map}
                </span>
                <span className="flex items-center gap-2 bg-[#0A0C10] px-4 py-2.5 rounded-xl border border-gray-800">
                  <Users size={16} className="text-[#b026ff]"/> {tournament.teamMode}
                </span>
                <span className="flex items-center gap-2 bg-[#0A0C10] px-4 py-2.5 rounded-xl border border-gray-800">
                  <ShieldAlert size={16} className="text-yellow-500"/> Lvl {tournament.minLevel}+
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-[#0A0C10] border border-gray-800 p-6 rounded-2xl text-center flex flex-col items-center justify-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Entry Fee</p>
                  <p className="text-yellow-500 font-black text-3xl flex items-center gap-1"><IndianRupee size={24}/> {tournament.entryFee}</p>
                </div>
                <div className="bg-[#0A0C10] border border-green-900/30 p-6 rounded-2xl text-center flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-full"></div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Prize Pool</p>
                  <p className="text-green-400 font-black text-3xl flex items-center gap-1"><IndianRupee size={24}/> {tournament.prizePool}</p>
                </div>
              </div>
              
              <div className="bg-[#0A0C10] p-5 rounded-2xl border border-gray-800">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                  <span>Slots Filled</span>
                  <span className={isFull ? 'text-red-500 font-black' : 'text-[#00F0FF] font-black'}>
                    {tournament.currentParticipants} / {tournament.maxParticipants}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full transition-all duration-1000 ${isFull ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.5)]'}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-[#11141D] border border-red-500/20 rounded-3xl p-8 shadow-xl">
            <h2 className="flex items-center gap-3 text-xl font-black text-red-500 uppercase tracking-widest mb-6">
              <ShieldAlert size={24} /> Match Rules
            </h2>
            <ul className="space-y-4 text-sm text-gray-300 font-medium">
              <li className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                <p>Strictly Mobile only. PC/Emulators will be permanently banned with zero refunds.</p>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                <p>Your in-game Free Fire UID must match your profile perfectly for automated payouts.</p>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                <p>Room ID and Password will be displayed here for paid participants 15 minutes before start.</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-6">
          <div className="bg-[#11141D] border border-gray-800 rounded-3xl p-8 shadow-2xl sticky top-24">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center justify-between">
              Match Status
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </h3>
            
            {isParticipant ? (
              <div className="mb-8 bg-[#00F0FF]/5 border border-[#00F0FF]/20 p-6 rounded-2xl text-center">
                <ShieldAlert className="text-[#00F0FF] mx-auto mb-3" size={32} />
                <p className="text-sm font-black text-[#00F0FF] uppercase tracking-wider mb-2">You're Registered</p>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">Room details are revealed 15 minutes before the match starts.</p>
                
                {credentials ? (
                  <div className="bg-[#0A0C10] p-4 rounded-xl border border-green-500/30 text-left mt-4 space-y-3">
                    <div className="flex justify-between items-center text-sm border-b border-gray-800 pb-2">
                      <span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">ID</span>
                      <span className="text-white font-mono font-bold tracking-wider">{credentials.roomId}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Pass</span>
                      <span className="text-white font-mono font-bold tracking-wider">{credentials.roomPassword}</span>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={fetchRoomCredentials}
                    className="w-full py-3 rounded-xl font-bold uppercase tracking-widest bg-gray-800 hover:bg-gray-700 text-white transition-colors text-xs"
                  >
                    Reveal Credentials
                  </button>
                )}
                
                {credError && <p className="text-red-500 text-[10px] font-bold mt-3">{credError}</p>}
              </div>
            ) : isPending ? (
              <div className="mb-8 bg-yellow-500/10 border border-yellow-500/30 p-6 rounded-2xl text-center">
                <Loader2 className="text-yellow-500 mx-auto mb-3 animate-spin" size={32} />
                <p className="text-sm font-black text-yellow-500 uppercase tracking-wider mb-2">Verification Pending</p>
                <p className="text-xs text-gray-400 leading-relaxed">Your UTR is currently being verified by an Admin. You will be added to the match once confirmed.</p>
              </div>
            ) : null}

            {success && <div className="mb-6 bg-green-500/10 text-green-400 text-xs font-bold p-4 rounded-xl border border-green-500/30 text-center">{success}</div>}

            {!isParticipant && !isPending && (
              <button 
                onClick={initiateJoin}
                disabled={isFull || isClosed}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all ${
                  isClosed ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' :
                  isFull ? 'bg-red-500/10 text-red-500 cursor-not-allowed border border-red-500/20' :
                  'bg-gradient-to-r from-[#b026ff] to-[#00F0FF] text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-[0_0_30px_rgba(0,240,255,0.4)]'
                }`}
              >
                 {isClosed ? 'Registration Closed' :
                 isFull ? 'Tournament Full' : 
                 'Register'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
