"use client";

import { useRouter } from "next/navigation";

export default function ClientWorkoutsPage() {
  const router = useRouter();

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #fff8f5, #fde7df)",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <button
        onClick={() => router.push("/client")}
        style={{
          border: "none",
          background: "transparent",
          fontSize: 16,
          marginBottom: 18,
        }}
      >
        ← חזרה
      </button>

      <h1 style={{ margin: 0, fontSize: 30 }}>האימונים שלי 🏋️‍♀️</h1>

      <p style={{ color: "#777", marginTop: 8 }}>
        כאן יופיעו האימונים שספיר בנתה עבורך
      </p>

      <div style={card}>
        <h2 style={title}>אימון A — פלג גוף תחתון</h2>
        <p style={text}>היפ טראסט · סקוואט · לאנג׳ · קיקבק</p>
        <button style={button}>התחלת אימון</button>
      </div>

      <div style={card}>
        <h2 style={title}>אימון B — גב וכתפיים</h2>
        <p style={text}>פולי עליון · חתירה · הרחקות כתפיים</p>
        <button style={button}>התחלת אימון</button>
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 22,
  padding: 20,
  marginTop: 18,
  boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
};

const text: React.CSSProperties = {
  color: "#777",
  lineHeight: 1.6,
};

const button: React.CSSProperties = {
  width: "100%",
  padding: 16,
  borderRadius: 16,
  border: "none",
  background: "#e88f6f",
  color: "#fff",
  fontSize: 16,
  fontWeight: 800,
};