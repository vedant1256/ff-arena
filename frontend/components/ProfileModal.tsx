// frontend/components/ProfileModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Crosshair, Save, Copy, CheckCircle2, Gift } from 'lucide-react';
import api from '../lib/axios';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const [uid, setUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user?.freeFireUid) setUid(user.freeFireUid);
  }, [user]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid.trim()) {
      setMessage("UID cannot be empty!");
      return;
    }
    
    setLoading(true);
    setMessage('');
    try {
      await api.put('/users/profile', { freeFireUid: uid });
      setMessage('Game UID saved successfully!');
      
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1200);
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-brand-borderLight rounded-3xl w-full max-w-sm overflow-hidden shadow-card-hover">
        
        {/* Header */}
        <div className="bg-slate-50 p-4 sm:p-5 border-b border-brand-borderLight flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-brand-indigo">
              <UserIcon size={16} />
            </div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-wider font-gaming uppercase">Player Profile</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition bg-slate-100 p-1.5 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {message && (
            <div className={`p-2.5 rounded-xl text-xs font-bold mb-3 border ${message.includes('success') ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-brand-coral border-red-200'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Platform Username</label>
              <input 
                type="text" 
                value={user?.username || ''} 
                disabled 
                className="w-full bg-slate-100 border border-brand-borderLight rounded-xl px-3.5 py-2.5 text-slate-500 cursor-not-allowed text-xs font-medium" 
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Crosshair size={13} className="text-brand-indigo"/> Free Fire UID
              </label>
              <input 
                type="text" 
                required 
                value={uid} 
                onChange={(e) => setUid(e.target.value)} 
                placeholder="e.g., 1234567890"
                className="w-full bg-slate-50 border border-brand-borderLight rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-brand-indigo transition-colors text-xs font-semibold tracking-wider" 
              />
              <p className="text-[10px] text-slate-400 mt-1">This exact UID must join the custom room for automatic payout.</p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-indigo to-brand-violet hover:from-brand-violet hover:to-brand-indigo text-white font-gaming text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 uppercase tracking-wider active:scale-95 disabled:opacity-50 mt-1"
            >
              <Save size={15} /> {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>

          {/* Refer & Earn Section */}
          <div className="mt-5 pt-4 border-t border-brand-borderLight">
            <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Gift size={14} className="text-brand-mint"/> Refer & Earn
            </h3>
            
            <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
              Invite friends to compete! Earn <strong className="text-emerald-600 font-bold">₹5 Bonus</strong> on their 1st paid match.
            </p>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-50 border border-brand-borderLight rounded-xl px-3 py-2 text-slate-800 font-mono text-xs tracking-wider text-center truncate">
                {user?.referralCode || 'Generating...'}
              </div>
              <button 
                type="button"
                onClick={copyToClipboard}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all border border-brand-borderLight active:scale-95 flex-shrink-0"
                title="Copy Referral Code"
              >
                {copied ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}