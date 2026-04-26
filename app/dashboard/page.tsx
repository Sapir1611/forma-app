"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Client = {
  id: string;
  name: string | null;
  phone: string | null;
  start_weight: string | null;
  goal: string | null;
  status: string | null;
  created_at: string | null;
  next_meeting: string | null;
};

function formatCreatedAt(date: string | null) {
  if (!date) return "לא ידוע";
  try {
    return new Date(date).toLocaleDateString("he-IL");
  } catch {
    return date;
  }
}

function formatMeeting(date: string | null) {
  if (!date) return "לא נקבעה פגישה";
  try {
    return new Date(date).toLocaleString("he-IL", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return date;
  }
}

export default function DashboardPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [startWeight, setStartWeight] = useState("");
  const [goal, setGoal] = useState("");

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [meetingDate, setMeetingDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [message, setMessage] = useState("");

  async function loadClients() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .neq("status", "inactive")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`שגיאה בטעינת מתאמנות: ${error.message}`);
      setClients([]);
      setLoading(false);
      return;
    }

    setClients((data as Client[]) || []);
    setLoading(false);
  }

  async function addClient() {
    if (!name.trim()) {
      setMessage("צריך למלא שם מתאמנת");
      return;
    }

    setSavingClient(true);
    setMessage("");

    const { error } = await supabase.from("clients").insert([
      {
        name: name.trim(),
        phone: phone.trim() || null,
        start_weight: startWeight.trim() || null,
        goal: goal.trim() || null,
        status: "active",
      },
    ]);

    if (error) {
      setMessage(`שגיאה בשמירה: ${error.message}`);
      setSavingClient(false);
      return;
    }

    setName("");
    setPhone("");
    setStartWeight("");
    setGoal("");
    setShowAddForm(false);

    setMessage("המתאמנת נשמרה");
    await loadClients();
    setSavingClient(false);
  }

  async function makeInactive(id: string) {
    const ok = window.confirm("להעביר את המתאמנת ללא פעילה?");
    if (!ok) return;

    const { error } = await supabase
      .from("clients")
      .update({ status: "inactive" })
      .eq("id", id);

    if (error) {
      setMessage(`שגיאה בעדכון סטטוס: ${error.message}`);
      return;
    }

    setMessage("המתאמנת הועברה ללא פעילה");
    await loadClients();
  }

  async function deleteClient(id: string) {
    const ok = window.confirm("למחוק את המתאמנת?");
    if (!ok) return;

    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) {
      setMessage(`שגיאה במחיקה: ${error.message}`);
      return;
    }

    setMessage("המתאמנת נמחקה");
    await loadClients();
  }

  function openMeetingModal(client: Client) {
    setSelectedClient(client);
    setMeetingDate(client.next_meeting ? toDatetimeLocal(client.next_meeting) : "");
  }

  function closeMeetingModal() {
    setSelectedClient(null);
    setMeetingDate("");
  }

  async function saveMeeting() {
    if (!selectedClient || !meetingDate) {
      setMessage("צריך לבחור תאריך ושעה");
      return;
    }

    setSavingMeeting(true);

    const { error } = await supabase
      .from("clients")
      .update({ next_meeting: meetingDate })
      .eq("id", selectedClient.id);

    if (error) {
      setMessage(`שגיאה בשמירת פגישה: ${error.message}`);
      setSavingMeeting(false);
      return;
    }

    closeMeetingModal();
    setMessage("הפגישה נשמרה");
    await loadClients();
    setSavingMeeting(false);
  }

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;

    return clients.filter((client) => {
      const hay = `${client.name || ""} ${client.goal || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [clients, search]);

  useEffect(() => {
    loadClients();
  }, []);

  return (
    <div dir="rtl" style={pageStyle}>
      <div style={layoutStyle}>
        <aside style={sidebarStyle}>
          <div style={brandCardStyle}>
            <div style={brandTitleStyle}>Forma</div>
            <div style={brandSubtitleStyle}>דשבורד מאמנת</div>
          </div>

          <div style={sidebarCardStyle}>
            <div style={sidebarSectionTitleStyle}>פעולות מהירות</div>

            <button
              onClick={() => setShowAddForm((prev) => !prev)}
              style={primaryFullButtonStyle}
            >
              {showAddForm ? "סגירת הוספת מתאמנת" : "הוספת מתאמנת"}
            </button>

            <button
              onClick={() => router.push("/dashboard/food")}
              style={ghostFullButtonStyle}
            >
              מאגר מזון
            </button>

            <button
              onClick={() => router.push("/dashboard/exercises")}
              style={ghostFullButtonStyle}
            >
              מאגר תרגילים
            </button>

            <button
              onClick={() => router.push("/dashboard/payments")}
              style={ghostFullButtonStyle}
            >
              תשלומים
            </button>

            <button
              onClick={() => router.push("/dashboard/inactive-clients")}
              style={ghostFullButtonStyle}
            >
              מתאמנות לא פעילות
            </button>
          </div>

          {showAddForm && (
            <div style={sidebarCardStyle}>
              <div style={sidebarSectionTitleStyle}>מתאמנת חדשה</div>

              <input
                placeholder="שם"
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

              <input
                placeholder="משקל התחלתי"
                value={startWeight}
                onChange={(e) => setStartWeight(e.target.value)}
                style={inputStyle}
              />

              <input
                placeholder="מטרה"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                style={inputStyle}
              />

              <button
                onClick={addClient}
                disabled={savingClient}
                style={primaryFullButtonStyle}
              >
                {savingClient ? "שומר..." : "שמירה"}
              </button>
            </div>
          )}
        </aside>

        <main style={mainStyle}>
          <div style={topBarStyle}>
            <div>
              <div style={sectionTitleStyle}>מתאמנות פעילות</div>
              <div style={sectionSubtitleStyle}>מחובר ל־Supabase</div>
            </div>

            <div style={statsRowStyle}>
              <div style={statBoxStyle}>סה״כ: {filteredClients.length}</div>
            </div>
          </div>

          <div style={searchWrapStyle}>
            <input
              placeholder="חיפוש לפי שם"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={searchInputStyle}
            />
          </div>

          {message ? <div style={messageStyle}>{message}</div> : null}

          {loading ? (
            <div>טוען מתאמנות...</div>
          ) : filteredClients.length === 0 ? (
            <div style={emptyStyle}>אין מתאמנות פעילות כרגע</div>
          ) : (
            <div style={cardsListStyle}>
              {filteredClients.map((client) => (
                <div key={client.id} style={clientCardStyle}>
                  <div style={clientTopRowStyle}>
                    <div>
                      <button
                        onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                        style={nameButtonStyle}
                      >
                        {client.name || "ללא שם"}
                      </button>

                      <div style={createdAtStyle}>
                        תאריך הרשמה: {formatCreatedAt(client.created_at)}
                      </div>
                    </div>

                    <div style={statusPillStyle}>פעילה</div>
                  </div>

                  <div style={clientInfoGridStyle}>
                    <div style={infoBoxStyle}>
                      <div style={infoLabelStyle}>משקל התחלתי</div>
                      <div>{client.start_weight || "-"}</div>
                    </div>

                    <div style={infoBoxStyle}>
                      <div style={infoLabelStyle}>פגישה הבאה</div>
                      <div>{formatMeeting(client.next_meeting)}</div>
                    </div>
                  </div>

                  <div style={actionsRowStyle}>
                    <button
                      onClick={() => openMeetingModal(client)}
                      style={meetingButtonStyle}
                    >
                      פגישה
                    </button>

                    <button
                      onClick={() => makeInactive(client.id)}
                      style={warnButtonStyle}
                    >
                      ללא פעילה
                    </button>

                    <button
                      onClick={() => deleteClient(client.id)}
                      style={dangerButtonStyle}
                    >
                      מחיקה
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {selectedClient && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalTitleStyle}>קביעת פגישה</div>
            <div style={modalSubtitleStyle}>
              {selectedClient.name || "מתאמנת"}
            </div>

            <input
              type="datetime-local"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              style={inputStyle}
            />

            <div style={modalActionsStyle}>
              <button
                onClick={saveMeeting}
                disabled={savingMeeting}
                style={primaryButtonStyle}
              >
                {savingMeeting ? "שומר..." : "שמירת פגישה"}
              </button>

              <button onClick={closeMeetingModal} style={ghostButtonStyle}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function toDatetimeLocal(value: string) {
  try {
    const date = new Date(value);
    const pad = (n: number) => String(n).padStart(2, "0");

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#fcf7f4",
  padding: 24,
  fontFamily: "Arial, sans-serif",
  color: "#2b2b2b",
};

const layoutStyle: React.CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "320px 1fr",
  gap: 18,
  alignItems: "start",
};

const sidebarStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
  position: "sticky",
  top: 20,
};

const brandCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 18,
  padding: 20,
};

const brandTitleStyle: React.CSSProperties = {
  fontSize: 34,
  fontWeight: 800,
};

const brandSubtitleStyle: React.CSSProperties = {
  color: "#777",
  marginTop: 6,
};

const sidebarCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 18,
  padding: 18,
};

const sidebarSectionTitleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  marginBottom: 14,
};

const mainStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 18,
  padding: 20,
};

const topBarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 16,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
};

const sectionSubtitleStyle: React.CSSProperties = {
  color: "#777",
  marginTop: 4,
};

const statsRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const statBoxStyle: React.CSSProperties = {
  background: "#fcf7f4",
  borderRadius: 12,
  padding: "10px 14px",
  fontWeight: 700,
};

const searchWrapStyle: React.CSSProperties = {
  marginBottom: 14,
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "1px solid #ddd",
  direction: "rtl",
};

const messageStyle: React.CSSProperties = {
  marginBottom: 16,
  padding: 12,
  borderRadius: 12,
  background: "#f7efe9",
};

const emptyStyle: React.CSSProperties = {
  background: "#fcf7f4",
  borderRadius: 14,
  padding: 18,
};

const cardsListStyle: React.CSSProperties = {
  display: "grid",
  gap: 14,
};

const clientCardStyle: React.CSSProperties = {
  background: "#fcf7f4",
  borderRadius: 16,
  padding: 16,
};

const clientTopRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14,
};

const nameButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  fontSize: 22,
  fontWeight: 800,
  cursor: "pointer",
  textAlign: "right",
};

const createdAtStyle: React.CSSProperties = {
  color: "#888",
  marginTop: 6,
  fontSize: 13,
};

const statusPillStyle: React.CSSProperties = {
  background: "#e9f8ee",
  color: "#1f7a3d",
  borderRadius: 999,
  padding: "8px 12px",
  fontWeight: 700,
};

const clientInfoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
  marginBottom: 14,
};

const infoBoxStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: 12,
};

const infoLabelStyle: React.CSSProperties = {
  color: "#777",
  fontSize: 13,
  marginBottom: 6,
};

const actionsRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  marginBottom: 12,
  borderRadius: 12,
  border: "1px solid #ddd",
  direction: "rtl",
};

const primaryFullButtonStyle: React.CSSProperties = {
  width: "100%",
  background: "#e88f6f",
  color: "#fff",
  border: "none",
  padding: "12px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700,
  marginBottom: 10,
};

const ghostFullButtonStyle: React.CSSProperties = {
  width: "100%",
  background: "#fff",
  color: "#333",
  border: "1px solid #ddd",
  padding: "12px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700,
  marginBottom: 10,
};

const primaryButtonStyle: React.CSSProperties = {
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

const meetingButtonStyle: React.CSSProperties = {
  background: "#f59e0b",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};

const warnButtonStyle: React.CSSProperties = {
  background: "#f2ad59",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};

const dangerButtonStyle: React.CSSProperties = {
  background: "#d9534f",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  zIndex: 1000,
};

const modalCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 18,
  padding: 20,
  width: "100%",
  maxWidth: 420,
};

const modalTitleStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  marginBottom: 6,
};

const modalSubtitleStyle: React.CSSProperties = {
  color: "#777",
  marginBottom: 14,
};

const modalActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};