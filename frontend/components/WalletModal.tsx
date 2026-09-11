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
  balance: number; // This is the total balance passed from the parent
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
  
  // State to hold our Triple Wallet breakdown
  const [detailedBalances, setDetailedBalances] = useState({ deposit: 0, winning: 0, bonus: 0 });

  // Fetch the detailed breakdown every time the modal opens or a transaction happens
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

      // 🚀 UPDATED: Calls the correct backend endpoint
      const { data } = await api.post('/wallet/create-order', { amount: Number(amount) });
      
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setError('Failed to load Razorpay. Check your internet connection.');
        setLoading(false);
        return;
      }

      // 🚀 UPDATED: Directly using 'data' as it returns the order object
      const options = {
        key: razorpayKey, 
        amount: data.amount,
        currency: data.currency,
        name: 'VPS EsportsHub',
        description: 'Wallet Deposit',
        order_id: data.id,
        theme: { color: '#00F0FF' },
        handler: async function (response: any) {
          try {
            setLoading(true);
            await api.post('/wallet/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            setAmount('');
            onPaymentSuccess(); // Triggers a re-fetch of balances on the parent component
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
      alert("Withdrawal request sent to Admin! It will be processed to your UPI within 24 hours.");
      setWithdrawAmount('');
      setUpiId('');
      onPaymentSuccess(); // Triggers a re-fetch of balances on the parent component
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit withdrawal request.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#11141D] border border-gray-800 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(0,240,255,0.1)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-[#0A0C10] rounded-t-2xl">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="text-[#00F0FF]">Triple</span> Wallet
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition p-1 bg-gray-800/50 rounded-md">
            <X size={20} />
          </button>
        </div>

        {/* 💰 TRIPLE WALLET DISPLAY */}
        <div className="p-6 bg-gradient-to-b from-[#0A0C10] to-[#11141D] border-b border-gray-800 flex flex-col items-center justify-center">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Total Combined Balance</p>
          <div className="flex items-center gap-2 text-4xl font-extrabold text-white mb-6">
            <IndianRupee size={32} className="text-[#00F0FF]" />
            {balance.toFixed(2)}
          </div>

          <div className="grid grid-cols-3 gap-3 w-full">
            {/* 1. Deposit Box */}
            <div className="bg-[#0A0C10] border border-cyan-900/50 rounded-xl p-3 flex flex-col items-center text-center">
              <Wallet size={18} className="text-cyan-400 mb-1" />
              <p className="text-[10px] text-gray-500 uppercase font-bold">Deposit</p>
              <p className="text-sm font-bold text-white">₹{detailedBalances.deposit.toFixed(0)}</p>
              <p className="text-[8px] text-cyan-500/70 uppercase tracking-widest mt-1">Play Only</p>
            </div>
            
            {/* 2. Winnings Box */}
            <div className="bg-[#0A0C10] border border-green-900/50 rounded-xl p-3 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-8 h-8 bg-green-500/10 rounded-bl-full"></div>
              <Trophy size={18} className="text-green-400 mb-1" />
              <p className="text-[10px] text-gray-500 uppercase font-bold">Winnings</p>
              <p className="text-sm font-bold text-white">₹{detailedBalances.winning.toFixed(0)}</p>
              <p className="text-[8px] text-green-400 uppercase tracking-widest mt-1 font-bold">100% Withdrawable</p>
            </div>

            {/* 3. Bonus Box */}
            <div className="bg-[#0A0C10] border border-purple-900/50 rounded-xl p-3 flex flex-col items-center text-center relative group">
              <Gift size={18} className="text-[#b026ff] mb-1" />
              <p className="text-[10px] text-gray-500 uppercase font-bold">Bonus</p>
              <p className="text-sm font-bold text-white">₹{detailedBalances.bonus.toFixed(0)}</p>
              <p className="text-[8px] text-purple-400/70 uppercase tracking-widest mt-1">Promo Use</p>
            </div>
          </div>
        </div>

        {/* Action Area: Add Money & Withdraw */}
        <div className="p-6 border-b border-gray-800 bg-[#0A0C10]">
          {error && <div className="text-red-500 text-xs mb-3 bg-red-500/10 p-2 rounded border border-red-500/30">{error}</div>}
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* ADD FUNDS (Targets Deposit Wallet) */}
            <div className="flex-1">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Add to Deposit Wallet</h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee size={14} className="text-gray-500" />
                  </div>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Min ₹10" 
                    className="w-full bg-[#11141D] border border-gray-800 rounded-lg pl-8 pr-3 py-2.5 text-sm text-white focus:border-[#00F0FF] outline-none transition"
                  />
                </div>
                <button 
                  onClick={handleDeposit}
                  disabled={loading || !amount || amount < 10}
                  className="bg-[#00F0FF] hover:bg-[#00c8ff] text-black font-extrabold px-4 rounded-lg text-sm transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'ADD'}
                </button>
              </div>
            </div>

            {/* WITHDRAW (Targets Winning Wallet) */}
            <div className="flex-1 flex flex-col border-t sm:border-t-0 sm:border-l border-gray-800 pt-4 sm:pt-0 sm:pl-4">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Withdraw Winnings</h3>
               <div className="flex flex-col gap-2 mb-2">
                 <input 
                   type="text" 
                   value={upiId}
                   onChange={(e) => setUpiId(e.target.value)}
                   placeholder="Your UPI ID (e.g. 9876543210@ybl)" 
                   className="w-full bg-[#11141D] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none transition"
                 />
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <IndianRupee size={14} className="text-gray-500" />
                   </div>
                   <input 
                     type="number" 
                     value={withdrawAmount}
                     onChange={(e) => setWithdrawAmount(e.target.value ? Number(e.target.value) : '')}
                     placeholder="Amount (Min ₹100)" 
                     className="w-full bg-[#11141D] border border-gray-800 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:border-green-500 outline-none transition"
                   />
                 </div>
               </div>
               <button 
                  onClick={handleWithdrawRequest}
                  disabled={withdrawLoading || !withdrawAmount || withdrawAmount < 100 || !upiId}
                  className="w-full bg-green-500/10 hover:bg-green-500/20 border border-green-500/50 text-green-400 font-extrabold py-2 rounded-lg text-sm transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {withdrawLoading ? <Loader2 size={16} className="animate-spin" /> : 'WITHDRAW MONEY'}
                </button>
                <p className="text-[9px] text-gray-500 text-center mt-2 leading-relaxed">
                  Min. Withdrawal: ₹100 <br/>
                  <span className="text-gray-400 font-semibold uppercase tracking-wider text-[8px]">Standard RMG KYC (PAN/Aadhar) may be required for processing payouts.</span>
                </p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Recent Transactions</h3>
          
          {transactions.length === 0 ? (
            <div className="text-center text-gray-600 text-sm py-8 flex flex-col items-center">
              <Clock size={32} className="mb-2 opacity-20" />
              No transaction history found.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between bg-[#0A0C10] p-3 rounded-xl border border-gray-800/60">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      tx.type === 'DEPOSIT' ? 'bg-cyan-500/10 text-cyan-500' :
                      tx.type === 'CREDIT' ? 'bg-green-500/10 text-green-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {tx.type === 'DEPOSIT' || tx.type === 'CREDIT' ? <ArrowUpRight size={16} /> : <ArrowUpRight size={16} className="rotate-90" />}
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold truncate max-w-[150px] sm:max-w-[200px]">{tx.description || tx.type}</p>
                      <p className="text-gray-500 text-[10px] uppercase tracking-wider">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-extrabold text-sm ${
                      tx.type === 'DEPOSIT' ? 'text-cyan-400' : 
                      tx.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {tx.type === 'DEPOSIT' || tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toFixed(0)}
                    </p>
                    {tx.status === 'SUCCESS' && (
                      <p className="text-green-500/70 text-[10px] font-bold uppercase flex items-center justify-end gap-1 mt-0.5">
                        <CheckCircle2 size={10} /> Success
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