// frontend/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../lib/axios';
import { ShieldAlert, Loader2, CheckSquare, Square, X, MapPin, Gamepad2 } from 'lucide-react';

// 🛑 Razorpay Restricted States
const RESTRICTED_STATES = [
  "Andhra Pradesh", "Assam", "Odisha", "Telangana", "Nagaland", "Sikkim"
];

// All Indian States
const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal"
];

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function LoginPage() {
  const { login } = useAuthStore();
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [state, setState] = useState('');
  const [dob, setDob] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Modal States (Hidden by default, triggered ONLY after button click)
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null); 

  const isEighteenOrOlder = (dateString: string) => {
    if (!dateString) return false;
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  };

  const isValidAge = isEighteenOrOlder(dob);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      setLoading(true);
      try {
        const res = await api.post('/auth/login', { email, password });
        const token = res.data?.token;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('token', token);
          login(token, res.data);
          window.location.replace('/dashboard');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Authentication failed. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    } else {
      // User filled details -> Save them in state -> Show Terms Modal
      if (!state) {
        setError("Please select your State of Residence.");
        return;
      }
      if (RESTRICTED_STATES.includes(state)) {
        setError("Cash tournaments are restricted in your state. Registration not allowed.");
        return;
      }
      setPendingAction({ type: 'manual', payload: { username, email, password, state } });
      setTermsChecked(false);
      setShowTermsModal(true);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setError('');

    const startGoogleFlow = () => {
      const google = (window as any).google;
      if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        setError("System Error: Google Client ID is missing.");
        setGoogleLoading(false);
        return;
      }

      const client = google.accounts.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        scope: 'email profile',
        callback: async (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            if (!isLogin) {
              if (!state) {
                setError("Please select your State of Residence before signing up with Google.");
                setGoogleLoading(false);
                return;
              }
              if (RESTRICTED_STATES.includes(state)) {
                setError("Cash tournaments are restricted in your state. Registration not allowed.");
                setGoogleLoading(false);
                return;
              }
              // For new signups, show Terms Modal before hitting backend to create account
              setPendingAction({ type: 'google', payload: { access_token: tokenResponse.access_token, state } });
              setTermsChecked(false);
              setShowTermsModal(true);
              setGoogleLoading(false);
              return;
            }

            try {
              // Existing user login
              const res = await api.post('/auth/google', { access_token: tokenResponse.access_token });
              
              const token = res.data?.token;
              if (token && typeof window !== 'undefined') {
                localStorage.setItem('token', token);
                login(token, res.data);
                window.location.replace('/dashboard');
              }
            } catch (err: any) {
              setError(`Google Login Failed: ${err.response?.data?.error || err.message}`);
            } finally {
              setGoogleLoading(false);
            }
          }
        },
        error_callback: () => {
          setError('Google Login window was closed or failed to connect.');
          setGoogleLoading(false);
        }
      });
      client.requestAccessToken();
    };

    if (typeof window !== 'undefined' && (window as any).google) {
      startGoogleFlow();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = startGoogleFlow;
      script.onerror = () => {
        setError("Failed to load Google services. Check your internet connection.");
        setGoogleLoading(false);
      };
      document.body.appendChild(script);
    }
  };

  const confirmTermsAndProceed = async () => {
    setLoading(true);
    setError('');

    try {
      let res: any;
      if (pendingAction.type === 'manual') {
        res = await api.post('/auth/register', { ...pendingAction.payload, hasAcceptedTerms: true });
      } else if (pendingAction.type === 'google') {
        res = await api.post('/auth/google', { ...pendingAction.payload, hasAcceptedTerms: true });
      }

      const token = res?.data?.token;
      if (token && typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        login(token, res?.data);
        window.location.replace('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      setShowTermsModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    setShowTermsModal(false);
    setPendingAction(null);
  };

  
  return (
    <div className="min-h-screen bg-brand-bgLight text-brand-textPrimary font-sans flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Decorative ambient gradients */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl pointer-events-none"></div>

      {/* 🚀 THE TERMS MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-brand-borderLight rounded-3xl w-full max-w-2xl flex flex-col shadow-card-hover overflow-hidden animate-in zoom-in-95 duration-300 relative z-[1000]">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-brand-borderLight bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-brand-indigo">
                  <Gamepad2 size={20} />
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-wider uppercase font-gaming">
                  Arena Rules & Agreement
                </h2>
              </div>
              <button onClick={handleDecline} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X size={22} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[50vh] no-scrollbar text-sm text-slate-600 space-y-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3">
                <ShieldAlert className="text-brand-coral flex-shrink-0" size={24} />
                <div>
                  <h3 className="text-brand-coral font-bold uppercase tracking-wider text-xs mb-0.5">Final Step Required</h3>
                  <p className="text-slate-600 text-xs">To finalize your account creation, you must legally agree to our platform rules.</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1.5 text-sm">1. Eligibility & Verification</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-500 text-xs">
                  <li>You must be at least 18 years of age.</li>
                  <li>Your Free Fire Game UID must perfectly match the UID on your Profile. Playing with an unregistered ID forfeits winnings.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-brand-coral mb-1.5 text-sm">2. Strict Anti-Cheat Policy</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-500 text-xs">
                  <li><strong>Mobile Only:</strong> No emulators or PC allowed. Detected emulators face automatic disqualification.</li>
                  <li><strong>Zero Tolerance on Hacks:</strong> Scripts, aimbots, or glitches result in a permanent ban.</li>
                  <li><strong>No Teaming:</strong> Teaming in Solo modes is strictly prohibited.</li>
                </ul>
              </div>
            </div>

            <div className="p-5 sm:p-6 bg-slate-50 border-t border-brand-borderLight">
              <button 
                type="button" 
                onClick={() => setTermsChecked(!termsChecked)} 
                className="flex items-start gap-3 w-full text-left group mb-5"
              >
                <div className="mt-0.5 flex-shrink-0">
                  {termsChecked ? (
                    <CheckSquare size={20} className="text-brand-indigo" />
                  ) : (
                    <Square size={20} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                  )}
                </div>
                <span className={`text-xs leading-relaxed transition-colors ${termsChecked ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                  I have read, understood, and legally agree to abide by the VPS EsportsHub Rules, Anti-Cheat Guidelines, and Refund Policy.
                </span>
              </button>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleDecline} 
                  className="flex-1 py-3 rounded-xl font-bold text-slate-600 border border-brand-borderLight hover:bg-slate-100 transition-colors uppercase tracking-wider text-xs"
                >
                  Decline & Cancel
                </button>
                <button 
                  disabled={!termsChecked || loading} 
                  onClick={confirmTermsAndProceed} 
                  className={`flex-1 py-3 rounded-xl font-gaming font-extrabold uppercase tracking-widest text-xs transition-all flex justify-center items-center gap-2 ${
                    termsChecked 
                      ? 'bg-gradient-to-r from-brand-indigo to-brand-violet hover:from-brand-violet hover:to-brand-indigo text-white shadow-glow-primary active:scale-[0.98]' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Accept & Create Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 THE MAIN LOGIN/SIGNUP CARD */}
      <div className="w-full max-w-md bg-white border border-brand-borderLight rounded-3xl p-6 sm:p-8 shadow-card-hover relative z-10 overflow-hidden">
        
        {/* Top Gradient Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-teal"></div>

        {/* Brand Crest & Title */}
        <div className="flex flex-col items-center mb-6 pt-2">
          <div className="relative flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-indigo via-brand-violet to-brand-teal p-[2px] shadow-sm mb-3">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden">
              <svg className="w-7 h-7 text-brand-indigo" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4zm0 2.18l7 3.12v4.7c0 4.54-3.14 8.78-7 9.88-3.86-1.1-7-5.34-7-9.88V7.3l7-3.12zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold text-center tracking-wider font-gaming bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-teal bg-clip-text text-transparent uppercase leading-none">
            VPS ESPORTSHUB
          </h1>
          <span className="text-[11px] text-brand-teal font-bold tracking-wider flex items-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-mint animate-pulse"></span>
            FREE FIRE ARENA
          </span>
          <p className="text-slate-500 text-xs mt-2 font-medium">
            {isLogin ? 'Welcome back, Champion! ⚡' : 'Create your tournament legacy'}
          </p>
        </div>

        {/* Mode Switch Pills */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {error && !showTermsModal && (
          <div className="bg-red-50 border border-red-200 text-brand-coral p-3 rounded-xl text-xs font-medium text-center mb-4 flex items-center justify-center gap-2">
            <ShieldAlert size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Gamer Tag (Username)
                </label>
                <input 
                  type="text" 
                  required 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  className="w-full bg-slate-50 border border-brand-borderLight rounded-xl px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 outline-none transition text-xs sm:text-sm" 
                  placeholder="e.g., HeadshotKing" 
                />
              </div>
              
              {/* Geofencing: State Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  State of Residence
                </label>
                <div className="relative">
                  <MapPin className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${RESTRICTED_STATES.includes(state) ? 'text-brand-coral' : 'text-slate-400'}`} size={16} />
                  <select 
                    required
                    value={state}
                    onChange={(e) => { setState(e.target.value); setError(''); }}
                    className={`w-full bg-slate-50 border rounded-xl py-2.5 pl-10 pr-3.5 outline-none transition appearance-none text-slate-900 text-xs sm:text-sm ${
                      RESTRICTED_STATES.includes(state) 
                        ? 'border-brand-coral focus:border-brand-coral' 
                        : 'border-brand-borderLight focus:bg-white focus:border-brand-indigo'
                    }`}
                  >
                    <option value="">Select your State</option>
                    {INDIAN_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {RESTRICTED_STATES.includes(state) && (
                  <p className="text-[11px] text-brand-coral mt-1 font-semibold">
                    Cash tournaments are restricted in {state}.
                  </p>
                )}
              </div>

              {/* Age Verification: Date of Birth */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Date of Birth
                </label>
                <input 
                  type="date" 
                  required 
                  value={dob} 
                  onChange={(e) => setDob(e.target.value)} 
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 outline-none transition text-slate-900 text-xs sm:text-sm ${
                    dob && !isValidAge 
                      ? 'border-brand-coral focus:border-brand-coral' 
                      : 'border-brand-borderLight focus:bg-white focus:border-brand-indigo'
                  }`}
                  max={new Date().toISOString().split("T")[0]}
                />
                {dob && !isValidAge && (
                  <p className="text-[11px] text-brand-coral mt-1 font-semibold">
                    You must be at least 18 years old to register.
                  </p>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full bg-slate-50 border border-brand-borderLight rounded-xl px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 outline-none transition text-xs sm:text-sm" 
              placeholder="name@example.com" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Password
            </label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full bg-slate-50 border border-brand-borderLight rounded-xl px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/20 outline-none transition text-xs sm:text-sm" 
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || googleLoading || (!isLogin && !isValidAge) || RESTRICTED_STATES.includes(state)} 
            className="w-full py-3 rounded-xl font-gaming font-bold uppercase tracking-wider text-xs sm:text-sm transition-all mt-4 flex justify-center items-center gap-2 bg-gradient-to-r from-brand-indigo to-brand-violet hover:from-brand-violet hover:to-brand-indigo text-white active:scale-[0.98] shadow-glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && !showTermsModal ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              isLogin ? 'Enter Arena' : 'Initialize Account'
            )}
          </button>
        </form>

        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-brand-borderLight"></div>
          <span className="flex-shrink-0 mx-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Or</span>
          <div className="flex-grow border-t border-brand-borderLight"></div>
        </div>

        <button 
          type="button" 
          disabled={loading || googleLoading || (!isLogin && !isValidAge) || RESTRICTED_STATES.includes(state)} 
          onClick={handleGoogleLogin} 
          className="w-full flex justify-center items-center gap-2.5 bg-white hover:bg-slate-50 border border-brand-borderLight text-slate-700 font-bold py-2.5 rounded-xl transition-all shadow-card-subtle active:scale-[0.98] text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading ? <Loader2 className="animate-spin text-slate-700" size={18} /> : <GoogleIcon />}
          {googleLoading ? 'Connecting...' : 'Continue with Google'}
        </button>

        
        <div className="mt-5 text-center border-t border-brand-borderLight pt-4">
          <p className="text-xs text-slate-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }} 
              className="ml-1.5 text-brand-indigo font-bold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>

      </div>

    </div>
  );
}