"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Client, addClient, getClients, saveClients } from "@/lib/storage";

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

export default function DashboardPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [showAddClient, setShowAddClient] = useState(false);

  const [newClient, setNewClient] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    registerDate: todayIso(),
    startWeight: "",
    currentWeight: "",
    goal: "",
    nextMeeting: "",
    nextMeetingTime: "",
    showClientWeight: true,
    showClientMeasurements: true,
    showPaymentReminder: true,
  });

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
      const hay =
        `${client.firstName} ${client.lastName} ${client.goal || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [clients, search]);

  const activeClients = filteredClients.filter((c) => c.status !== "inactive");
  const inactiveClients = filteredClients.filter((c) => c.status === "inactive");

  const upcomingMeetings = useMemo(() => {
    return [...clients]
      .filter((client) => client.nextMeeting)
      .sort((a, b) => {
        const aKey = `${a.nextMeeting || ""} ${a.nextMeetingTime || ""}`;
        const bKey = `${b.nextMeeting || ""} ${b.nextMeetingTime || ""}`;
        return aKey.localeCompare(bKey);
      })
      .slice(0, 8);
  }, [clients]);

  const createClient = () => {
    if (!newClient.firstName.trim()) return;

    const client: Client = {
      id: Date.now(),
      firstName: newClient.firstName.trim(),
      lastName: newClient.lastName.trim(),
      birthDate: newClient.birthDate,
      registerDate: newClient.registerDate || todayIso(),
      startWeight: newClient.startWeight,
      currentWeight: newClient.currentWeight,
      goal: newClient.goal,
      nextMeeting: newClient.nextMeeting,
      nextMeetingTime: newClient.nextMeetingTime,
      status: "active",

      measurements: {
        neck: "",
        chest: "",
        waist: "",
        belly: "",
        hips: "",
      },
      measurementHistory: [],
      menuPlans: [
        {
          id: Date.now() + 1,
          name: "תפריט בסיס",
          dynamicMeals: [
            { id: "breakfast", title: "ארוחת בוקר", items: [] },
            { id: "lunch", title: "ארוחת צהריים", items: [] },
            { id: "dinner", title: "ארוחת ערב", items: [] },
          ],
        },
      ],
      workoutWeeks: [],

      lastPaymentDate: "",
      nextPaymentDate: "",
      paymentAmount: "",

      showPaymentReminder: newClient.showPaymentReminder,
      paymentReminderDismissed: false,

      showClientWeight: newClient.showClientWeight,
      showClientMeasurements: newClient.showClientMeasurements,
    };

    addClient(client);
    refreshClients();

    setNewClient({
      firstName: "",
      lastName: "",
      birthDate: "",
      registerDate: todayIso(),
      startWeight: "",
      currentWeight: "",
      goal: "",
      nextMeeting: "",
      nextMeetingTime: "",
      showClientWeight: true,
      showClientMeasurements: true,
      showPaymentReminder: true,
    });

    setShowAddClient(false);
  };

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

  const moveClientToInactive = (clientId: number) => {
    const ok = window.confirm(
      "האם את בטוחה שאת רוצה להעביר את המתאמנת ללא פעילה?"
    );
    if (!ok) return;

    const updatedClients = getClients().map((client) =>
      client.id === clientId ? { ...client, status: "inactive" as const } : client
    );

    saveClients(updatedClients);
    refreshClients();
  };

  const returnClientToActive = (clientId: number) => {
    const updatedClients = getClients().map((client) =>
      client.id === clientId ? { ...client, status: "active" as const } : client
    );

    saveClients(updatedClients);
    refreshClients();
  };

  const deleteClientFromDashboard = (clientId: number) => {
    const ok = window.confirm("למחוק את המתאמנת?");
    if (!ok) return;

    const updatedClients = getClients().filter((client) => client.id !== clientId);
    saveClients(updatedClients);
    refreshClients();
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
      <div style={headerRow}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>Forma</div>
          <div style={{ color: "#777", marginTop: 6 }}>דשבורד מאמנת</div>
        </div>

        <div style={headerStats}>
          <div style={statCard}>
            <div style={statNumber}>{activeClients.length}</div>
            <div style={statLabel}>פעילות</div>
          </div>

          <div style={statCard}>
            <div style={statNumber}>{inactiveClients.length}</div>
            <div style={statLabel}>לא פעילות</div>
          </div>

          <div style={statCard}>
            <div style={statNumber}>{upcomingMeetings.length}</div>
            <div style={statLabel}>פגישות קרובות</div>
          </div>
        </div>
      </div>

      <div style={layout}>
        <aside style={rightColumn}>
          <div style={sectionBox}>
            <div style={sectionTitle}>פעולות מהירות</div>

            <div style={{ display: "grid", gap: 8 }}>
              <button onClick={() => setShowAddClient(true)} style={primaryButton}>
                הוספת מתאמנת
              </button>

              <button
                onClick={() => router.push("/dashboard/food")}
                style={ghostButtonFull}
              >
                מאגר מזון
              </button>

              <button
                onClick={() => router.push("/dashboard/exercises")}
                style={ghostButtonFull}
              >
                מאגר תרגילים
              </button>

              <button
                onClick={() => router.push("/dashboard/payments")}
                style={ghostButtonFull}
              >
                ניהול תשלומים
              </button>
            </div>
          </div>

          <div style={sectionBox}>
            <div style={sectionTitle}>פגישות קרובות</div>

            {upcomingMeetings.length === 0 ? (
              <div style={{ color: "#777" }}>אין פגישות קרובות כרגע</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {upcomingMeetings.map((client) => (
                  <div key={client.id} style={meetingCard}>
                    <button
                      onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                      style={clientNameLink}
                    >
                      {client.firstName} {client.lastName}
                    </button>

                    <div style={smallText}>
                      {formatMeeting(client.nextMeeting, client.nextMeetingTime)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main style={mainColumn}>
          <div style={sectionBox}>
            <div style={sectionTitle}>מתאמנות</div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={input}
              placeholder="חיפוש מתאמנת"
            />

            {showAddClient && (
              <div style={addClientBox}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>
                  הוספת מתאמנת חדשה
                </div>

                <div style={formGrid}>
                  <input
                    placeholder="שם פרטי"
                    value={newClient.firstName}
                    onChange={(e) =>
                      setNewClient((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    style={input}
                  />

                  <input
                    placeholder="שם משפחה"
                    value={newClient.lastName}
                    onChange={(e) =>
                      setNewClient((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    style={input}
                  />

                  <input
                    type="date"
                    value={newClient.birthDate}
                    onChange={(e) =>
                      setNewClient((prev) => ({
                        ...prev,
                        birthDate: e.target.value,
                      }))
                    }
                    style={input}
                  />

                  <input
                    type="date"
                    value={newClient.registerDate}
                    onChange={(e) =>
                      setNewClient((prev) => ({
                        ...prev,
                        registerDate: e.target.value,
                      }))
                    }
                    style={input}
                  />

                  <input
                    placeholder="משקל התחלתי"
                    value={newClient.startWeight}
                    onChange={(e) =>
                      setNewClient((prev) => ({
                        ...prev,
                        startWeight: e.target.value,
                      }))
                    }
                    style={input}
                  />

                  <input
                    placeholder="משקל נוכחי"
                    value={newClient.currentWeight}
                    onChange={(e) =>
                      setNewClient((prev) => ({
                        ...prev,
                        currentWeight: e.target.value,
                      }))
                    }
                    style={input}
                  />

                  <input
                    placeholder="מטרה"
                    value={newClient.goal}
                    onChange={(e) =>
                      setNewClient((prev) => ({
                        ...prev,
                        goal: e.target.value,
                      }))
                    }
                    style={input}
                  />

                  <input
                    type="date"
                    value={newClient.nextMeeting}
                    onChange={(e) =>
                      setNewClient((prev) => ({
                        ...prev,
                        nextMeeting: e.target.value,
                      }))
                    }
                    style={input}
                  />

                  <input
                    type="time"
                    value={newClient.nextMeetingTime}
                    onChange={(e) =>
                      setNewClient((prev) => ({
                        ...prev,
                        nextMeetingTime: e.target.value,
                      }))
                    }
                    style={input}
                  />
                </div>

                <div style={toggleGrid}>
                  <label style={toggleCard}>
                    <input
                      type="checkbox"
                      checked={newClient.showClientWeight}
                      onChange={(e) =>
                        setNewClient((prev) => ({
                          ...prev,
                          showClientWeight: e.target.checked,
                        }))
                      }
                    />
                    <span>להציג משקל למתאמנת</span>
                  </label>

                  <label style={toggleCard}>
                    <input
                      type="checkbox"
                      checked={newClient.showClientMeasurements}
                      onChange={(e) =>
                        setNewClient((prev) => ({
                          ...prev,
                          showClientMeasurements: e.target.checked,
                        }))
                      }
                    />
                    <span>להציג היקפים למתאמנת</span>
                  </label>

                  <label style={toggleCard}>
                    <input
                      type="checkbox"
                      checked={newClient.showPaymentReminder}
                      onChange={(e) =>
                        setNewClient((prev) => ({
                          ...prev,
                          showPaymentReminder: e.target.checked,
                        }))
                      }
                    />
                    <span>להציג תזכורת תשלום</span>
                  </label>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  <button onClick={createClient} style={primaryButton}>
                    שמירה
                  </button>
                  <button
                    onClick={() => setShowAddClient(false)}
                    style={ghostButton}
                  >
                    סגירה
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gap: 12 }}>
              {activeClients.length === 0 ? (
                <div style={{ color: "#777" }}>אין מתאמנות פעילות</div>
              ) : (
                activeClients.map((client) => (
                  <div key={client.id} style={clientCard}>
                    <div style={clientCardTop}>
                      <div>
                        <button
                          onClick={() =>
                            router.push(`/dashboard/clients/${client.id}`)
                          }
                          style={clientNameLinkBig}
                        >
                          {client.firstName} {client.lastName}
                        </button>

                        <div style={smallText}>
                          תאריך הרשמה: {formatDate(client.registerDate || "")}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          onClick={() => moveClientToInactive(client.id)}
                          style={warnButton}
                        >
                          ללא פעילה
                        </button>

                        <button
                          onClick={() => deleteClientFromDashboard(client.id)}
                          style={dangerButton}
                        >
                          מחיקה
                        </button>
                      </div>
                    </div>

                    <div style={clientCardGrid}>
                      <div>
                        <label style={label}>תאריך פגישה הבאה</label>
                        <input
                          type="date"
                          value={client.nextMeeting || ""}
                          onChange={(e) =>
                            updateClientField(
                              client.id,
                              "nextMeeting",
                              e.target.value
                            )
                          }
                          style={input}
                        />
                      </div>

                      <div>
                        <label style={label}>שעת פגישה</label>
                        <input
                          type="time"
                          value={client.nextMeetingTime || ""}
                          onChange={(e) =>
                            updateClientField(
                              client.id,
                              "nextMeetingTime",
                              e.target.value
                            )
                          }
                          style={input}
                        />
                      </div>

                      <div>
                        <label style={label}>משקל נוכחי</label>
                        <input
                          value={client.currentWeight || ""}
                          onChange={(e) =>
                            updateClientField(
                              client.id,
                              "currentWeight",
                              e.target.value
                            )
                          }
                          style={input}
                        />
                      </div>

                      <div>
                        <label style={label}>מטרה</label>
                        <input
                          value={client.goal || ""}
                          onChange={(e) =>
                            updateClientField(client.id, "goal", e.target.value)
                          }
                          style={input}
                        />
                      </div>
                    </div>

                    <div style={settingsRow}>
                      <label style={toggleCardInline}>
                        <input
                          type="checkbox"
                          checked={!!client.showClientWeight}
                          onChange={(e) =>
                            updateClientField(
                              client.id,
                              "showClientWeight",
                              e.target.checked
                            )
                          }
                        />
                        <span>הצגת משקל למתאמנת</span>
                      </label>

                      <label style={toggleCardInline}>
                        <input
                          type="checkbox"
                          checked={!!client.showClientMeasurements}
                          onChange={(e) =>
                            updateClientField(
                              client.id,
                              "showClientMeasurements",
                              e.target.checked
                            )
                          }
                        />
                        <span>הצגת היקפים למתאמנת</span>
                      </label>

                      <label style={toggleCardInline}>
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
                        <span>תזכורת תשלום פעילה</span>
                      </label>
                    </div>

                    <div style={bottomRow}>
                      <div style={smallText}>
                        פגישה הבאה: {formatMeeting(client.nextMeeting, client.nextMeetingTime)}
                      </div>

                      <button
                        onClick={() =>
                          router.push(`/dashboard/clients/${client.id}`)
                        }
                        style={ghostButton}
                      >
                        פתיחת מתאמנת
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={sectionBox}>
            <div style={sectionTitle}>לא פעילות</div>

            {inactiveClients.length === 0 ? (
              <div style={{ color: "#777" }}>אין מתאמנות לא פעילות</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {inactiveClients.map((client) => (
                  <div key={client.id} style={inactiveCard}>
                    <div>
                      <button
                        onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                        style={clientNameLink}
                      >
                        {client.firstName} {client.lastName}
                      </button>

                      <div style={smallText}>
                        פגישה הבאה: {formatMeeting(client.nextMeeting, client.nextMeetingTime)}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={() => returnClientToActive(client.id)}
                        style={primaryButton}
                      >
                        החזרה לפעילות
                      </button>
                      <button
                        onClick={() => deleteClientFromDashboard(client.id)}
                        style={dangerButton}
                      >
                        מחיקה
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

const headerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 16,
};

const headerStats: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const statCard: React.CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  padding: "14px 18px",
  minWidth: 120,
  textAlign: "center",
};

const statNumber: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 800,
};

const statLabel: React.CSSProperties = {
  marginTop: 4,
  color: "#777",
  fontSize: 13,
};

const layout: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "320px 1fr",
  gap: 16,
  alignItems: "start",
};

const rightColumn: React.CSSProperties = {
  display: "grid",
  gap: 16,
  position: "sticky",
  top: 20,
};

const mainColumn: React.CSSProperties = {
  display: "grid",
  gap: 16,
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

const addClientBox: React.CSSProperties = {
  background: "#fcf7f4",
  borderRadius: 12,
  padding: 12,
  marginBottom: 16,
};

const formGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
};

const toggleGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 10,
};

const clientCard: React.CSSProperties = {
  background: "#fcf7f4",
  borderRadius: 14,
  padding: 14,
};

const inactiveCard: React.CSSProperties = {
  background: "#f7f1ed",
  borderRadius: 14,
  padding: 14,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const clientCardTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 12,
};

const clientCardGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: 10,
};

const settingsRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 4,
  marginBottom: 8,
};

const bottomRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const meetingCard: React.CSSProperties = {
  background: "#fcf7f4",
  borderRadius: 12,
  padding: 12,
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

const toggleCard: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 12,
  padding: 12,
};

const toggleCardInline: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 999,
  padding: "8px 12px",
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

const dangerButton: React.CSSProperties = {
  background: "#d9534f",
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

const ghostButtonFull: React.CSSProperties = {
  ...ghostButton,
  width: "100%",
  textAlign: "right",
};

const clientNameLink: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: 0,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 18,
  textAlign: "right",
};

const clientNameLinkBig: React.CSSProperties = {
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