// frontend/app/admin/verifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Eye, ShieldAlert, Loader2, IndianRupee, Swords } from 'lucide-react';
import api from '../../../lib/axios';

interface PendingResult {
  id: string;
  imageUrl: string;
  createdAt: string;
  user: { id: string; username: string; freeFireUid: string };
  tournament: { id: string; title: string; prizePool: number; status: string };
}

export default function AdminVerificationsPage() {
  const [results, setResults] = useState<PendingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  
  // Image Viewer Modal State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingResults();
  }, []);

  const fetchPendingResults = async () => {
    try {
      const res = await api.get('/tournaments/results/pending');
      setResults(res.data);
    } catch (error) {
      console.error("Failed to fetch verifications", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (resultId: string, action: 'APPROVE' | 'REJECT') => {
    if (!confirm(`Are you sure you want to ${action} this screenshot?`)) return;
    
    setActionLoading(resultId);
    setMessage('');
    
    try {
      const res = await api.put(`/tournaments/results/${resultId}/verify`, { action });
      setMessage(res.data.message);
      
      // Remove this result from the UI immediately
      setResults(results.filter(r => r.id !== resultId));

      // Clear success message after 4 seconds
      setTimeout(() => setMessage(''), 4000);
    } catch (error: any) {
      setMessage(error.response?.data?.error || `Failed to ${action} result.`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-[85vh] py-8 px-4 max-w-6xl mx-auto">
      
      <div className="flex items-center gap-3 mb-8 border-b border-gray-800 pb-6">
        <ShieldAlert size={32} className="text-yellow-500" />
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-widest uppercase">Admin Command Center</h1>
          <p className="text-gray-400 text-sm">Verify Booyah screenshots & trigger automatic payouts.</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl font-bold mb-6 flex items-center justify-center border ${message.includes('Payout') ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20 text-[#00F0FF]">
          <Loader2 size={40} className="animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <div className="bg-[#11141D] border border-gray-800 rounded-2xl p-12 text-center text-gray-500 flex flex-col items-center">
          <CheckCircle2 size={48} className="mb-4 opacity-20" />
          <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
          <p>No pending screenshots to verify at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result) => (
            <div key={result.id} className="bg-[#11141D] border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
              
              {/* Image Preview Area */}
              <div className="relative h-48 bg-black border-b border-gray-800 group cursor-pointer" onClick={() => setSelectedImage(result.imageUrl)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.imageUrl} alt="Result" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-all">
                  <span className="bg-black/80 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold">
                    <Eye size={16} /> Click to View
                  </span>
                </div>
              </div>

              {/* Data Area */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-[#00F0FF] uppercase tracking-wider truncate" title={result.tournament.title}>
                    {result.tournament.title}
                  </h3>
                  <div className="flex justify-between items-center mt-2 bg-[#0A0C10] p-3 rounded-lg border border-gray-800">
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Claimed By</p>
                      <p className="text-sm font-bold text-white flex items-center gap-1">
                        <Swords size={14} className="text-purple-400" /> {result.user.username}
                      </p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">UID: {result.user.freeFireUid}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Prize</p>
                      <p className="text-lg font-black text-green-400 flex items-center justify-end">
                        <IndianRupee size={16} /> {result.tournament.prizePool}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-auto flex gap-3">
                  <button 
                    disabled={actionLoading === result.id}
                    onClick={() => handleVerify(result.id, 'REJECT')}
                    className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {actionLoading === result.id ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                    REJECT
                  </button>
                  <button 
                    disabled={actionLoading === result.id}
                    onClick={() => handleVerify(result.id, 'APPROVE')}
                    className="flex-1 py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {actionLoading === result.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    APPROVE
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Full Screen Image Viewer Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
            <button className="absolute top-4 right-4 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition z-10" onClick={() => setSelectedImage(null)}>
              <XCircle size={32} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedImage} alt="Full Screen Result" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          </div>
        </div>
      )}

    </div>
  );
}