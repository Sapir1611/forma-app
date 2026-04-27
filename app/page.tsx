"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    // שליפה מהטבלה
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("phone", phone)
      .eq("access_code", code)
      .single();

    if (error || !data) {
      setError("פרטים לא נכונים");
      return;
    }

    // שמירה למכשיר
    localStorage.setItem("forma_role", "client");
    localStorage.setItem("client_id", data.id);

    router.push("/client");
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
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          borderRadius: 30,
          padding: 34,
          boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <img
          src="/logo.png"
          style={{
            width: 130,
            margin: "0 auto 16px",
            display: "block",
          }}
        />

        <div style={{ fontSize: 14, color: "#8d8d8d" }}>
          ברוכה הבאה ל
        </div>

        <div style={{ fontSize: 40, fontWeight: 700 }}>
          Forma
        </div>

        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.2em",
            color: "#8d8d8d",
            marginBottom: 20,
          }}
        >
          BY SAPIR
        </div>

        <input
          placeholder="מספר טלפון"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="קוד אישי"
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ ...inputStyle, marginTop: 10 }}
        />

        {error && (
          <div style={{ color: "red", marginTop: 10 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            marginTop: 20,
            padding: 14,
            borderRadius: 16,
            border: "none",
            background: "#e88f6f",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          כניסה
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
};