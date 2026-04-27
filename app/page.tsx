"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🚀 כניסה אוטומטית אם כבר התחברה בעבר
  useEffect(() => {
    const savedClient = localStorage.getItem("forma_client_id");
    if (savedClient) {
      router.push("/client");
    }
  }, []);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("phone", phone.trim())
      .eq("access_code", code.trim())
      .single();

    setLoading(false);

    if (error || !data) {
      setError("מספר טלפון או קוד שגויים");
      return;
    }

    // 💾 שומרת את המשתמש בטלפון
    localStorage.setItem("forma_client_id", data.id);

    router.push("/client");
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #fff8f5 0%, #fde7df 55%, #fcf3ef 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
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
        <img src="/logo.png" style={{ width: 120, marginBottom: 16 }} />

        <h1 style={{ fontSize: 34 }}>Forma</h1>

        <p style={{ color: "#777", marginBottom: 20 }}>
          התחברי למערכת האישית שלך
        </p>

        <input
          placeholder="מספר טלפון"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="קוד אישי"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ ...inputStyle, marginTop: 12 }}
        />

        {error && (
          <div style={{ color: "red", marginTop: 10 }}>{error}</div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 16,
            padding: 14,
            borderRadius: 14,
            background: "#e88f6f",
            color: "white",
            border: "none",
            fontWeight: 600,
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
  border: "1px solid #ddd",
};