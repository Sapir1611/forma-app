"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Client = {
  id: string;
  name: string | null;
  phone: string | null;
  start_weight: string | null;
  current_weight: string | null;
  goal: string | null;
  next_meeting: string | null;
};

export default function ClientPage() {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clientId = localStorage.getItem("client_id");

    if (!clientId) {
      router.push("/");
      return;
    }

    loadClient(clientId);
  }, [router]);

  async function loadClient(clientId: string) {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    setClient(data);
    setLoading(false);
  }

  if (loading) {
    return <div style={pageStyle}>טוען נתונים...</div>;
  }

  if (!client) {
    return <div style={pageStyle}>אין מתאמנת</div>;
  }

  return (
    <div dir="rtl" style={pageStyle}>
      <div style={headerStyle}>
        <img src="/logo.png" alt="Forma" style={logoStyle} />
        <div>
          <h1 style={{ margin: 0 }}>היי {client.name || "אהובה"} 💛</h1>
          <p style={{ margin: "6px 0 0", color: "#777" }}>
            ברוכה הבאה לאזור האישי שלך
          </p>
        </div>
      </div>

      <div style={gridStyle}>
        <div style={cardStyle}>
          <div style={labelStyle}>משקל נוכחי</div>
          <div style={valueStyle}>{client.current_weight || "-"}</div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>יעד</div>
          <div style={valueStyle}>{client.goal || "-"}</div>
        </div>
      </div>

      <div style={bigCardStyle}>
        <div style={labelStyle}>פגישה הבאה</div>
        <div style={valueStyle}>
          {client.next_meeting
            ? new Date(client.next_meeting).toLocaleString("he-IL")
            : "לא נקבעה פגישה"}
        </div>
      </div>

      <div style={buttonsGridStyle}>
        <button style={buttonStyle}>אימונים</button>
        <button style={buttonStyle}>תפריט</button>
        <button style={buttonStyle}>מדידות</button>
        <button style={buttonStyle}>מים וצעדים</button>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #fff8f5, #fde7df)",
  padding: 22,
  fontFamily: "Arial, sans-serif",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginBottom: 24,
};

const logoStyle: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: 18,
  objectFit: "cover",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  marginBottom: 14,
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
};

const bigCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 18,
  padding: 18,
  marginBottom: 18,
  boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
};

const labelStyle: React.CSSProperties = {
  color: "#888",
  fontSize: 14,
  marginBottom: 8,
};

const valueStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
};

const buttonsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const buttonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 18,
  padding: 18,
  background: "#e88f6f",
  color: "#fff",
  fontSize: 16,
  fontWeight: 800,
};