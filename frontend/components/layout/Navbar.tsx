"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav
      style={{
        background: "rgba(7,7,15,0.97)",
        borderBottom: "1px solid rgba(0,229,255,0.12)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <span style={{ fontSize: 22 }}>🎮</span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 900,
            background: "linear-gradient(90deg, #00e5ff, #7c3aed)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          FF Arena
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/tournaments" style={{ color: "#9ca3af", fontSize: 13, textDecoration: "none", fontWeight: 600 }}>
          Tournaments
        </Link>

        {!user ? (
          <>
            <Link
              href="/login"
              style={{
                background: "transparent",
                border: "1px solid #00e5ff44",
                color: "#00e5ff",
                padding: "7px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Login
            </Link>
            <Link
              href="/signup"
              style={{
                background: "linear-gradient(135deg, #00e5ff, #0099cc)",
                color: "#000",
                padding: "7px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Sign Up
            </Link>
          </>
        ) : (
          <>
            {user.role === "admin" && (
              <Link
                href="/admin"
                style={{
                  background: "#fbbf2422",
                  border: "1px solid #fbbf2444",
                  color: "#fbbf24",
                  padding: "7px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                👑 Admin
              </Link>
            )}
            <span
              style={{
                background: "#00e5ff11",
                border: "1px solid #00e5ff33",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                color: "#00e5ff",
              }}
            >
              💎 {user.diamonds} | ₹{user.inrBalance}
            </span>
            <Link
              href="/dashboard"
              style={{
                background: "transparent",
                border: "1px solid #00e5ff44",
                color: "#00e5ff",
                padding: "7px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "none",
                color: "#6b7280",
                padding: "7px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
