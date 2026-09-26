'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { ShieldAlert, Users, Map, Loader2, ArrowLeft, Lock, Gamepad2, QrCode, CheckCircle2, X, Clock } from 'lucide-react';
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

  // QR Code Modal State
  const [showModal, setShowModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1);
  const [utr, setUtr] = useState('');

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

    const socketURL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(socketURL);

    socket.on('roomDataReleased', (data) => {
      if (data.tournamentId === params.id) {
        toast.success("🚨 Room Credentials are now Live! Click Reveal Credentials.", {
          duration: 6000,
          position: 'top-center',
          icon: '🔥'
        });
        
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
    };
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
        setPaymentStep(3);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit Transaction ID.');
      setJoining(false);
    } 
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center gap-3 text-brand-indigo">
        <Loader2 size={36} className="animate-spin" />
        <h2 className="text-sm font-bold tracking-widest uppercase font-gaming text-slate-500">
          Loading Arena Match...
        </h2>
      </div>
    );
  }

  if (error && !tournament && !showModal) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center px-4">
        <div className="bg-white border border-red-200 p-8 rounded-3xl shadow-card-hover">
          <ShieldAlert size={40} className="text-brand-coral mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Match Not Found</h2>
          <p className="text-slate-500 text-xs mb-5">{error}</p>
          <Link href="/dashboard">
            <button className="bg-brand-indigo hover:bg-brand-violet text-white font-gaming text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-sm">
              Back to Lobby
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const isParticipant = tournament?.participants?.some((p: any) => p.id === user?.id);
  const isPending = tournament?.isPendingVerification;
  const currentParticipants = tournament?.currentParticipants || 0;
  const maxParticipants = tournament?.maxParticipants || 1;
  const percentage = Math.min((currentParticipants / maxParticipants) * 100, 100);
  const isFull = currentParticipants >= maxParticipants;
  const isClosed = tournament?.status !== 'REGISTRATION_OPEN';

  return (
    <div className="max-w-md md:max-w-4xl lg:max-w-5xl mx-auto px-4 pt-4 pb-20 space-y-4">
      
      {/* 💰 QR PAYMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-brand-borderLight rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-card-hover relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition">
              <X size={20} />
            </button>

            {paymentStep === 1 ? (
              <div className="text-center">
                <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-wider font-gaming mb-1">Complete Payment</h2>
                <p className="text-xs text-slate-500 mb-5">Scan the QR code below using Google Pay, PhonePe, or Paytm.</p>
                
                <div className="bg-slate-50 border border-brand-borderLight p-4 rounded-2xl mx-auto w-48 h-48 flex items-center justify-center mb-5 shadow-card-subtle">
                  {tournament.entryFee === 10 ? (
                    <img src="/qr-10.png" alt="₹10 QR Code" className="w-full h-full object-contain rounded-xl" />
                  ) : tournament.entryFee === 20 ? (
                    <img src="/qr-20.png" alt="₹20 QR Code" className="w-full h-full object-contain rounded-xl" />
                  ) : tournament.entryFee === 40 ? (
                    <img src="/qr-40.png" alt="₹40 QR Code" className="w-full h-full object-contain rounded-xl" />
                  ) : (
                    <div className="text-center">
                      <QrCode size={56} className="text-slate-400 mx-auto mb-1" />
                      <p className="text-[9px] font-bold text-slate-500 uppercase">UPI Verification QR</p>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 mb-5">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-0.5">Amount to Pay</p>
                  <p className="text-2xl font-black text-amber-600 font-gaming">
                    ₹{tournament.entryFee}
                  </p>
                </div>

                <button 
                  onClick={() => setPaymentStep(2)}
                  className="w-full py-3 rounded-xl font-gaming font-bold uppercase tracking-wider text-xs bg-gradient-to-r from-brand-indigo to-brand-violet hover:from-brand-violet hover:to-brand-indigo text-white shadow-glow-primary active:scale-[0.98] transition-all"
                >
                  I Have Paid
                </button>
              </div>
            ) : paymentStep === 2 ? (
              <div className="text-center">
                <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-wider font-gaming mb-1">Verify Payment</h2>
                <p className="text-xs text-slate-500 mb-6">Enter the 12-digit UTR or Transaction ID from your payment app.</p>
                
                <input
                  type="text"
                  placeholder="e.g. 301234567890"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  className="w-full bg-slate-50 border border-brand-borderLight text-slate-900 text-center text-lg font-mono tracking-widest rounded-xl p-3 mb-4 focus:outline-none focus:border-brand-indigo transition-colors"
                />

                {error && <p className="text-brand-coral text-xs font-bold mb-4">{error}</p>}

                <div className="flex gap-3">
                  <button 
                    onClick={() => setPaymentStep(1)}
                    className="flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    onClick={submitUtr}
                    disabled={joining}
                    className="flex-[2] py-3 rounded-xl font-gaming font-bold uppercase tracking-wider text-xs bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-glow-primary hover:from-brand-violet hover:to-brand-indigo active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {joining ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Submit UTR'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <h2 className="text-xl font-extrabold text-amber-600 uppercase tracking-wider font-gaming mb-1">Verifying...</h2>
                <p className="text-xs text-slate-500 mb-6">Please wait while our system auto-verifies your payment.</p>
                <div className="flex justify-center mb-5">
                  <Loader2 className="animate-spin text-amber-500" size={40} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Do not close this modal</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Back Button */}
      <div>
        <Link href="/dashboard">
          <button className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition bg-white px-3.5 py-1.5 rounded-xl border border-brand-borderLight shadow-card-subtle text-xs font-bold font-gaming uppercase">
            <ArrowLeft size={14} /> Back to Lobby
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Details Card */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white border border-brand-borderLight rounded-3xl p-5 sm:p-7 shadow-card-hover relative overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="bg-indigo-50 text-brand-indigo text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-200">
                {tournament.gameName || 'FREE FIRE'}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1 ${
                isClosed 
                  ? 'bg-slate-100 text-slate-500 border-slate-200' 
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                {!isClosed && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                {tournament.status.replace(/_/g, ' ')}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-gaming uppercase tracking-wide mb-3">
              {tournament.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-semibold mb-6">
              <span className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <span>🗺️</span> {tournament.map || 'Bermuda'}
              </span>
              <span className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <span>👥</span> {tournament.teamMode || 'Solo'}
              </span>
              <span className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <ShieldAlert size={14} className="text-amber-500"/> Lvl {tournament.minLevel || 20}+
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl text-center">
                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">ENTRY FEE</p>
                <p className="text-amber-600 font-black text-2xl font-gaming">₹{tournament.entryFee}</p>
                <p className="text-[9px] text-slate-400">Per Entry</p>
              </div>
              <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-2xl text-center">
                <p className="text-[9px] text-emerald-700 uppercase tracking-widest font-bold mb-0.5">PRIZE POOL</p>
                <p className="text-emerald-600 font-black text-2xl font-gaming">₹{tournament.prizePool}</p>
                <p className="text-[9px] text-emerald-600/80">Winner Takes 60%</p>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
                <span>Slots Filled</span>
                <span className="text-brand-indigo font-bold">{currentParticipants} / {maxParticipants}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand-indigo to-brand-teal transition-all duration-500 rounded-full" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Rules info */}
          <div className="bg-white border border-brand-borderLight rounded-3xl p-5 sm:p-6 shadow-card-subtle">
            <h3 className="text-xs font-bold text-slate-900 uppercase font-gaming tracking-wide mb-3 flex items-center gap-1.5">
              <ShieldAlert size={16} className="text-brand-coral" /> Match Rules & Fair Play
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-coral mt-1 flex-shrink-0"></span>
                <span>Strictly Mobile only. PC/Emulators result in instant disqualification and forfeiture.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo mt-1 flex-shrink-0"></span>
                <span>Your registered Free Fire UID must match your joined player name.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo mt-1 flex-shrink-0"></span>
                <span>Room ID and Password are disclosed 15 minutes before the match start time.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Action Column */}
        <div className="space-y-4">
          <div className="bg-white border border-brand-borderLight rounded-3xl p-5 sm:p-6 shadow-card-hover">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center justify-between">
              Registration
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            </h3>
            
            {isParticipant ? (
              <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-2xl text-center mb-4">
                <CheckCircle2 className="text-brand-indigo mx-auto mb-2" size={28} />
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">You're Registered</p>
                <p className="text-[11px] text-slate-500 mt-1 mb-3">Room details unlock 15 minutes before match start.</p>
                
                {credentials ? (
                  <div className="bg-white p-3 rounded-xl border border-brand-borderLight text-left space-y-2 text-xs">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Room ID</span>
                      <span className="text-slate-900 font-mono font-bold">{credentials.roomId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Password</span>
                      <span className="text-slate-900 font-mono font-bold">{credentials.roomPassword}</span>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={fetchRoomCredentials}
                    className="w-full py-2 rounded-xl font-gaming font-bold uppercase tracking-wider bg-brand-indigo hover:bg-brand-violet text-white transition-colors text-xs shadow-sm"
                  >
                    Reveal Credentials
                  </button>
                )}
                
                {credError && <p className="text-brand-coral text-[10px] font-bold mt-2">{credError}</p>}
              </div>
            ) : isPending ? (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-center mb-4">
                <Loader2 className="text-amber-600 mx-auto mb-2 animate-spin" size={28} />
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Verification Pending</p>
                <p className="text-[11px] text-slate-500 mt-1">Admin is verifying your Transaction ID (UTR).</p>
              </div>
            ) : null}

            {success && <div className="mb-4 bg-emerald-50 text-emerald-700 text-xs font-bold p-3 rounded-xl border border-emerald-200 text-center">{success}</div>}

            {!isParticipant && !isPending && (
              <button 
                onClick={initiateJoin}
                disabled={isFull || isClosed}
                className={`w-full py-3.5 rounded-xl font-gaming font-bold uppercase tracking-wider text-xs sm:text-sm transition-all shadow-glow-primary ${
                  isClosed ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' :
                  isFull ? 'bg-red-100 text-brand-coral cursor-not-allowed shadow-none' :
                  'bg-gradient-to-r from-brand-indigo to-brand-violet hover:from-brand-violet hover:to-brand-indigo text-white active:scale-[0.98]'
                }`}
              >
                {isClosed ? 'Registration Closed' :
                 isFull ? 'Tournament Full' : 
                 'Join Tournament'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
