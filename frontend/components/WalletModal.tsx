// frontend/components/WalletModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Loader2, IndianRupee, Clock, ArrowUpRight, CheckCircle2 } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleDeposit = async () => {
    setError('');
    if (!amount || amount < 10) {
      setError('Minimum deposit is ₹10');
      return;
    }

    setLoading(true);

    try {
      // 1. Fetch Razorpay Key
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      
      // 🚀 DEBUGGING: Log the key to the console to ensure Next.js is reading it
      console.log("Checking Razorpay Key:", razorpayKey);

      // 2. Hard block if the key is missing or literally the string 'undefined'
      if (!razorpayKey || razorpayKey === 'undefined') {
        setError('System Error: Razorpay Key is missing from the environment variables. Please check your .env.local file and restart the server.');
        setLoading(false);
        return;
      }

      // 3. Create order on your backend
      const { data } = await api.post('/wallet/deposit', { amount: Number(amount) });
      
      // 4. Ensure Razorpay script is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setError('Failed to load Razorpay. Check your internet connection.');
        setLoading(false);
        return;
      }

      // 5. Initialize Razorpay Options
      const options = {
        key: razorpayKey, 
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'FF Arena',
        description: 'Wallet Deposit',
        order_id: data.order.id,
        theme: {
          color: '#b026ff',
        },
        handler: async function (response: any) {
          try {
            setLoading(true);
            // 6. Verify payment on your backend
            await api.post('/wallet/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            setAmount('');
            onPaymentSuccess();
          } catch (err: any) {
            alert(err.response?.data?.error || 'Payment verification failed. If money was deducted, contact support.');
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#11141D] border border-gray-800 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,240,255,0.1)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-[#0A0C10] rounded-t-2xl">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="text-[#00F0FF]">Digital</span> Wallet
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition p-1 bg-gray-800/50 rounded-md">
            <X size={20} />
          </button>
        </div>

        {/* Balance Display */}
        <div className="p-6 bg-gradient-to-b from-[#0A0C10] to-[#11141D] border-b border-gray-800 flex flex-col items-center justify-center">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Available Balance</p>
          <div className="flex items-center gap-2 text-4xl font-extrabold text-white">
            <IndianRupee size={32} className="text-[#00F0FF]" />
            {balance.toFixed(2)}
          </div>
        </div>

        {/* Add Money Section */}
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Add Funds</h3>
          {error && <div className="text-red-500 text-xs mb-3 bg-red-500/10 p-2 rounded border border-red-500/30">{error}</div>}
          
          <div className="flex gap-3 mb-4">
            {[50, 100, 200, 500].map(val => (
              <button 
                key={val} 
                onClick={() => setAmount(val)}
                className="flex-1 py-2 bg-[#0A0C10] border border-gray-700 hover:border-[#00F0FF] rounded-lg text-sm text-gray-300 hover:text-[#00F0FF] transition font-bold"
              >
                +₹{val}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <IndianRupee size={16} className="text-gray-500" />
              </div>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="Enter Amount" 
                className="w-full bg-[#0A0C10] border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-[#00F0FF] outline-none transition"
              />
            </div>
            <button 
              onClick={handleDeposit}
              disabled={loading || !amount || amount < 10}
              className="bg-[#00F0FF] hover:bg-[#00c8ff] text-black font-extrabold px-6 rounded-xl transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[120px]"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'DEPOSIT'}
            </button>
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
                      tx.type === 'DEPOSIT' ? 'bg-green-500/10 text-green-500' :
                      tx.type === 'CREDIT' ? 'bg-[#b026ff]/10 text-[#b026ff]' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {tx.type === 'DEPOSIT' || tx.type === 'CREDIT' ? <ArrowUpRight size={16} /> : <ArrowUpRight size={16} className="rotate-90" />}
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{tx.description || tx.type}</p>
                      <p className="text-gray-500 text-[10px] uppercase tracking-wider">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-extrabold text-sm ${
                      tx.type === 'DEPOSIT' || tx.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'
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