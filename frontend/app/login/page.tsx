// frontend/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../lib/axios';
import { Gamepad2, ShieldAlert, Loader2, CheckSquare, Square } from 'lucide-react';

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
  
  const [gatePassed, setGatePassed] = useState(false);
  const [gateChecked, setGateChecked] = useState(false);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await api.post('/auth/login', { email, password, hasAcceptedTerms: true });
      } else {
        res = await api.post('/auth/register', { username, email, password, hasAcceptedTerms: true });
      }
      
      const token = res.data?.token;
      if (token && typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        login(token, res.data);
        // 🚀 HARD REDIRECT: Wipes all Next.js cache loops and forces clean entry
        window.location.replace('/dashboard');
      } else {
        throw new Error('Token missing from server response.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Authentication failed. Please try again.');
      setLoading(false);
    } 
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setError('');

    const startGoogleFlow = () => {
      const google = (window as any).google;
      if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        setError("System Error: Google Client ID is missing in .env.local file.");
        setGoogleLoading(false);
        return;
      }

      const client = google.accounts.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        scope: 'email profile',
        callback: async (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            try {
              const res = await api.post('/auth/google', {
                access_token: tokenResponse.access_token,
                hasAcceptedTerms: true
              });
              
              const token = res.data?.token;
              if (token && typeof window !== 'undefined') {
                localStorage.setItem('token', token);
                login(token, res.data);
                // 🚀 HARD REDIRECT: Wipes all Next.js cache loops
                window.location.replace('/dashboard');
              }
            } catch (err: any) {
              setError(`Google Login Failed: ${err.response?.data?.error || err.message}`);
              setGoogleLoading(false);
            }
          }
        },
        error_callback: (err: any) => {
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

  const handleDecline = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <div className="min-h-screen bg-[#090B10] flex items-center justify-center p-4">
      {!gatePassed && (
        <div className="bg-[#11141D] border border-[#b026ff]/30 rounded-2xl w-full max-w-3xl flex flex-col shadow-[0_0_50px_rgba(176,38,255,0.15)] overflow-hidden animate-in fade-in duration-500">
          <div className="flex items-center gap-3 p-6 border-b border-gray-800 bg-[#0A0C10]">
            <Gamepad2 className="text-[#b026ff]" size={28} />
            <h1 className="text-xl font-extrabold text-white tracking-widest uppercase">FF Arena Entry Gate</h1>
          </div>
          <div className="p-6 md:p-8 overflow-y-auto max-h-[50vh] custom-scrollbar text-sm text-gray-300 space-y-6 bg-[#11141D]">
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex gap-3">
              <ShieldAlert className="text-red-500 flex-shrink-0" size={24} />
              <div>
                <h3 className="text-red-500 font-bold uppercase tracking-wider mb-1">Action Required</h3>
                <p className="text-red-400/80 text-xs">You must read and agree to the platform rules before you are allowed to log in or create an account.</p>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2 text-base">1. Eligibility & Account Verification</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-400">
                <li>You must be at least 18 years of age to participate in paid tournaments.</li>
                <li>Your registered Free Fire Game UID must perfectly match the UID you use in-game. Playing with an unregistered ID will result in immediate disqualification and forfeiture of winnings.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-red-400 mb-2 text-base">2. Strict Anti-Cheat & Fair Play Policy</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-400">
                <li><strong>Emulators Strictly Prohibited:</strong> This platform is exclusively for mobile players. Use of PC emulators will trigger an automatic kick from the custom room and a permanent platform ban.</li>
                <li><strong>Zero Tolerance on Hacks:</strong> Any use of third-party scripts, aimbots, wallhacks, or modified APKs will result in an irrevocable permanent hardware and IP ban. Confiscated wallet funds will not be refunded.</li>
                <li><strong>Teaming:</strong> Teaming up with opponents in Solo or non-designated team modes is strictly forbidden and heavily monitored.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2 text-base">3. Entry Fees, Wallets & Refunds</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-400">
                <li>Once an entry fee is paid and a slot is secured, it is <strong>non-refundable</strong> unless the tournament is cancelled by the Admin.</li>
                <li>If you miss the match start time, or fail to enter the Custom Room before it launches, your entry fee is forfeit.</li>
              </ul>
            </div>
          </div>
          <div className="p-6 bg-[#0A0C10] border-t border-gray-800">
            <button type="button" onClick={() => setGateChecked(!gateChecked)} className="flex items-start gap-3 w-full text-left group mb-6">
              <div className="mt-0.5 flex-shrink-0">
                {gateChecked ? <CheckSquare size={22} className="text-[#00F0FF]" /> : <Square size={22} className="text-gray-600 group-hover:text-gray-400 transition" />}
              </div>
              <span className={`text-sm leading-relaxed transition ${gateChecked ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>
                I have read, understood, and legally agree to abide by the FF Arena Rules, Anti-Cheat Guidelines, and Refund Policy.
              </span>
            </button>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handleDecline} className="flex-1 py-3.5 rounded-xl font-bold text-gray-400 border border-gray-800 hover:bg-gray-800 hover:text-white transition uppercase tracking-wider">
                Decline & Exit
              </button>
              <button disabled={!gateChecked} onClick={() => setGatePassed(true)} className={`flex-1 py-3.5 rounded-xl font-extrabold uppercase tracking-widest transition-all ${gateChecked ? 'bg-[#b026ff] hover:bg-[#901ecc] text-white shadow-[0_0_20px_rgba(176,38,255,0.4)] active:scale-95' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>
                Accept & Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {gatePassed && (
        <div className="w-full max-w-md bg-[#11141D] border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-[#b026ff] blur-[10px]"></div>
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[#b026ff]/10 p-4 rounded-2xl mb-4 border border-[#b026ff]/30">
              <Gamepad2 className="text-[#b026ff]" size={40} />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-widest uppercase">FF Arena</h1>
            <p className="text-gray-500 text-sm mt-1">{isLogin ? 'Welcome back, Champion' : 'Create your gaming legacy'}</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center mb-6 font-medium flex items-center justify-center gap-2">
              <ShieldAlert size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Gamer Tag (Username)</label>
                <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none transition" placeholder="e.g., HeadshotKing" />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none transition" placeholder="name@example.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-[#b026ff] outline-none transition" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading || googleLoading} className="w-full py-3.5 rounded-xl font-extrabold uppercase tracking-widest transition-all mt-6 flex justify-center items-center gap-2 bg-[#b026ff] hover:bg-[#901ecc] text-white active:scale-95 shadow-[0_0_20px_rgba(176,38,255,0.4)] disabled:opacity-70">
              {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Enter Arena' : 'Initialize Account')}
            </button>
          </form>

          <div className="relative flex items-center py-6">
            <div className="flex-grow border-t border-gray-800"></div>
            <span className="flex-shrink-0 mx-4 text-gray-600 text-xs font-bold uppercase tracking-wider">Or</span>
            <div className="flex-grow border-t border-gray-800"></div>
          </div>

          <button type="button" disabled={loading || googleLoading} onClick={handleGoogleLogin} className="w-full flex justify-center items-center gap-3 bg-white hover:bg-gray-200 text-black font-extrabold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-70">
            {googleLoading ? <Loader2 className="animate-spin text-black" size={20} /> : <GoogleIcon />}
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </button>

          <div className="mt-8 text-center border-t border-gray-800/50 pt-6">
            <p className="text-sm text-gray-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="ml-2 text-[#00F0FF] font-bold hover:underline">
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}