"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ClientRow = {
  id: string;
  name: string | null;
  phone: string | null;
  created_at: string | null;
};

export default function DbTestPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadClients() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`שגיאה בטעינת מתאמנות: ${error.message}`);
      setClients([]);
      setLoading(false);
      return;
    }

    setClients(data || []);
    setLoading(false);
  }

  async function addClient() {
    if (!name.trim()) {
      setMessage("צריך למלא שם");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("clients").insert([
      {
        name: name.trim(),
        phone: phone.trim() || null,
      },
    ]);

    if (error) {
      setMessage(`שגיאה בשמירה: ${error.message}`);
      setLoading(false);
      return;
    }

    setName("");
    setPhone("");
    setMessage("המתאמנת נשמרה בענן");
    await loadClients();
    setLoading(false);
  }

  useEffect(() => {
    loadClients();
  }, []);

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#fcf7f4",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <h1 style={{ marginTop: 0 }}>בדיקת חיבור ל־Supabase</h1>

        <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
          <input
            placeholder="שם מתאמנת"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="טלפון"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
          />

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={addClient} style={buttonStyle} disabled={loading}>
              שמירת מתאמנת לענן
            </button>

            <button onClick={loadClients} style={ghostButtonStyle} disabled={loading}>
              רענון רשימה
            </button>
          </div>
        </div>

        {message ? (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 10,
              background: "#f7efe9",
            }}
          >
            {message}
          </div>
        ) : null}

        <div style={{ fontWeight: 700, marginBottom: 12 }}>מתאמנות מהענן</div>

        {loading ? (
          <div>טוען...</div>
        ) : clients.length === 0 ? (
          <div>אין עדיין מתאמנות בטבלה</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {clients.map((client) => (
              <div
                key={client.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 12,
                  background: "#fcf7f4",
                }}
              >
                <div style={{ fontWeight: 700 }}>{client.name || "ללא שם"}</div>
                <div style={{ color: "#666", marginTop: 4 }}>
                  טלפון: {client.phone || "לא הוזן"}
                </div>
                <div style={{ color: "#888", marginTop: 4, fontSize: 13 }}>
                  נוצר: {client.created_at || "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "1px solid #ddd",
  direction: "rtl",
};

const buttonStyle: React.CSSProperties = {
  background: "#e88f6f",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};

const ghostButtonStyle: React.CSSProperties = {
  background: "#fff",
  color: "#333",
  border: "1px solid #ddd",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};