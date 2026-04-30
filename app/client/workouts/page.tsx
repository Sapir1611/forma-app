"use client";

import { useRouter } from "next/navigation";

export default function ClientWorkoutsPage() {
  const router = useRouter();

  return (
    <div dir="rtl" style={pageStyle}>
      <button
        onClick={() => router.push("/client")}
        style={backButtonStyle}
      >
        ← חזרה
      </button>

      <div style={headerCardStyle}>
        <h1 style={mainTitleStyle}>האימונים שלי 🏋️‍♀️</h1>

        <p style={subTitleStyle}>
          כאן יופיעו האימונים שספיר בנתה עבורך
        </p>
      </div>

      <div style={cardStyle}>
        <div style={badgeStyle}>אימון A</div>

        <h2 style={titleStyle}>פלג גוף תחתון</h2>

        <p style={textStyle}>
          היפ טראסט · סקוואט · לאנג׳ · קיקבק
        </p>

        <button style={mainButtonStyle}>
          התחלת אימון
        </button>
      </div>

      <div style={cardStyle}>
        <div style={badgeStyle}>אימון B</div>

        <h2 style={titleStyle}>גב וכתפיים</h2>

        <p style={textStyle}>
          פולי עליון · חתירה · הרחקות כתפיים
        </p>

        <button style={mainButtonStyle}>
          התחלת אימון
        </button>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg, #fff8f5 0%, #fde7df 100%)",
  padding: 20,
  fontFamily: "Arial, sans-serif",
  color: "#2b2b2b",
};

const backButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  fontSize: 16,
  marginBottom: 18,
  cursor: "pointer",
  color: "#2b2b2b",
  fontWeight: 700,
};

const headerCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 24,
  padding: 20,
  marginBottom: 18,
  boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
};

const mainTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 30,
  color: "#2b2b2b",
  fontWeight: 900,
};

const subTitleStyle: React.CSSProperties = {
  color: "#555",
  marginTop: 8,
  marginBottom: 0,
  fontWeight: 500,
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 24,
  padding: 20,
  marginBottom: 18,
  boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  background: "#fde7df",
  color: "#d86f4d",
  padding: "6px 12px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 12,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  color: "#2b2b2b",
  fontWeight: 900,
};

const textStyle: React.CSSProperties = {
  color: "#666",
  lineHeight: 1.7,
  marginTop: 10,
  marginBottom: 18,
  fontWeight: 500,
};

const mainButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: 16,
  borderRadius: 18,
  border: "none",
  background: "#e88f6f",
  color: "#fff",
  fontSize: 16,
  fontWeight: 900,
  cursor: "pointer",
  boxShadow:
    "0 10px 22px rgba(232,143,111,0.25)",
};