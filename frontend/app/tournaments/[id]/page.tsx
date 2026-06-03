// frontend/app/tournaments/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/axios"; // 🚀 FIXED: Using the unified unified API
import { useAuthStore } from '@/store/useAuthStore';
import Link from "next/link";

const TYPE_COLORS: Record<string, string> = {
  Solo: "#00e5ff", Duo: "#7c3aed", Squad: "#10b981",
  "Clash Squad": "#f59e0b", "BR Kill Race": "#ef4444",
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return "🔴 LIVE";
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [tournament, setTournament] = useState<any | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const fetchTournamentData = async () => {
    try {
      const res = await api.get(`/tournaments/${id}`);
      const tData = res.data.data || res.data; // Handles both API response structures
      setTournament(tData);
      
      const startTime = tData.scheduledAt || tData.startTime;
      setTimeLeft(new Date(startTime).getTime() - Date.now());

      // Check if current user is already in the participants list
      if (user && tData.participants) {
        const alreadyJoined = tData.participants.some((p: any) => p.userId === user.id || p._id === user.id || p.id === user.id);
        setIsJoined(alreadyJoined);
      }
    } catch (err) {
      toast.error("Failed to load tournament details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentData();
  }, [id, user]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (tournament) {
        const startTime = tournament.scheduledAt || tournament.startTime;
        setTimeLeft(new Date(startTime).getTime() - Date.now());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [tournament]);

  // 🚀 FIXED: Uses Digital Wallet to join instantly instead of manual UTR
  const handleJoinWithWallet = async () => {
    if (!user) { 
      router.push("/login"); 
      return; 
    }
    
    if (!window.confirm(`Spend ₹${tournament.entryFee} from your Digital Wallet to join this tournament?`)) return;

    setSubmitting(true);
    try {
      await api.post(`/tournaments/${id}/join`);
      toast.success("Successfully secured your slot! Fee deducted from wallet.");
      setIsJoined(true);
      fetchTournamentData(); // Refresh to update slots count
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || "Join failed.";
      if (errMsg.toLowerCase().includes("funds") || errMsg.toLowerCase().includes("balance")) {
        toast.error("Insufficient wallet balance! Please go to your Dashboard to add funds.");
      } else {
        toast.error(errMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "80px 20px", color: "#6b7280" }}>Loading Arena...</div>;
  if (!tournament) return <div style={{ textAlign: "center", padding: "80px 20px", color: "#ef4444" }}>Tournament not found or was deleted.</div>;

  const color = TYPE_COLORS[tournament.gameName || tournament.type] || "#00e5ff";
  const slotsFilled = tournament.currentParticipants || tournament.participants?.length || 0;
  const maxSlots = tournament.maxParticipants || tournament.slots || 48;

  return (
    <div className="page-enter" style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px" }}>
      <Link href="/dashboard" style={{ color: "#6b7280", fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 16 }}>
        ← Back to Dashboard
      </Link>

      <div className="ff-card" style={{ padding: 0, overflow: "hidden", border: `1px solid ${color}33`, borderRadius: 16, backgroundColor: '#090B10' }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${color}11, #111118)`, padding: "28px 24px", borderBottom: "1px solid #ffffff0a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
            <div>
              <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
                {tournament.gameName || tournament.type || 'Battle Royale'}
              </span>
              <h1 style={{ margin: "12px 0 6px", fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 900, color: 'white' }}>{tournament.title || tournament.name}</h1>
              <div style={{ color: "#6b7280", fontSize: 13 }}>🗺️ {tournament.map || 'Bermuda'} · 🎮 Free Fire</div>
            </div>
            <div style={{ background: timeLeft <= 0 ? "#ef444422" : "#0d0d18", border: `1px solid ${timeLeft <= 0 ? "#ef4444" : "#333"}`, borderRadius: 12, padding: "14px 20px", textAlign: "center", minWidth: 110 }}>
              <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>STARTS IN</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: timeLeft <= 0 ? "#ef4444" : timeLeft < 900000 ? "#f59e0b" : "#00e5ff" }}>
                {formatCountdown(timeLeft)}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10, marginBottom: 22 }}>
            {[
              { l: "Entry Fee", v: `₹${tournament.entryFee}`, c: "#fbbf24" },
              { l: "Prize Pool", v: `₹${tournament.prizePool}`, c: "#10b981" },
              { l: "Slots", v: `${slotsFilled}/${maxSlots}`, c: color },
              { l: "Status", v: tournament.status?.replace('_', ' ') || 'OPEN', c: tournament.status === "COMPLETED" ? "#6b7280" : "#10b981" },
            ].map((s) => (
              <div key={s.l} style={{ background: "#0d0d18", borderRadius: 8, padding: "10px 12px", border: '1px solid #1f2937' }}>
                <div style={{ color: "#6b7280", fontSize: 10, marginBottom: 3, textTransform: 'uppercase', fontWeight: 'bold' }}>{s.l}</div>
                <div style={{ color: s.c, fontWeight: 800, fontSize: 16 }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Room ID for joined players */}
          {isJoined && (
            <div style={{ background: tournament.roomId ? "#052e1c" : "#111", border: `1px solid ${tournament.roomId ? "#10b981" : "#333"}`, borderRadius: 12, padding: 18, marginBottom: 22 }}>
              <div style={{ color: tournament.roomId ? "#10b981" : "#6b7280", fontWeight: 700, marginBottom: tournament.roomId ? 12 : 0 }}>
                {tournament.roomId ? "🔑 Room Details — You're In!" : "⏳ Room ID & Password will appear here before the match starts."}
              </div>
              {tournament.roomId && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "#0d1f0d", borderRadius: 8, padding: 12 }}>
                    <div style={{ color: "#6b7280", fontSize: 10, marginBottom: 4 }}>ROOM ID</div>
                    <div style={{ color: "#10b981", fontWeight: 900, fontSize: 24, letterSpacing: 3 }}>{tournament.roomId}</div>
                  </div>
                  <div style={{ background: "#0d1f0d", borderRadius: 8, padding: 12 }}>
                    <div style={{ color: "#6b7280", fontSize: 10, marginBottom: 4 }}>PASSWORD</div>
                    <div style={{ color: "#10b981", fontWeight: 900, fontSize: 24, letterSpacing: 3 }}>{tournament.roomPassword}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Section */}
          {!user ? (
            <Link href="/login" style={{ display: "block", textAlign: "center", textDecoration: "none", padding: "14px", fontSize: 15, borderRadius: 10, backgroundColor: '#b026ff', color: 'white', fontWeight: 'bold' }}>
              Login to Join Match →
            </Link>
          ) : isJoined ? (
            <div style={{ background: "#052e1c", border: "1px solid #10b98144", borderRadius: 10, padding: 16, textAlign: "center" }}>
              <div style={{ color: "#10b981", fontWeight: 700, fontSize: 15 }}>✅ Slot Secured! Good Luck & Booyah! 🏆</div>
            </div>
          ) : (
            <button
              onClick={handleJoinWithWallet}
              disabled={slotsFilled >= maxSlots || submitting || tournament.status !== 'REGISTRATION_OPEN'}
              style={{ 
                width: "100%", padding: "14px", fontSize: 15, 
                backgroundColor: slotsFilled >= maxSlots ? '#374151' : '#b026ff', 
                color: 'white', fontWeight: 'bold', borderRadius: 10, border: 'none', cursor: 'pointer',
                opacity: (slotsFilled >= maxSlots || submitting || tournament.status !== 'REGISTRATION_OPEN') ? 0.6 : 1
              }}
            >
              {submitting ? "Processing..." : 
               slotsFilled >= maxSlots ? "🚫 Tournament Full" : 
               tournament.status !== 'REGISTRATION_OPEN' ? "🔒 Registration Closed" :
               `🎮 Join Now (Deduct ₹${tournament.entryFee} from Wallet)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}