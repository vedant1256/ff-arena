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

  // Pre-fill the UID if the user already has one saved
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
      // Send the new UID to the backend
      await api.put('/users/profile', { freeFireUid: uid });
      setMessage('Game UID saved successfully!');
      
      // Small delay before closing so they see the success message
      setTimeout(() => {
        onClose();
        window.location.reload(); // Refresh page to sync the new data
      }, 1500);
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to update profile. Route might be missing!');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#11141D] border border-[#b026ff]/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(176,38,255,0.1)]">
        
        {/* Header */}
        <div className="bg-[#0A0C10] p-5 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UserIcon className="text-[#b026ff]" size={20} />
            <h2 className="text-xl font-bold text-white tracking-wider">PLAYER PROFILE</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition bg-gray-800/50 hover:bg-gray-800 p-1.5 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {message && (
            <div className={`p-3 rounded-lg text-sm font-bold mb-4 border ${message.includes('success') ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Platform Username</label>
              <input 
                type="text" 
                value={user?.username || ''} 
                disabled 
                className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed font-medium" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Crosshair size={14} className="text-[#b026ff]"/> Free Fire UID
              </label>
              <input 
                type="text" 
                required 
                value={uid} 
                onChange={(e) => setUid(e.target.value)} 
                placeholder="e.g., 1234567890"
                className="w-full bg-[#0A0C10] border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#b026ff] transition-colors font-medium tracking-widest" 
              />
              <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wide">This exact UID must join the custom room.</p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#b026ff]/20 to-[#b026ff]/10 hover:from-[#b026ff]/30 border border-[#b026ff]/50 text-[#b026ff] font-bold py-3 px-4 rounded-xl transition-all mt-2 flex items-center justify-center gap-2 uppercase tracking-wider active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} /> {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>

          {/* 🚀 NEW: REFER & EARN SECTION */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Gift size={16} className="text-green-400"/> Refer & Earn
            </h3>
            
            <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
              Invite friends to play! Get <strong className="text-green-400 font-bold">₹5 Bonus</strong> when they play their 1st paid match, and <strong className="text-green-400 font-bold">₹10 Bonus</strong> on their 5th match.
            </p>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#0A0C10] border border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-sm tracking-widest text-center truncate">
                {user?.referralCode || 'Generating...'}
              </div>
              <button 
                type="button"
                onClick={copyToClipboard}
                className="p-3 bg-[#11141D] hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl transition-all border border-gray-700 hover:border-gray-500 active:scale-95 flex-shrink-0"
                title="Copy Referral Code"
              >
                {copied ? <CheckCircle2 size={18} className="text-green-400" /> : <Copy size={18} />}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}