"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    window.localStorage.setItem("forma_role", "coach");
    window.localStorage.setItem("forma_user", data.user.email || "Sapir");

    router.push("/dashboard");
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #fff8f5 0%, #fde7df 55%, #fcf3ef 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#ffffff",
          borderRadius: 30,
          padding: 34,
          boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <img
          src="/logo.png"
          alt="Forma Logo"
          style={{
            width: 130,
            margin: "0 auto 16px",
            display: "block",
          }}
        />

        <div style={{ fontSize: 14, color: "#8d8d8d", marginBottom: 6 }}>
          ברוכה הבאה ל
        </div>

        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: "#2b2b2b",
            lineHeight: 1.1,
          }}
        >
          Forma
        </div>

        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.2em",
            color: "#8d8d8d",
            marginTop: 6,
            marginBottom: 22,
          }}
        >
          BY SAPIR
        </div>

        <p
          style={{
            margin: "0 0 22px",
            color: "#777",
            lineHeight: 1.7,
            fontSize: 15,
          }}
        >
          התחברות למערכת ניהול המתאמנות, האימונים, התפריטים והמעקבים שלך
        </p>

        <input
          placeholder="אימייל"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          style={inputStyle}
        />

        <input
          placeholder="סיסמה"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          style={{ ...inputStyle, marginTop: 12 }}
        />

        {error ? (
          <div
            style={{
              marginTop: 14,
              background: "#fff2ee",
              border: "1px solid #f0c7bb",
              color: "#c05f43",
              borderRadius: 14,
              padding: "12px 14px",
              textAlign: "right",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        ) : null}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 18,
            padding: "15px 16px",
            border: "none",
            borderRadius: 16,
            background: loading ? "#d8a18f" : "#e88f6f",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 10px 24px rgba(232,143,111,0.28)",
          }}
        >
          {loading ? "מתחברת..." : "כניסה"}
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: 14,
  border: "1px solid #e7d8d2",
  fontSize: 15,
  outline: "none",
  background: "#fff",
  direction: "rtl",
};