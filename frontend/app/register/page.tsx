// frontend/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/useAuthStore';
import { Gamepad2, Mail, Lock, User, Crosshair, CheckSquare, Square, X, ShieldAlert, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', freeFireUid: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  // Modal States
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: User clicks Enlist -> Show the Modal instead of submitting!
  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTermsChecked(false);
    setShowTermsModal(true);
  };

  // Step 2: User accepts terms -> Send to backend
  const handleFinalRegister = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const payload = { ...formData, hasAcceptedTerms: true };
      if (payload.freeFireUid === '') {
        delete (payload as any).freeFireUid;
      }

      const response = await api.post('/auth/register', payload);
      login(response.data.user, response.data.token);
      window.location.replace('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Try a different username/email.');
      setShowTermsModal(false); // Close modal to show the error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-8 relative">
      
      {/* 🚀 THE TERMS MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-[#11141D] border border-[#b026ff]/50 rounded-3xl w-full max-w-2xl flex flex-col shadow-[0_0_50px_rgba(176,38,255,0.2)] overflow-hidden animate-in zoom-in-95 duration-300 relative z-[1000]">
            <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-[#0A0C10]">
              <div className="flex items-center gap-3">
                <Gamepad2 className="text-[#b026ff]" size={28} />
                <h1 className="text-xl font-extrabold text-white tracking-widest uppercase">Arena Rules</h1>
              </div>
              <button onClick={() => setShowTermsModal(false)} className="text-gray-500 hover:text-white transition">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto max-h-[50vh] custom-scrollbar text-sm text-gray-300 space-y-6 bg-[#11141D]">
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex gap-3">
                <ShieldAlert className="text-red-500 flex-shrink-0" size={24} />
                <div>
                  <h3 className="text-red-500 font-bold uppercase tracking-wider mb-1">Final Step Required</h3>
                  <p className="text-red-400/80 text-xs">To finalize your account creation, you must legally agree to our platform rules.</p>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2 text-base">1. Eligibility & Verification</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-400">
                  <li>You must be at least 18 years of age.</li>
                  <li>Your Free Fire Game UID must perfectly match the UID on your Profile.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-red-400 mb-2 text-base">2. Strict Anti-Cheat Policy</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-400">
                  <li><strong>No Emulators:</strong> Mobile players only. PC use triggers an automatic ban.</li>
                  <li><strong>Zero Tolerance on Hacks:</strong> Scripts, aimbots, or glitches result in a permanent hardware & IP ban.</li>
                </ul>
              </div>
            </div>

            <div className="p-6 bg-[#0A0C10] border-t border-gray-800">
              <button type="button" onClick={() => setTermsChecked(!termsChecked)} className="flex items-start gap-3 w-full text-left group mb-6">
                <div className="mt-0.5 flex-shrink-0">
                  {termsChecked ? <CheckSquare size={22} className="text-[#00F0FF]" /> : <Square size={22} className="text-gray-600 group-hover:text-gray-400 transition" />}
                </div>
                <span className={`text-sm leading-relaxed transition ${termsChecked ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>
                  I have read, understood, and legally agree to abide by the FF Arena Rules.
                </span>
              </button>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => setShowTermsModal(false)} className="flex-1 py-4 rounded-xl font-bold text-gray-400 border border-gray-800 hover:bg-gray-800 hover:text-white transition uppercase tracking-wider">
                  Decline & Cancel
                </button>
                <button disabled={!termsChecked || isLoading} onClick={handleFinalRegister} className={`flex-1 py-4 rounded-xl font-extrabold uppercase tracking-widest transition-all flex justify-center items-center gap-2 ${termsChecked ? 'bg-[#b026ff] hover:bg-[#901ecc] text-white shadow-[0_0_20px_rgba(176,38,255,0.4)] active:scale-95' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Accept & Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 THE MAIN FORM */}
      <div className="mb-6 flex flex-col items-center">
        <h1 className="text-3xl font-extrabold tracking-widest text-white flex items-center gap-2">
          <Gamepad2 size={32} className="text-[#00F0FF]" /> RECRUITMENT
        </h1>
      </div>

      <div className="bg-[#11141D] border border-gray-800/60 p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#b026ff] rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
        
        <h2 className="text-xl font-bold mb-6 text-white text-center">Create Your Profile</h2>
        
        {error && !showTermsModal && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm flex items-center justify-center text-center">{error}</div>}

        <form onSubmit={handleInitialSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Gamer Tag</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User size={16} className="text-gray-500" /></div>
              <input name="username" type="text" required onChange={handleChange} placeholder="e.g. Ninja"
                className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl pl-11 pr-4 py-2.5 text-white focus:outline-none focus:border-[#00F0FF] transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail size={16} className="text-gray-500" /></div>
              <input name="email" type="email" required onChange={handleChange} placeholder="gamer@example.com"
                className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl pl-11 pr-4 py-2.5 text-white focus:outline-none focus:border-[#00F0FF] transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={16} className="text-gray-500" /></div>
              <input name="password" type="password" required minLength={6} onChange={handleChange} placeholder="••••••••"
                className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl pl-11 pr-4 py-2.5 text-white focus:outline-none focus:border-[#00F0FF] transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Free Fire UID <span className="text-gray-700">(Optional)</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Crosshair size={16} className="text-gray-500" /></div>
              <input name="freeFireUid" type="text" onChange={handleChange} placeholder="e.g. 1234567890"
                className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl pl-11 pr-4 py-2.5 text-white focus:outline-none focus:border-[#00F0FF] transition-colors" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#b026ff]/20 to-[#b026ff]/10 hover:from-[#b026ff]/30 hover:to-[#b026ff]/20 border border-[#b026ff]/50 text-[#b026ff] font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
          >
            {isLoading && !showTermsModal ? <Loader2 className="animate-spin" size={20}/> : 'ENLIST NOW'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Already a veteran? <Link href="/login" className="text-[#00F0FF] hover:text-white transition-colors font-semibold">Log in</Link>
        </p>
      </div>
    </div>
  );
} 