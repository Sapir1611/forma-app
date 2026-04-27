"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("אימייל או סיסמה לא נכונים");
      return;
    }

    // בדיקה שזה באמת את
    if (data.user.email !== "sapirb1611@gmail.com") {
      setError("אין הרשאה");
      return;
    }

    localStorage.setItem("forma_role", "coach");
    router.push("/dashboard");
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#fff7f3",
      }}
    >
      <div style={{ width: 320 }}>
        <h2>כניסת מאמנת</h2>

        <input
          placeholder="אימייל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <input
          placeholder="סיסמה"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        {error && <div style={{ color: "red" }}>{error}</div>}

        <button onClick={handleLogin} style={{ width: "100%" }}>
          כניסה
        </button>
      </div>
    </div>
  );
}