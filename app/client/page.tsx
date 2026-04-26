"use client";

import { useEffect, useMemo, useState } from "react";
import { Client, getClients, saveClients } from "@/lib/storage";

function todayIso() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(date: string) {
  if (!date) return "לא נקבע";
  try {
    return new Date(date).toLocaleDateString("he-IL");
  } catch {
    return date;
  }
}

function formatMeeting(date?: string, time?: string) {
  if (!date && !time) return "לא נקבע";
  if (date && time) return `${formatDate(date)} • ${time}`;
  if (date) return formatDate(date);
  return time || "לא נקבע";
}

export default function ClientPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null); // 🔥 תיקון

  useEffect(() => {
    const all = getClients();
    setClients(all);

    if (all.length > 0) {
      setSelectedClientId(String(all[0].id)); // 🔥 תיקון
    }
  }, []);

  const client = useMemo(
    () => clients.find((c) => String(c.id) === selectedClientId) || null, // 🔥 תיקון
    [clients, selectedClientId]
  );

  const today = todayIso();

  const dailyData = (client as any)?.dailyData?.[today] || {
    workoutDone: false,
    water: 0,
    steps: 0,
    weight: "",
  };

  const updateDaily = (field: string, value: any) => {
    if (!client) return;

    const updatedClients = getClients().map((c: any) => {
      if (c.id !== client.id) return c;

      const dailyData = c.dailyData || {};
      const todayData = dailyData[today] || {};

      return {
        ...c,
        dailyData: {
          ...dailyData,
          [today]: {
            ...todayData,
            [field]: value,
          },
        },
      };
    });

    saveClients(updatedClients);
    setClients(updatedClients);
  };

  const showPaymentReminder =
  (client as any)?.showPaymentReminder &&
  !(client as any)?.paymentReminderDismissed &&
  (client as any)?.nextPaymentDate === today;;

  return (
    <div dir="rtl" style={container}>
      <div style={topBar}>
        <div>
          <div style={logo}>Forma 💛</div>
          <div style={subtitle}>אזור מתאמנת</div>
        </div>

        <select
          value={selectedClientId ?? ""}
          onChange={(e) => setSelectedClientId(e.target.value)} // 🔥 תיקון
          style={input}
        >
          {clients.map((c) => (
            <option key={c.id} value={String(c.id)}> {/* 🔥 תיקון */}
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
      </div>

      {!client ? (
        <div style={card}>אין מתאמנת</div>
      ) : (
        <>
          {showPaymentReminder && (
            <div style={alertBox}>
              💌 תזכורת קטנה להעביר תשלום היום ♥️
            </div>
          )}

          <div style={card}>
            <div style={title}>היי {client.firstName} 💛</div>
            <div style={small}>הפגישה הבאה שלך:</div>
            <div style={big}>
              {formatMeeting(client.nextMeeting, client.nextMeetingTime)}
            </div>
          </div>

          <div style={card}>
            <div style={title}>מעקב יומי</div>

            <div style={row}>
              <span>אימון</span>
              <button
                style={
                  dailyData.workoutDone ? doneButton : primaryButton
                }
                onClick={() =>
                  updateDaily("workoutDone", !dailyData.workoutDone)
                }
              >
                {dailyData.workoutDone ? "בוצע ✔️" : "סמן כביצוע"}
              </button>
            </div>

            <div style={row}>
              <span>מים (ליטר)</span>
              <input
                type="number"
                value={dailyData.water}
                onChange={(e) =>
                  updateDaily("water", Number(e.target.value)) // 🔥 תיקון קטן
                }
                style={smallInput}
              />
            </div>

            <div style={row}>
              <span>צעדים</span>
              <input
                type="number"
                value={dailyData.steps}
                onChange={(e) =>
                  updateDaily("steps", Number(e.target.value)) // 🔥 תיקון קטן
                }
                style={smallInput}
              />
            </div>

            {client.showClientWeight && (
              <div style={row}>
                <span>משקל</span>
                <input
                  type="number"
                  value={dailyData.weight}
                  onChange={(e) =>
                    updateDaily("weight", e.target.value)
                  }
                  style={smallInput}
                />
              </div>
            )}
          </div>

          {(client.showClientWeight || client.showClientMeasurements) && (
            <div style={card}>
              <div style={title}>התקדמות</div>

              {client.showClientWeight && (
                <div style={metric}>
                  משקל נוכחי:{" "}
                  {dailyData.weight || client.currentWeight || "—"}
                </div>
              )}

              {client.showClientMeasurements &&
                client.measurementHistory && client.measurementHistory.length > 0 && (
                  <div style={grid}>
                    {Object.entries(
                      client.measurementHistory[
                        client.measurementHistory.length - 1
                      ].measurements
                    ).map(([key, val]) => (
                      <div key={key} style={miniCard}>
                        <div>{key}</div>
                        <strong>{val || "—"}</strong>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ==== STYLE ==== */

const container: React.CSSProperties = {
  minHeight: "100vh",
  background: "#fcf7f4",
  padding: 16,
  fontFamily: "Arial",
};

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 12,
};

const logo = { fontSize: 24, fontWeight: 800 };
const subtitle = { color: "#777" };

const card = {
  background: "#fff",
  padding: 16,
  borderRadius: 14,
  marginBottom: 12,
};

const title = { fontSize: 20, fontWeight: 800 };
const small = { color: "#777" };
const big = { fontSize: 18, fontWeight: 700 };

const alertBox = {
  background: "#fff4e5",
  padding: 12,
  borderRadius: 10,
  marginBottom: 10,
  fontWeight: 700,
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 10,
};

const primaryButton = {
  background: "#e88f6f",
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  borderRadius: 8,
};

const doneButton = {
  ...primaryButton,
  background: "#4caf50",
};

const input = {
  padding: 6,
  borderRadius: 6,
};

const smallInput = {
  width: 80,
};

const metric = { marginTop: 8 };

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: 8,
  marginTop: 10,
};

const miniCard: React.CSSProperties = {
  background: "#f7f7f7",
  padding: 8,
  borderRadius: 8,
  textAlign: "center",
};