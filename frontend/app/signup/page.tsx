"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authAPI } from "@/lib/axios";
import { useAuthStore } from "@/store/auth";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", ffUID: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const router = useRouter();
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.phone || !form.password) {
      toast.error("Please fill all required fields"); return;
    }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await authAPI.signup(form);
      const { token, ...user } = res.data.data;
      setUser(user, token);
      toast.success("Account created! Welcome to FF Arena!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { k: "name", l: "Full Name *", ph: "Your full name", t: "text" },
    { k: "email", l: "Email *", ph: "your@email.com", t: "email" },
    { k: "phone", l: "Phone Number *", ph: "9876543210", t: "tel" },
    { k: "ffUID", l: "Free Fire UID", ph: "e.g. 1234567890 (optional)", t: "text" },
    { k: "password", l: "Password *", ph: "Min 6 characters", t: "password" },
  ];

  return (
    <div className="page-enter" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div className="ff-card" style={{ padding: 32 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900 }}>🎯 Create Account</h2>
          <p style={{ color: "#6b7280", margin: "0 0 22px", fontSize: 13 }}>Join the arena and start winning real prizes</p>

          {fields.map((f) => (
            <div key={f.k} style={{ marginBottom: 14 }}>
              <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 5 }}>{f.l}</div>
              <input value={form[f.k as keyof typeof form]} onChange={set(f.k)} type={f.t} placeholder={f.ph} />
            </div>
          ))}

          <button onClick={handleSignup} disabled={loading}
            className="btn-primary"
            style={{ width: "100%", padding: "12px", marginTop: 10, fontSize: 14, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Creating account..." : "Create Account →"}
          </button>

          <div style={{ textAlign: "center", marginTop: 16, color: "#6b7280", fontSize: 13 }}>
            Have an account?{" "}
            <Link href="/login" style={{ color: "#00e5ff", fontWeight: 700, textDecoration: "none" }}>
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
