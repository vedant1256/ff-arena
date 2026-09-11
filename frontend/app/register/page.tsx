// frontend/app/register/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gamepad2, MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../../lib/axios';
import { useGoogleLogin } from '@react-oauth/google';

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

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    state: ''
  });
  
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if selected state is restricted
  const isStateRestricted = RESTRICTED_STATES.includes(formData.state);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isStateRestricted) {
      setError("Cash tournaments are banned in your state. Registration not allowed.");
      return;
    }
    if (!isAgeVerified) {
      setError("You must confirm that you are 18+ to register.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = { ...formData, hasAcceptedTerms: isAgeVerified };
      const res = await api.post('/auth/register', payload);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Google Login functionality
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        if (!formData.state || isStateRestricted || !isAgeVerified) {
           setError("Please select a valid state and verify your age before using Google Login.");
           return;
        }
        setLoading(true);
        const payload = { 
          token: tokenResponse.access_token, 
          state: formData.state,
          hasAcceptedTerms: isAgeVerified 
        };
        const res = await api.post('/auth/google', payload);
        localStorage.setItem('token', res.data.token);
        router.push('/dashboard');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Google login failed');
        setLoading(false);
      }
    },
    onError: () => setError('Google login failed')
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-[#11141D] border border-gray-800 rounded-2xl w-full max-w-md p-8 shadow-2xl">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/20 mb-4">
            <Gamepad2 className="text-purple-500" size={24} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-widest uppercase">VPS ESPORTSHUB</h2>
          <p className="text-gray-400 text-sm mt-1">Create your gaming legacy</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm font-bold mb-6 flex items-start gap-2">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Gamer Tag (Username)</label>
            <input 
              type="text" 
              name="username"
              required
              onChange={handleChange}
              className="w-full bg-[#0A0C10] border border-gray-800 focus:border-purple-500 text-white rounded-lg py-2.5 px-4 outline-none transition text-sm"
              placeholder="e.g., HeadshotKing"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Email Address</label>
            <input 
              type="email" 
              name="email"
              required
              onChange={handleChange}
              className="w-full bg-[#0A0C10] border border-gray-800 focus:border-purple-500 text-white rounded-lg py-2.5 px-4 outline-none transition text-sm"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Password</label>
            <input 
              type="password" 
              name="password"
              required
              onChange={handleChange}
              className="w-full bg-[#0A0C10] border border-gray-800 focus:border-purple-500 text-white rounded-lg py-2.5 px-4 outline-none transition text-sm"
              placeholder="••••••••"
            />
          </div>

          {/* 🚀 Geofencing: State Selection */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">State of Residence</label>
            <div className="relative">
              <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 ${isStateRestricted ? 'text-red-500' : 'text-gray-500'}`} size={16} />
              <select 
                name="state"
                required
                onChange={handleChange}
                className={`w-full bg-[#0A0C10] border focus:border-purple-500 text-white rounded-lg py-2.5 pl-9 pr-4 outline-none transition appearance-none text-sm ${isStateRestricted ? 'border-red-500 focus:border-red-500' : 'border-gray-800'}`}
              >
                <option value="">Select your State</option>
                {INDIAN_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            {isStateRestricted && (
              <p className="text-xs text-red-400 mt-2 font-semibold">
                Cash tournaments are banned in {formData.state}.
              </p>
            )}
          </div>

          {/* 🚀 18+ Age & Policy Declaration */}
          <div className="flex items-start gap-3 mt-4 bg-[#0A0C10] p-3 rounded-lg border border-gray-800">
            <input 
              type="checkbox" 
              id="ageVerification"
              checked={isAgeVerified}
              onChange={(e) => setIsAgeVerified(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500 bg-gray-800 flex-shrink-0"
            />
            <label htmlFor="ageVerification" className="text-[10px] text-gray-400 leading-tight cursor-pointer">
              I declare that I am <strong>18+ years of age</strong>, not a resident of any restricted states, and I agree to the Terms & Conditions.
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading || isStateRestricted || !isAgeVerified}
            className="w-full bg-[#A855F7] hover:bg-[#9333EA] text-white font-black py-3 px-4 rounded-lg transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex justify-center items-center"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'INITIALIZE ACCOUNT'}
          </button>
        </form>

        <div className="relative flex items-center py-6">
          <div className="flex-grow border-t border-gray-800"></div>
          <span className="flex-shrink-0 mx-4 text-gray-500 text-xs font-bold">OR</span>
          <div className="flex-grow border-t border-gray-800"></div>
        </div>

        <button 
          onClick={() => googleLogin()}
          disabled={loading}
          className="w-full bg-white hover:bg-gray-100 text-black font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>

        <p className="text-center text-gray-500 text-xs mt-8">
          Already have an account? <Link href="/login" className="text-[#00F0FF] hover:underline font-bold">Log In</Link>
        </p>
      </div>
    </div>
  );
}