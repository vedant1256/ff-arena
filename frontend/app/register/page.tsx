// frontend/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/useAuthStore';
import { Gamepad2, Mail, Lock, User, Crosshair, CheckSquare, Square } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', freeFireUid: '' });
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false); // 🚀 NEW: Legal compliance state
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hasAcceptedTerms) {
      setError('You must read and agree to the Arena Rules & Terms.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = { ...formData, hasAcceptedTerms: true }; // 🚀 NEW: Attaching legal consent
      if (payload.freeFireUid === '') {
        delete (payload as any).freeFireUid;
      }

      const response = await api.post('/auth/register', payload);
      login(response.data.user, response.data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Try a different username/email.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-8">
      
      <div className="mb-6 flex flex-col items-center">
        <h1 className="text-3xl font-extrabold tracking-widest text-white flex items-center gap-2">
          <Gamepad2 size={32} className="text-[#00F0FF]" /> RECRUITMENT
        </h1>
      </div>

      <div className="bg-[#11141D] border border-gray-800/60 p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#b026ff] rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
        
        <h2 className="text-xl font-bold mb-6 text-white text-center">Create Your Profile</h2>
        
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm flex items-center justify-center text-center">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4 relative z-10">
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
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Free Fire UID <span className="text-gray-700">(Required for Payouts)</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Crosshair size={16} className="text-gray-500" /></div>
              <input name="freeFireUid" type="text" onChange={handleChange} placeholder="e.g. 1234567890"
                className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl pl-11 pr-4 py-2.5 text-white focus:outline-none focus:border-[#00F0FF] transition-colors" />
            </div>
          </div>

          {/* 🚀 NEW: Integrated Checkbox */}
          <div className="pt-2">
            <button type="button" onClick={() => setHasAcceptedTerms(!hasAcceptedTerms)} className="flex items-start gap-3 w-full text-left group">
              <div className="mt-0.5 flex-shrink-0">
                {hasAcceptedTerms ? <CheckSquare size={20} className="text-[#00F0FF]" /> : <Square size={20} className="text-gray-600 group-hover:text-gray-400 transition" />}
              </div>
              <span className={`text-xs leading-relaxed transition ${hasAcceptedTerms ? 'text-gray-200' : 'text-gray-500'}`}>
                I have read, understood, and legally agree to abide by the FF Arena Rules, Anti-Cheat Guidelines, and Refund Policy.
              </span>
            </button>
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !hasAcceptedTerms}
            className={`w-full font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 ${hasAcceptedTerms ? 'bg-gradient-to-r from-[#b026ff]/20 to-[#b026ff]/10 hover:from-[#b026ff]/30 hover:to-[#b026ff]/20 border border-[#b026ff]/50 text-[#b026ff]' : 'bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed'}`}
          >
            {isLoading ? 'ENLISTING...' : 'ENLIST NOW'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Already a veteran? <Link href="/login" className="text-[#00F0FF] hover:text-white transition-colors font-semibold">Log in</Link>
        </p>
      </div>
    </div>
  );
}