// frontend/app/tournaments/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useAuthStore } from '@/store/useAuthStore';
import Link from "next/link";

const TYPE_COLORS: Record<string, string> = {
  Solo: "#00e5ff", Duo: "#7c3aed", Squad: "#10b981",
  "Clash Squad": "#f59e0b", "BR Kill Race": "#ef4444",
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return "🔴 LIVE";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
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
      const tData = res.data?.data || res.data;
      setTournament(tData);
      
      const startTime = tData.scheduledAt || tData.startTime;
      if (startTime) {
        setTimeLeft(new Date(startTime).getTime() - Date.now());
      }

      if (user && tData.participants) {
        const alreadyJoined = tData.participants.some(
          (p: any) => p.userId === user.id || p._id === user.id || p.id === user.id
        );
        setIsJoined(alreadyJoined);
      }
    } catch (err) {
      toast.error("Failed to load tournament details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTournamentData();
    }
  }, [id, user]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (tournament) {
        const startTime = tournament.scheduledAt || tournament.startTime;
        if (startTime) {
          setTimeLeft(new Date(startTime).getTime() - Date.now());
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [tournament]);

  const handleJoinWithWallet = async () => {
    if (!user) { 
      router.push("/login"); 
      return; 
    }
    
    if (!window.confirm(`Spend ₹${tournament.entryFee} from your Digital Wallet to register?`)) return;

    setSubmitting(true);
    try {
      await api.post(`/tournaments/${id}/join`);
      toast.success("Successfully registered! Ticket fee deducted from wallet balance.");
      setIsJoined(true);
      fetchTournamentData(); 
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || "Join failed.";
      if (errMsg.toLowerCase().includes("funds") || errMsg.toLowerCase().includes("balance")) {
        toast.error("Insufficient balance! Please navigate to your Dashboard to replenish your wallet funds.");
      } else {
        toast.error(errMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "#00F0FF", background: "#090B10", minHeight: "100-screen" }}>Loading Arena Details...</div>
  );
  if (!tournament) return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "#ef4444", background: "#090B10", minHeight: "100-screen" }}>Tournament not found or was removed.</div>
  );

  const color = TYPE_COLORS[tournament.gameName || tournament.type] || "#00e5ff";
  const slotsFilled = tournament.currentParticipants || tournament.participants?.length || 0;
  const maxSlots = tournament.maxParticipants || tournament.slots || 48;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px", minHeight: "100vh", color: "white" }}>
      <Link href="/dashboard" style={{ color: "#6b7280", fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 16 }}>
        ← Back to Arena Dashboard
      </Link>

      <div style={{ padding: 0, overflow: "hidden", border: `1px solid ${color}33`, borderRadius: 16, backgroundColor: '#11141D' }}>
        {/* Banner Area */}
        <div style={{ background: `linear-gradient(135deg, ${color}11, #0A0C10)`, padding: "28px 24px", borderBottom: "1px solid #ffffff0a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
            <div>
              <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, display: "inline-block" }}>
                {tournament.gameName || tournament.type || 'Battle Royale'}
              </span>
              <h1 style={{ margin: "12px 0 6px", fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 900 }}>{tournament.title || tournament.name}</h1>
              <div style={{ color: "#6b7280", fontSize: 13 }}>🗺️ {tournament.map || 'Bermuda'} · 🎮 Free Fire Mobile</div>
            </div>
            <div style={{ background: timeLeft <= 0 ? "#ef444422" : "#0d0d18", border: `1px solid ${timeLeft <= 0 ? "#ef4444" : "#333"}`, borderRadius: 12, padding: "14px 20px", textAlign: "center", minWidth: 110 }}>
              <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>MATCH STARTS</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: timeLeft <= 0 ? "#ef4444" : timeLeft < 900000 ? "#f59e0b" : "#00e5ff" }}>
                {formatCountdown(timeLeft)}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {/* Information Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 22 }}>
            {[
              { l: "Entry Fee", v: `₹${tournament.entryFee}`, c: "#fbbf24" },
              { l: "Prize Pool", v: `₹${tournament.prizePool}`, c: "#10b981" },
              { l: "Registered Slots", v: `${slotsFilled}/${maxSlots}`, c: color },
              { l: "Match Status", v: (tournament.status || 'OPEN').replace('_', ' '), c: tournament.status === "COMPLETED" ? "#6b7280" : "#10b981" },
            ].map((s) => (
              <div key={s.l} style={{ background: "#0A0C10", borderRadius: 10, padding: "12px 14px", border: '1px solid #1f2937' }}>
                <div style={{ color: "#6b7280", fontSize: 10, marginBottom: 4, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>{s.l}</div>
                <div style={{ color: s.c, fontWeight: 800, fontSize: 18 }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Secure Custom Room Coordinates Block */}
          {isJoined && (
            <div style={{ background: tournament.roomId ? "#052e1c" : "#0A0C10", border: `1px solid ${tournament.roomId ? "#10b981" : "#1f2937"}`, borderRadius: 12, padding: 18, marginBottom: 22 }}>
              <div style={{ color: tournament.roomId ? "#10b981" : "#6b7280", fontWeight: 700, marginBottom: tournament.roomId ? 12 : 0, fontSize: 14 }}>
                {tournament.roomId ? "🔑 Custom Room Coordinates Issued:" : "⏳ Custom Room configuration parameters will appear here immediately before layout configuration goes live."}
              </div>
              {tournament.roomId && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "#0d1f0d", borderRadius: 8, padding: 12, border: '1px solid #10b98133' }}>
                    <div style={{ color: "#6b7280", fontSize: 10, marginBottom: 4, fontWeight: 'bold' }}>ROOM ID</div>
                    <div style={{ color: "#10b981", fontWeight: 900, fontSize: 22, letterSpacing: 2 }}>{tournament.roomId}</div>
                  </div>
                  <div style={{ background: "#0d1f0d", borderRadius: 8, padding: 12, border: '1px solid #10b98133' }}>
                    <div style={{ color: "#6b7280", fontSize: 10, marginBottom: 4, fontWeight: 'bold' }}>PASSWORD</div>
                    <div style={{ color: "#10b981", fontWeight: 900, fontSize: 22, letterSpacing: 2 }}>{tournament.roomPassword}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Execution Controls */}
          {!user ? (
            <Link href="/login" style={{ display: "block", textAlign: "center", textDecoration: "none", padding: "14px", fontSize: 15, borderRadius: 10, backgroundColor: '#b026ff', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(176,38,255,0.3)' }}>
              Login to Join Match →
            </Link>
          ) : isJoined ? (
            <div style={{ background: "#052e1c", border: "1px solid #10b98133", borderRadius: 10, padding: 16, textAlign: "center" }}>
              <div style={{ color: "#10b981", fontWeight: 700, fontSize: 15 }}>✅ Registration Status Validated. Prepare for Drop-In! 🏆</div>
            </div>
          ) : (
            <button
              onClick={handleJoinWithWallet}
              disabled={slotsFilled >= maxSlots || submitting || tournament.status !== 'REGISTRATION_OPEN'}
              style={{ 
                width: "100%", padding: "14px", fontSize: 15, 
                backgroundColor: slotsFilled >= maxSlots ? '#1f2937' : '#b026ff', 
                color: slotsFilled >= maxSlots ? '#4b5563' : 'white', fontWeight: 'bold', borderRadius: 10, border: 'none', 
                cursor: (slotsFilled >= maxSlots || submitting || tournament.status !== 'REGISTRATION_OPEN') ? 'not-allowed' : 'pointer',
                opacity: (slotsFilled >= maxSlots || submitting || tournament.status !== 'REGISTRATION_OPEN') ? 0.6 : 1,
                boxShadow: slotsFilled >= maxSlots ? 'none' : '0 4px 14px rgba(176,38,255,0.3)'
              }}
            >
              {submitting ? "Processing Transaction..." : 
               slotsFilled >= maxSlots ? "🚫 Tournament Slots Filled" : 
               tournament.status !== 'REGISTRATION_OPEN' ? "🔒 Registrations Locked" :
               `🎮 Deduct Fee & Secure Slot (₹${tournament.entryFee})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}