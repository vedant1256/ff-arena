"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Tournament } from "@/types";

const TYPE_COLORS: Record<string, string> = {
  Solo: "#00e5ff", Duo: "#7c3aed", Squad: "#10b981",
  "Clash Squad": "#f59e0b", "BR Kill Race": "#ef4444",
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return "LIVE";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function TournamentCard({ tournament: t }: { tournament: Tournament }) {
  const [timeLeft, setTimeLeft] = useState(new Date(t.startTime).getTime() - Date.now());
  const color = TYPE_COLORS[t.type] || "#00e5ff";
  const pct = Math.min(((t.filledSlots || t.participants?.length || 0) / t.slots) * 100, 100);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(new Date(t.startTime).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [t.startTime]);

  return (
    <Link href={`/tournaments/${t._id}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        className="tournament-card"
        style={{
          background: "#111118",
          border: `1px solid ${color}22`,
          borderRadius: 12,
          padding: 18,
          cursor: "pointer",
          color: "#fff",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.border = `1px solid ${color}66`)}
        onMouseLeave={(e) => (e.currentTarget.style.border = `1px solid ${color}22`)}
      >
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span
            style={{
              background: color + "22", color,
              border: `1px solid ${color}44`,
              borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
            }}
          >
            {t.type}
          </span>
          <span
            style={{
              background: timeLeft <= 0 ? "#ef444422" : timeLeft < 900000 ? "#f59e0b22" : "#10b98122",
              color: timeLeft <= 0 ? "#ef4444" : timeLeft < 900000 ? "#f59e0b" : "#10b981",
              border: `1px solid ${timeLeft <= 0 ? "#ef4444" : timeLeft < 900000 ? "#f59e0b" : "#10b981"}33`,
              borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
            }}
            className={timeLeft <= 0 ? "live-badge" : ""}
          >
            {timeLeft <= 0 ? "🔴 LIVE" : `⏳ ${formatCountdown(timeLeft)}`}
          </span>
        </div>

        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 3 }}>{t.name}</div>
        <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 14 }}>🗺️ {t.map}</div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div style={{ background: "#0d0d18", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ color: "#6b7280", fontSize: 10, marginBottom: 2 }}>ENTRY FEE</div>
            <div style={{ color: "#fbbf24", fontWeight: 800, fontSize: 15 }}>₹{t.entryFee}</div>
          </div>
          <div style={{ background: "#0d0d18", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ color: "#6b7280", fontSize: 10, marginBottom: 2 }}>
              {t.perKill > 0 ? "PER KILL" : "PRIZE POOL"}
            </div>
            <div style={{ color: "#10b981", fontWeight: 800, fontSize: 15 }}>
              {t.perKill > 0 ? `₹${t.perKill}` : `₹${t.prizePool}`}
            </div>
          </div>
        </div>

        {/* Slot progress */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
            <span>Players</span>
            <span>{t.participants?.length || 0}/{t.slots}</span>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: 4, height: 5 }}>
            <div
              style={{
                background: pct >= 100 ? "#ef4444" : color,
                borderRadius: 4, height: "100%",
                width: `${pct}%`, transition: "width 0.3s",
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
