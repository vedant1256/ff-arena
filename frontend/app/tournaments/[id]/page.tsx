"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { tournamentsAPI, paymentsAPI } from "@/lib/axios";
import { Tournament } from "@/types";
import { useAuthStore } from "@/store/auth";
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

const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || "shrikrishnadevkar60@oksbi";
const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME || "Shrikrishna Devkar";

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [payStatus, setPayStatus] = useState<{ isJoined: boolean; paymentStatus: string | null }>({ isJoined: false, paymentStatus: null });
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [utrId, setUtrId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    Promise.all([
      tournamentsAPI.getOne(id),
      user ? tournamentsAPI.getPaymentStatus(id) : Promise.resolve(null),
    ]).then(([tRes, psRes]) => {
      setTournament(tRes.data.data);
      setTimeLeft(new Date(tRes.data.data.startTime).getTime() - Date.now());
      if (psRes) setPayStatus(psRes.data.data);
    }).catch(() => toast.error("Failed to load tournament"))
      .finally(() => setLoading(false));
  }, [id, user]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (tournament) setTimeLeft(new Date(tournament.startTime).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [tournament]);

  const handleSubmitPayment = async () => {
    if (!user) { router.push("/login"); return; }
    if (utrId.trim().length < 6) { toast.error("Enter a valid UTR/Transaction ID"); return; }
    setSubmitting(true);
    try {
      await paymentsAPI.submit(id, utrId.trim());
      toast.success("Payment submitted! Waiting for admin approval.");
      setPayStatus({ isJoined: false, paymentStatus: "pending" });
      setShowPayment(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "#6b7280" }}>Loading tournament...</div>
  );
  if (!tournament) return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "#ef4444" }}>Tournament not found.</div>
  );

  const color = TYPE_COLORS[tournament.type] || "#00e5ff";
  const upiData = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${tournament.entryFee}&cu=INR&tn=FFArena-${id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiData)}`;

  return (
    <div className="page-enter" style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px" }}>
      <Link href="/" style={{ color: "#6b7280", fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 16 }}>
        ← Back to Tournaments
      </Link>

      <div className="ff-card" style={{ padding: 0, overflow: "hidden", border: `1px solid ${color}33` }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${color}11, #111118)`, padding: "28px 24px", borderBottom: "1px solid #ffffff0a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
            <div>
              <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
                {tournament.type}
              </span>
              <h1 style={{ margin: "12px 0 6px", fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 900 }}>{tournament.name}</h1>
              <div style={{ color: "#6b7280", fontSize: 13 }}>🗺️ {tournament.map} · 🎮 Free Fire</div>
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
              { l: tournament.perKill > 0 ? "Per Kill" : "Prize Pool", v: tournament.perKill > 0 ? `₹${tournament.perKill}` : `₹${tournament.prizePool}`, c: "#10b981" },
              { l: "Slots", v: `${tournament.participants?.length || 0}/${tournament.slots}`, c: color },
              { l: "Status", v: tournament.status.toUpperCase(), c: tournament.status === "live" ? "#10b981" : tournament.status === "completed" ? "#6b7280" : "#f59e0b" },
            ].map((s) => (
              <div key={s.l} style={{ background: "#0d0d18", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ color: "#6b7280", fontSize: 10, marginBottom: 3 }}>{s.l}</div>
                <div style={{ color: s.c, fontWeight: 800, fontSize: 16 }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Prizes */}
          {tournament.prizes?.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ color: "#fbbf24", fontWeight: 700, marginBottom: 10 }}>🏆 Prize Distribution</div>
              {tournament.prizes.map((p) => (
                <div key={p.pos} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d0d18", borderRadius: 8, padding: "10px 14px", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{p.pos}</span>
                  <div style={{ display: "flex", gap: 16 }}>
                    <span style={{ color: "#10b981", fontWeight: 700 }}>₹{p.cash}</span>
                    <span style={{ color: "#00e5ff", fontWeight: 700 }}>💎 {p.gems}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tournament.perKill > 0 && (
            <div style={{ background: "#ef444411", border: "1px solid #ef444433", borderRadius: 10, padding: 14, marginBottom: 22 }}>
              <div style={{ color: "#ef4444", fontWeight: 700, marginBottom: 4 }}>💀 Kill Race Rules</div>
              <div style={{ color: "#9ca3af", fontSize: 13 }}>₹{tournament.perKill} per kill · Admin tallies kills and pays to your UPI after match</div>
            </div>
          )}

          {/* Room ID for joined players */}
          {payStatus.isJoined && (
            <div style={{ background: tournament.roomId ? "#052e1c" : "#111", border: `1px solid ${tournament.roomId ? "#10b981" : "#333"}`, borderRadius: 12, padding: 18, marginBottom: 22 }}>
              <div style={{ color: tournament.roomId ? "#10b981" : "#6b7280", fontWeight: 700, marginBottom: tournament.roomId ? 12 : 0 }}>
                {tournament.roomId ? "🔑 Room Details — You're In!" : "⏳ Room ID will appear here before match"}
              </div>
              {tournament.roomId && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "#0d1f0d", borderRadius: 8, padding: 12 }}>
                    <div style={{ color: "#6b7280", fontSize: 10, marginBottom: 4 }}>ROOM ID</div>
                    <div style={{ color: "#10b981", fontWeight: 900, fontSize: 24, letterSpacing: 3 }}>{tournament.roomId}</div>
                  </div>
                  <div style={{ background: "#0d1f0d", borderRadius: 8, padding: 12 }}>
                    <div style={{ color: "#6b7280", fontSize: 10, marginBottom: 4 }}>PASSWORD</div>
                    <div style={{ color: "#10b981", fontWeight: 900, fontSize: 24, letterSpacing: 3 }}>{tournament.roomPass}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Participants */}
          {(tournament.participants?.length || 0) > 0 && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 8 }}>👥 Players Joined ({tournament.participants.length})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {tournament.participants.map((p) => (
                  <span key={p.userId} style={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 20, padding: "4px 10px", fontSize: 12 }}>
                    {p.userName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Section */}
          {!user && (
            <Link href="/login" className="btn-gold" style={{ display: "block", textAlign: "center", textDecoration: "none", padding: "13px", fontSize: 15, borderRadius: 10 }}>
              Login to Join →
            </Link>
          )}

          {user && !payStatus.isJoined && payStatus.paymentStatus === null && !showPayment && (
            <button
              onClick={() => setShowPayment(true)}
              disabled={(tournament.participants?.length || 0) >= tournament.slots}
              className="btn-gold"
              style={{ width: "100%", padding: "13px", fontSize: 15, opacity: (tournament.participants?.length || 0) >= tournament.slots ? 0.5 : 1 }}
            >
              {(tournament.participants?.length || 0) >= tournament.slots ? "🚫 Tournament Full" : `🎮 Join Now — Pay ₹${tournament.entryFee}`}
            </button>
          )}

          {showPayment && (
            <div style={{ background: "#0d0d18", border: "1px solid #fbbf2444", borderRadius: 14, padding: 24 }}>
              <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>💳 Pay ₹{tournament.entryFee} via UPI</div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
                <img src={qrUrl} alt="UPI QR Code" style={{ borderRadius: 10, border: "3px solid #fbbf24", width: 180, height: 180, marginBottom: 12 }} />
                <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 4 }}>Or pay directly to UPI ID:</div>
                <div style={{ color: "#00e5ff", fontWeight: 800, fontSize: 15, background: "#111", padding: "6px 16px", borderRadius: 8, border: "1px solid #00e5ff33" }}>
                  {UPI_ID}
                </div>
              </div>
              <div style={{ background: "#fbbf2411", border: "1px solid #fbbf2433", borderRadius: 8, padding: "10px 14px", marginBottom: 16, textAlign: "center", color: "#fbbf24", fontWeight: 700, fontSize: 14 }}>
                Amount: ₹{tournament.entryFee} · Pay to: {UPI_NAME}
              </div>
              <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 8 }}>After paying, enter your UTR / Transaction ID:</div>
              <input value={utrId} onChange={(e) => setUtrId(e.target.value)} placeholder="e.g. 416789012345 (12-digit UTR)" />
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button onClick={() => { setShowPayment(false); setUtrId(""); }}
                  style={{ flex: 1, background: "transparent", border: "1px solid #333", color: "#6b7280", padding: "10px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
                  Cancel
                </button>
                <button onClick={handleSubmitPayment} disabled={submitting} className="btn-gold" style={{ flex: 2, fontSize: 14, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Submitting..." : "✅ Submit Payment"}
                </button>
              </div>
            </div>
          )}

          {payStatus.paymentStatus === "pending" && !payStatus.isJoined && (
            <div style={{ background: "#78350f22", border: "1px solid #f59e0b44", borderRadius: 10, padding: 16, textAlign: "center" }}>
              <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: 15 }}>⏳ Payment Under Review</div>
              <div style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>Admin is verifying your payment. You'll be added soon!</div>
            </div>
          )}

          {payStatus.isJoined && (
            <div style={{ background: "#052e1c", border: "1px solid #10b98144", borderRadius: 10, padding: 16, textAlign: "center" }}>
              <div style={{ color: "#10b981", fontWeight: 700, fontSize: 15 }}>✅ You're Registered! Good Luck — Booyah! 🏆</div>
            </div>
          )}

          {payStatus.paymentStatus === "rejected" && !payStatus.isJoined && (
            <div style={{ background: "#3d0f0f22", border: "1px solid #ef444444", borderRadius: 10, padding: 16, textAlign: "center" }}>
              <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 15 }}>❌ Payment Rejected</div>
              <div style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>Contact admin or try again with the correct UTR ID.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
