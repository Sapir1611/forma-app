"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Exercise,
  addExercise,
  deleteExercise,
  getExercises,
  saveExercises,
  updateExercise,
} from "@/lib/storage";

export default function ExercisesPage() {
  const router = useRouter();

  const [exercises, setExercises] = useState<Exercise[]>(() =>
    getExercises()
  );
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "",
    muscleGroup: "",
    videoLink: "",
  });

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const target =
        `${ex.name} ${ex.muscleGroup} ${ex.videoLink}`.toLowerCase();
      return target.includes(search.toLowerCase());
    });
  }, [exercises, search]);

  const resetForm = () => {
    setForm({
      name: "",
      muscleGroup: "",
      videoLink: "",
    });
    setEditingId(null);
  };

  const refresh = () => {
    setExercises(getExercises());
  };

  const handleSave = () => {
    if (!form.name.trim()) return;

    const payload: Exercise = {
      id: editingId ?? Date.now(),
      name: form.name.trim(),
      muscleGroup: form.muscleGroup.trim(),
      videoLink: form.videoLink.trim(),
    };

    if (editingId !== null) {
      updateExercise(payload);
    } else {
      addExercise(payload);
    }

    refresh();
    resetForm();
  };

  const handleEdit = (ex: Exercise) => {
    setEditingId(ex.id);
    setForm({
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      videoLink: ex.videoLink || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: number) => {
    const ok = window.confirm("למחוק את התרגיל?");
    if (!ok) return;

    deleteExercise(id);
    refresh();

    if (editingId === id) resetForm();
  };

  const groupedMuscles = useMemo(() => {
    const groups = new Set(exercises.map((e) => e.muscleGroup).filter(Boolean));
    return Array.from(groups);
  }, [exercises]);

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
      <button onClick={() => router.push("/dashboard")} style={ghostButton}>
        חזור לדשבורד
      </button>

      <div style={{ marginTop: 16 }}>
        <h1 style={{ marginBottom: 8 }}>מאגר תרגילים</h1>
        <div style={{ color: "#777", lineHeight: 1.7 }}>
          כאן את מוסיפה, עורכת ומנהלת את כל התרגילים במאגר, כולל קבוצת שריר וקישור לסרטון.
        </div>
      </div>

      <div style={box}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 0 }}>
            {editingId ? "עריכת תרגיל" : "הוספת תרגיל"}
          </h3>

          {editingId !== null && (
            <button onClick={resetForm} style={ghostButton}>
              ביטול עריכה
            </button>
          )}
        </div>

        <label style={labelStyle}>שם תרגיל</label>
        <input
          value={form.name}
          onChange={(e) =>
            setForm((p) => ({ ...p, name: e.target.value }))
          }
          style={inputStyle}
          placeholder="למשל Hip Thrust"
        />

        <label style={labelStyle}>קבוצת שריר</label>
        <input
          value={form.muscleGroup}
          onChange={(e) =>
            setForm((p) => ({ ...p, muscleGroup: e.target.value }))
          }
          style={inputStyle}
          placeholder="למשל ישבן"
        />

        <label style={labelStyle}>קישור לסרטון</label>
        <input
          value={form.videoLink}
          onChange={(e) =>
            setForm((p) => ({ ...p, videoLink: e.target.value }))
          }
          style={inputStyle}
          placeholder="להדביק כאן קישור"
        />

        <button onClick={handleSave} style={primary}>
          {editingId ? "שמירת שינויים" : "שמירה למאגר"}
        </button>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0 }}>חיפוש תרגיל</h3>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
          placeholder="חיפוש לפי שם, קבוצת שריר או קישור"
        />

        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {filtered.length === 0 && (
            <div style={empty}>אין תרגילים להצגה</div>
          )}

          {filtered.map((ex) => (
            <div key={ex.id} style={card}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{ex.name}</div>
                <div style={{ color: "#777", marginTop: 6 }}>
                  קבוצת שריר: {ex.muscleGroup || "—"}
                </div>
                <div style={{ color: "#777", marginTop: 6 }}>
                  סרטון: {ex.videoLink ? ex.videoLink : "לא הוזן"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => handleEdit(ex)} style={primary}>
                  עריכה
                </button>

                <button onClick={() => handleDelete(ex.id)} style={danger}>
                  מחיקה
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0 }}>קבוצות שריר שקיימות כרגע במאגר</h3>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {groupedMuscles.map((group) => (
            <div key={group} style={tag}>
              {group}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const box: React.CSSProperties = {
  background: "#fff",
  borderRadius: 20,
  padding: 20,
  marginTop: 16,
  boxShadow: "0 10px 28px rgba(0,0,0,0.05)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  marginTop: 6,
  marginBottom: 12,
  borderRadius: 12,
  border: "1px solid #ddd",
  direction: "rtl",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 700,
  fontSize: 14,
};

const primary: React.CSSProperties = {
  background: "#e88f6f",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700,
};

const ghostButton: React.CSSProperties = {
  border: "1px solid #ddd",
  background: "#fff",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700,
};

const danger: React.CSSProperties = {
  background: "#d9534f",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700,
};

const card: React.CSSProperties = {
  background: "#fcf7f4",
  padding: 14,
  borderRadius: 14,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const empty: React.CSSProperties = {
  color: "#777",
};

const tag: React.CSSProperties = {
  background: "#f5ece8",
  padding: "8px 12px",
  borderRadius: 999,
  fontWeight: 700,
};