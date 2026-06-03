"use client";

import { useState, useEffect } from "react";
import { tournamentsAPI } from "@/lib/axios";
import { Tournament } from "@/types";
import TournamentCard from "@/components/TournamentCard";

const TYPE_FILTERS = ["All", "Solo", "Duo", "Squad", "Clash Squad", "BR Kill Race"];
const STATUS_FILTERS = ["All", "upcoming", "live", "completed"];
const TYPE_COLORS: Record<string, string> = {
  Solo: "#00e5ff", Duo: "#7c3aed", Squad: "#10b981",
  "Clash Squad": "#f59e0b", "BR Kill Race": "#ef4444",
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tournamentsAPI.getAll()
      .then((res) => setTournaments(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = tournaments.filter((t) => {
    const matchType = typeFilter === "All" || t.type === typeFilter;
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  return (
    <div className="page-enter" style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 6px" }}>🏆 All Tournaments</h1>
        <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
          {tournaments.length} tournaments available · Pay entry · Win prizes on UPI
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search tournaments..."
          style={{ maxWidth: 340 }}
        />
      </div>

      {/* Type filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {TYPE_FILTERS.map((f) => (
          <button key={f} onClick={() => setTypeFilter(f)}
            style={{
              background: typeFilter === f ? (TYPE_COLORS[f] || "#00e5ff") : "transparent",
              border: `1px solid ${(TYPE_COLORS[f] || "#00e5ff")}44`,
              color: typeFilter === f ? "#000" : (TYPE_COLORS[f] || "#00e5ff"),
              padding: "6px 14px", borderRadius: 20, cursor: "pointer",
              fontWeight: 700, fontSize: 12, fontFamily: "inherit",
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Status filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{
              background: statusFilter === s ? "#ffffff11" : "transparent",
              border: `1px solid ${statusFilter === s ? "#ffffff33" : "#ffffff11"}`,
              color: statusFilter === s ? "#fff" : "#6b7280",
              padding: "5px 12px", borderRadius: 20, cursor: "pointer",
              fontWeight: 600, fontSize: 11, fontFamily: "inherit", textTransform: "capitalize",
            }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ background: "#111118", borderRadius: 12, height: 220, opacity: 0.5 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#4b5563" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🎮</div>
          <div>No tournaments found for this filter.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
          {filtered.map((t) => <TournamentCard key={t._id} tournament={t} />)}
        </div>
      )}
    </div>
  );
}
