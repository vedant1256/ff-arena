// frontend/components/WalletModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, IndianRupee, Clock, ArrowUpRight, CheckCircle2, Trophy, Gift, Wallet } from 'lucide-react';
import api from '../lib/axios';

interface Transaction {
  id: string;
  amount: number;
  type: 'DEPOSIT' | 'DEBIT' | 'CREDIT';
  status: string;
  description: string;
  createdAt: string;
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  transactions: Transaction[];
  onPaymentSuccess: () => void;
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function WalletModal({ isOpen, onClose, balance, transactions, onPaymentSuccess }: WalletModalProps) {
  const [amount, setAmount] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Withdrawal States
  const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');
  const [upiId, setUpiId] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  
  // Detailed Balances
  const [detailedBalances, setDetailedBalances] = useState({ deposit: 0, winning: 0, bonus: 0 });

  useEffect(() => {
    if (isOpen) {
      api.get('/wallet').then((res) => {
        setDetailedBalances({
          deposit: res.data.depositBalance || 0,
          winning: res.data.winningBalance || 0,
          bonus: res.data.bonusBalance || 0,
        });
      }).catch(err => console.error("Failed to fetch detailed balances", err));
    }
  }, [isOpen, balance]);

  if (!isOpen) return null;

  const handleDeposit = async () => {
    setError('');
    if (!amount || amount < 10) {
      setError('Minimum deposit is ₹10');
      return;
    }

    setLoading(true);

    try {
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      
      if (!razorpayKey || razorpayKey === 'undefined') {
        setError('System Error: Razorpay Key is missing from the environment variables.');
        setLoading(false);
        return;
      }

      const { data } = await api.post('/wallet/create-order', { amount: Number(amount) });
      
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setError('Failed to load Razorpay. Check your internet connection.');
        setLoading(false);
        return;
      }

      const options = {
        key: razorpayKey, 
        amount: data.amount,
        currency: data.currency,
        name: 'VPS EsportsHub',
        description: 'Wallet Deposit',
        order_id: data.id,
        theme: { color: '#6366F1' },
        handler: async function (response: any) {
          try {
            setLoading(true);
            await api.post('/wallet/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            setAmount('');
            onPaymentSuccess();
          } catch (err: any) {
            alert(err.response?.data?.error || 'Payment verification failed. Contact support.');
          } finally {
            setLoading(false);
          }
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      
      paymentObject.on('payment.failed', function (response: any) {
        alert(`Payment Failed: ${response.error.description}`);
        setLoading(false);
      });

      paymentObject.open();

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to initiate payment.');
      setLoading(false);
    }
  };

  const handleWithdrawRequest = async () => {
    setError('');
    if (!withdrawAmount || withdrawAmount < 100) {
      setError('Minimum withdrawal is ₹100.');
      return;
    }
    if (detailedBalances.winning < withdrawAmount) {
      setError('Insufficient winning balance.');
      return;
    }
    if (!upiId || !upiId.includes('@')) {
      setError('Please enter a valid UPI ID (e.g., user@upi).');
      return;
    }

    setWithdrawLoading(true);
    try {
      await api.post('/wallet/withdraw', { amount: Number(withdrawAmount), upiId });
      alert("Withdrawal request sent! It will be processed to your UPI within 24 hours.");
      setWithdrawAmount('');
      setUpiId('');
      onPaymentSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit withdrawal request.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-brand-borderLight rounded-3xl w-full max-w-lg shadow-card-hover flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-brand-borderLight bg-slate-50">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-wider font-gaming flex items-center gap-2">
            <span className="text-brand-indigo">Triple</span> Wallet
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1 bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Triple Wallet Display */}
        <div className="p-5 bg-gradient-to-b from-slate-50 to-white border-b border-brand-borderLight flex flex-col items-center justify-center">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Combined Balance</p>
          <div className="flex items-center gap-1.5 text-3xl sm:text-4xl font-black text-slate-900 font-gaming mb-4">
            <span className="text-brand-indigo">₹</span>
            {balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          <div className="grid grid-cols-3 gap-2.5 w-full">
            {/* 1. Deposit Box */}
            <div className="bg-slate-50 border border-brand-borderLight rounded-xl p-2.5 flex flex-col items-center text-center shadow-card-subtle">
              <Wallet size={16} className="text-brand-indigo mb-1" />
              <p className="text-[9px] text-slate-400 uppercase font-bold">Deposit</p>
              <p className="text-sm font-black text-slate-900 font-gaming">₹{detailedBalances.deposit.toFixed(0)}</p>
              <p className="text-[8px] text-brand-indigo/80 uppercase tracking-widest mt-0.5 font-semibold">Play Only</p>
            </div>
            
            {/* 2. Winnings Box */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 flex flex-col items-center text-center shadow-card-subtle relative overflow-hidden">
              <Trophy size={16} className="text-emerald-600 mb-1" />
              <p className="text-[9px] text-emerald-700 uppercase font-bold">Winnings</p>
              <p className="text-sm font-black text-emerald-600 font-gaming">₹{detailedBalances.winning.toFixed(0)}</p>
              <p className="text-[8px] text-emerald-700 uppercase tracking-widest mt-0.5 font-bold">100% Payout</p>
            </div>

            {/* 3. Bonus Box */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-2.5 flex flex-col items-center text-center shadow-card-subtle">
              <Gift size={16} className="text-brand-violet mb-1" />
              <p className="text-[9px] text-indigo-700 uppercase font-bold">Bonus</p>
              <p className="text-sm font-black text-brand-violet font-gaming">₹{detailedBalances.bonus.toFixed(0)}</p>
              <p className="text-[8px] text-indigo-600 uppercase tracking-widest mt-0.5 font-semibold">Promo Use</p>
            </div>
          </div>
        </div>

        {/* Action Area: Add Money & Withdraw */}
        <div className="p-5 border-b border-brand-borderLight bg-white">
          {error && <div className="text-brand-coral text-xs mb-3 bg-red-50 p-2 rounded-xl border border-red-200">{error}</div>}
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* ADD FUNDS */}
            <div className="flex-1">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Add to Deposit Wallet</h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-xs font-bold">₹</span>
                  </div>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Min ₹10" 
                    className="w-full bg-slate-50 border border-brand-borderLight rounded-xl pl-7 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-brand-indigo outline-none transition"
                  />
                </div>
                <button 
                  onClick={handleDeposit}
                  disabled={loading || !amount || amount < 10}
                  className="bg-brand-indigo hover:bg-brand-violet text-white font-gaming font-bold text-xs px-4 rounded-xl transition shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : 'ADD'}
                </button>
              </div>
            </div>

            {/* WITHDRAW */}
            <div className="flex-1 flex flex-col border-t sm:border-t-0 sm:border-l border-brand-borderLight pt-3 sm:pt-0 sm:pl-4">
               <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Withdraw Winnings</h3>
               <div className="flex flex-col gap-2 mb-2">
                 <input 
                   type="text" 
                   value={upiId}
                   onChange={(e) => setUpiId(e.target.value)}
                   placeholder="UPI ID (e.g. 9876543210@ybl)" 
                   className="w-full bg-slate-50 border border-brand-borderLight rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition"
                 />
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <span className="text-slate-400 text-xs font-bold">₹</span>
                   </div>
                   <input 
                     type="number" 
                     value={withdrawAmount}
                     onChange={(e) => setWithdrawAmount(e.target.value ? Number(e.target.value) : '')}
                     placeholder="Min ₹100" 
                     className="w-full bg-slate-50 border border-brand-borderLight rounded-xl pl-7 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition"
                   />
                 </div>
               </div>
               <button 
                  onClick={handleWithdrawRequest}
                  disabled={withdrawLoading || !withdrawAmount || withdrawAmount < 100 || !upiId}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-gaming text-xs font-bold py-2 rounded-xl transition shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {withdrawLoading ? <Loader2 size={14} className="animate-spin" /> : 'WITHDRAW MONEY'}
                </button>
                <p className="text-[9px] text-slate-400 text-center mt-1">
                  Min ₹100 • Processed to verified UPI
                </p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="p-5 overflow-y-auto no-scrollbar flex-1 bg-slate-50/50">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Recent Transactions</h3>
          
          {transactions.length === 0 ? (
            <div className="text-center text-slate-400 text-xs py-6 flex flex-col items-center">
              <Clock size={24} className="mb-1 text-slate-300" />
              No transaction history found.
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-brand-borderLight shadow-card-subtle">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${
                      tx.type === 'DEPOSIT' ? 'bg-indigo-50 text-brand-indigo' :
                      tx.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-red-50 text-brand-coral'
                    }`}>
                      <ArrowUpRight size={14} className={tx.type === 'DEPOSIT' || tx.type === 'CREDIT' ? '' : 'rotate-90'} />
                    </div>
                    <div>
                      <p className="text-slate-800 text-xs font-bold truncate max-w-[150px]">{tx.description || tx.type}</p>
                      <p className="text-slate-400 text-[9px] uppercase tracking-wider">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-xs font-gaming ${
                      tx.type === 'DEPOSIT' ? 'text-brand-indigo' : 
                      tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-brand-coral'
                    }`}>
                      {tx.type === 'DEPOSIT' || tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toFixed(0)}
                    </p>
                    {tx.status === 'SUCCESS' && (
                      <p className="text-emerald-600 text-[9px] font-bold uppercase flex items-center justify-end gap-0.5">
                        <CheckCircle2 size={9} /> Success
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}