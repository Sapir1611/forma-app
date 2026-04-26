"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

function getPaymentStatus(client: Client) {
  const nextPaymentDate = client.nextPaymentDate || "";
  const today = todayIso();

  if (!nextPaymentDate) {
    return {
      label: "לא הוגדר",
      bg: "#f3f3f3",
      color: "#666",
    };
  }

  if (client.showPaymentReminder === false || client.paymentReminderDismissed) {
    return {
      label: "תזכורת כבויה",
      bg: "#f2f4f7",
      color: "#475467",
    };
  }

  if (nextPaymentDate < today) {
    return {
      label: "עבר תשלום",
      bg: "#fdecea",
      color: "#b42318",
    };
  }

  if (nextPaymentDate === today) {
    return {
      label: "לתשלום היום",
      bg: "#fff4e5",
      color: "#b54708",
    };
  }

  return {
    label: "עתידי",
    bg: "#ecfdf3",
    color: "#027a48",
  };
}

function buildReminderText(client: Client) {
  return `היי ${client.firstName} אהובה, תזכורת קטנה שהתשלום הבא שלך היום ♥️`;
}

export default function PaymentsPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    refreshClients();
  }, []);

  const refreshClients = () => {
    setClients(getClients());
  };

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;

    return clients.filter((client) => {
      const hay = `${client.firstName} ${client.lastName}`.toLowerCase();
      return hay.includes(q);
    });
  }, [clients, search]);

  const paymentClients = useMemo(() => {
    return [...filteredClients]
      .filter((client) => client.status !== "inactive")
      .sort((a, b) =>
        (a.nextPaymentDate || "").localeCompare(b.nextPaymentDate || "")
      );
  }, [filteredClients]);

  const updateClientField = (
    clientId: number,
    field: keyof Client,
    value: string | boolean
  ) => {
    const updatedClients = getClients().map((client) =>
      client.id === clientId ? { ...client, [field]: value } : client
    );

    saveClients(updatedClients);
    refreshClients();
  };

  const markPaymentHandled = (clientId: number) => {
    updateClientField(clientId, "paymentReminderDismissed", true);
  };

  const reactivateReminder = (clientId: number) => {
    updateClientField(clientId, "paymentReminderDismissed", false);
    updateClientField(clientId, "showPaymentReminder", true);
  };

  const copyReminder = async (client: Client) => {
    try {
      await navigator.clipboard.writeText(buildReminderText(client));
      window.alert("הודעת התזכורת הועתקה");
    } catch {
      window.alert("לא הצלחתי להעתיק את ההודעה");
    }
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#fcf7f4",
        padding: 20,
        fontFamily: "Arial, sans-serif",
        color: "#2b2b2b",
      }}
    >
      <div style={topBar}>
        <div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>ניהול תשלומים</div>
          <div style={{ color: "#777", marginTop: 6 }}>
            מסך פנימי למאמנת בלבד
          </div>
        </div>

        <button onClick={() => router.push("/dashboard")} style={ghostButton}>
          חזרה לדשבורד
        </button>
      </div>

      <div style={sectionBox}>
        <div style={sectionTitle}>תשלומים של מתאמנות</div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={input}
          placeholder="חיפוש מתאמנת"
        />

        {paymentClients.length === 0 ? (
          <div style={{ color: "#777" }}>אין מתאמנות להצגה</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {paymentClients.map((client) => {
              const status = getPaymentStatus(client);

              return (
                <div key={client.id} style={clientCard}>
                  <div style={clientCardTop}>
                    <div>
                      <button
                        onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                        style={clientNameLink}
                      >
                        {client.firstName} {client.lastName}
                      </button>

                      <div style={smallText}>
                        סטטוס:{" "}
                        <span
                          style={{
                            ...statusPill,
                            background: status.bg,
                            color: status.color,
                          }}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={() => copyReminder(client)}
                        style={ghostButton}
                      >
                        העתקת הודעה
                      </button>

                      <button
                        onClick={() => markPaymentHandled(client.id)}
                        style={primaryButton}
                      >
                        סימון שטופל
                      </button>

                      <button
                        onClick={() => reactivateReminder(client.id)}
                        style={warnButton}
                      >
                        החזרת תזכורת
                      </button>
                    </div>
                  </div>

                  <div style={grid}>
                    <div>
                      <label style={label}>תאריך תשלום קודם</label>
                      <input
                        type="date"
                        value={client.nextPaymentDate || ""}
                        onChange={(e) =>
                          updateClientField(
                            client.id,
                            "nextPaymentDate",
                            e.target.value
                          )
                        }
                        style={input}
                      />
                    </div>

                    <div>
                      <label style={label}>תאריך תשלום הבא</label>
                      <input
                        type="date"
                        value={client.nextPaymentDate || ""}
                        onChange={(e) =>
                          updateClientField(
                            client.id,
                            "nextPaymentDate",
                            e.target.value
                          )
                        }
                        style={input}
                      />
                    </div>

                    <div>
                      <label style={label}>סכום</label>
                      <input
                        value={client.paymentAmount || ""}
                        onChange={(e) =>
                          updateClientField(
                            client.id,
                            "paymentAmount",
                            e.target.value
                          )
                        }
                        placeholder="למשל 350"
                        style={input}
                      />
                    </div>
                  </div>

                  <div style={toggleRow}>
                    <label style={toggleCard}>
                      <input
                        type="checkbox"
                        checked={!!client.showPaymentReminder}
                        onChange={(e) =>
                          updateClientField(
                            client.id,
                            "showPaymentReminder",
                            e.target.checked
                          )
                        }
                      />
                      <span>להציג תזכורת תשלום למתאמנת</span>
                    </label>

                    <label style={toggleCard}>
                      <input
                        type="checkbox"
                        checked={!!client.paymentReminderDismissed}
                        onChange={(e) =>
                          updateClientField(
                            client.id,
                            "paymentReminderDismissed",
                            e.target.checked
                          )
                        }
                      />
                      <span>התזכורת הוסתרה כרגע</span>
                    </label>
                  </div>

                  <div style={bottomRow}>
                    <div style={smallText}>
                      תשלום קודם: {formatDate(client.lastPaymentDate || "")}
                    </div>
                    <div style={smallText}>
                      תשלום הבא: {formatDate(client.nextPaymentDate || "")}
                    </div>
                    <div style={smallText}>
                      סכום: {client.paymentAmount || "לא הוגדר"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const topBar: React.CSSProperties = {
  background: "#fff",
  padding: 20,
  borderRadius: 16,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 16,
};

const sectionBox: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  padding: 20,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  marginBottom: 14,
};

const clientCard: React.CSSProperties = {
  background: "#fcf7f4",
  borderRadius: 14,
  padding: 14,
};

const clientCardTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 12,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
};

const toggleRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 6,
  marginBottom: 8,
};

const toggleCard: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 999,
  padding: "8px 12px",
};

const bottomRow: React.CSSProperties = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
  marginTop: 6,
};

const statusPill: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  fontWeight: 700,
  fontSize: 12,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: 10,
  marginTop: 6,
  marginBottom: 12,
  borderRadius: 10,
  border: "1px solid #ddd",
  direction: "rtl",
};

const label: React.CSSProperties = {
  display: "block",
  fontWeight: 700,
};

const primaryButton: React.CSSProperties = {
  background: "#e88f6f",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};

const warnButton: React.CSSProperties = {
  background: "#f2ad59",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};

const ghostButton: React.CSSProperties = {
  border: "1px solid #ddd",
  background: "#fff",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};

const clientNameLink: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: 0,
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 22,
  textAlign: "right",
};

const smallText: React.CSSProperties = {
  color: "#777",
  fontSize: 13,
  marginTop: 4,
};