"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  getFoods,
  getExercises,
  seedDefaultExercises,
  type FoodItem,
  type FoodCategory,
  type ExerciseItem,
  categoryLabel,
  unitTypeLabel,
} from "@/lib/storage";
import { useParams, useRouter } from "next/navigation";

type Client = {
  id: string;
  name: string | null;
  phone: string | null;
  start_weight: string | null;
  current_weight: string | null;
  goal: string | null;
  status: string | null;
  created_at: string | null;
  next_meeting: string | null;
  notes: string | null;
};

type Measurement = {
  id: string;
  client_id: string;
  weight: number | null;
  neck: number | null;
  chest: number | null;
  waist: number | null;
  navel: number | null;
  hip: number | null;
  thigh: number | null;
  body_fat: number | null;
  created_at: string | null;
};

type MealFoodItem = {
  id: number;
  foodId: number;
  name: string;
  category: FoodCategory;
  unitType: FoodItem["unitType"];
  gramsPerUnit: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Meal = {
  id: string;
  name: string;
  foods: MealFoodItem[];
  note?: string;
};

type MenuPlanData = Meal[];

type MenuPlanRow = {
  id: string;
  client_id: string;
  title: string | null;
  data: MenuPlanData | null;
  created_at: string | null;
};

type WorkoutSet = {
  id: string;
  reps: string;
  weight: string;
  note: string;
};

type WorkoutExercise = {
  id: string;
  exerciseId: number | null;
  name: string;
  muscleGroup?: string;
  videoUrl?: string;
  notes?: string;
  sets: WorkoutSet[];
};

type WorkoutDay = {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
};

type WorkoutPlanData = {
  days: WorkoutDay[];
};

type WorkoutPlanRow = {
  id: string;
  client_id: string;
  title: string | null;
  week_label: string | null;
  start_date: string | null;
  data: WorkoutPlanData | null;
  created_at: string | null;
};

type TabKey =
  | "general"
  | "measurements"
  | "menu"
  | "workouts"
  | "payments"
  | "notes";

const CATEGORY_ORDER: FoodCategory[] = [
  "carb",
  "protein",
  "fat",
  "vegetable",
  "fruit",
];

const MEAL_PRESETS = [
  "ארוחת בוקר",
  "ארוחת צהריים",
  "ארוחת ערב",
  "ביניים",
  "ביניים 2",
  "ארוחת לילה",
];

const DAY_PRESETS = [
  "יום 1",
  "יום 2",
  "יום 3",
  "יום 4",
  "יום 5",
  "יום 6",
  "יום 7",
  "רגליים",
  "עליון",
  "תחתון",
  "גלוטס",
  "פול באדי",
  "גב ויד אחורית",
  "כתפיים וישבן",
];

function formatDate(date: string | null) {
  if (!date) return "לא הוזן";
  try {
    return new Date(date).toLocaleDateString("he-IL");
  } catch {
    return date;
  }
}

function formatDateTime(date: string | null) {
  if (!date) return "לא נקבע";
  try {
    return new Date(date).toLocaleString("he-IL", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return date;
  }
}

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  try {
    const date = new Date(value);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } catch {
    return "";
  }
}

function toInputValue(value: number | null) {
  return value === null || value === undefined ? "" : String(value);
}

function hasValue(value: number | null) {
  return value !== null && value !== undefined && !Number.isNaN(value);
}

function round1(num: number) {
  return Math.round(num * 10) / 10;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeMeals(value: unknown): Meal[] {
  if (!Array.isArray(value)) return [];

  return value.map((meal: any) => ({
    id: String(meal?.id ?? uid()),
    name: String(meal?.name ?? "ארוחה"),
    note: typeof meal?.note === "string" ? meal.note : "",
    foods: Array.isArray(meal?.foods)
      ? meal.foods.map((food: any) => ({
          id: Number(food?.id ?? Date.now()),
          foodId: Number(food?.foodId ?? 0),
          name: String(food?.name ?? ""),
          category: (food?.category ?? "protein") as FoodCategory,
          unitType: (food?.unitType ?? "unit") as FoodItem["unitType"],
          gramsPerUnit: String(food?.gramsPerUnit ?? ""),
          amount: String(food?.amount ?? "1"),
          calories: Number(food?.calories ?? 0),
          protein: Number(food?.protein ?? 0),
          carbs: Number(food?.carbs ?? 0),
          fat: Number(food?.fat ?? 0),
        }))
      : [],
  }));
}

function normalizeWorkoutData(value: unknown): WorkoutPlanData {
  const raw = value as any;
  const days = Array.isArray(raw?.days) ? raw.days : [];

  return {
    days: days.map((day: any) => ({
      id: String(day?.id ?? uid()),
      name: String(day?.name ?? "יום אימון"),
      exercises: Array.isArray(day?.exercises)
        ? day.exercises.map((exercise: any) => ({
            id: String(exercise?.id ?? uid()),
            exerciseId:
              exercise?.exerciseId === null || exercise?.exerciseId === undefined
                ? null
                : Number(exercise.exerciseId),
            name: String(exercise?.name ?? "תרגיל"),
            muscleGroup: exercise?.muscleGroup ? String(exercise.muscleGroup) : "",
            videoUrl: exercise?.videoUrl ? String(exercise.videoUrl) : "",
            notes: exercise?.notes ? String(exercise.notes) : "",
            sets: Array.isArray(exercise?.sets)
              ? exercise.sets.map((set: any) => ({
                  id: String(set?.id ?? uid()),
                  reps: String(set?.reps ?? ""),
                  weight: String(set?.weight ?? ""),
                  note: String(set?.note ?? ""),
                }))
              : [],
          }))
        : [],
    })),
  };
}

function sortFoods(items: MealFoodItem[]) {
  return [...items].sort((a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a.category);
    const bIndex = CATEGORY_ORDER.indexOf(b.category);
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.name.localeCompare(b.name, "he");
  });
}

function calcMacrosByAmount(food: FoodItem, amount: number) {
  return {
    calories: round1(Number(food.calories || 0) * amount),
    protein: round1(Number(food.protein || 0) * amount),
    carbs: round1(Number(food.carbs || 0) * amount),
    fat: round1(Number(food.fat || 0) * amount),
  };
}

function TabButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...tabButtonStyle,
        ...(isActive ? activeTabButtonStyle : {}),
      }}
    >
      {label}
    </button>
  );
}

function Chip({ label, value }: { label: string; value: number | null }) {
  if (!hasValue(value)) return null;

  return (
    <div style={chipStyle}>
      <span style={chipLabelStyle}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default function ClientPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [exerciseBank, setExerciseBank] = useState<ExerciseItem[]>([]);
  const [menuPlans, setMenuPlans] = useState<MenuPlanRow[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlanRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("general");

  const [editingProfile, setEditingProfile] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);

  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [editingMeasurementId, setEditingMeasurementId] = useState<string | null>(
    null
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [goal, setGoal] = useState("");
  const [startWeight, setStartWeight] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [meetingDate, setMeetingDate] = useState("");

  const [measurementWeight, setMeasurementWeight] = useState("");
  const [measurementNeck, setMeasurementNeck] = useState("");
  const [measurementChest, setMeasurementChest] = useState("");
  const [measurementWaist, setMeasurementWaist] = useState("");
  const [measurementNavel, setMeasurementNavel] = useState("");
  const [measurementHip, setMeasurementHip] = useState("");
  const [measurementThigh, setMeasurementThigh] = useState("");
  const [measurementBodyFat, setMeasurementBodyFat] = useState("");

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [openMealIds, setOpenMealIds] = useState<string[]>([]);

  const [showNewMenuModal, setShowNewMenuModal] = useState(false);
  const [newMenuTitle, setNewMenuTitle] = useState("");

  const [showRenameMenuModal, setShowRenameMenuModal] = useState(false);
  const [renameMenuTitle, setRenameMenuTitle] = useState("");

  const [showNewMealModal, setShowNewMealModal] = useState(false);
  const [newMealName, setNewMealName] = useState("");
  const [selectedMealPreset, setSelectedMealPreset] = useState("ארוחת בוקר");

  const [showFoodModal, setShowFoodModal] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [foodSearch, setFoodSearch] = useState("");

  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editingMealName, setEditingMealName] = useState("");
  const [editingMealNoteId, setEditingMealNoteId] = useState<string | null>(null);
  const [editingMealNote, setEditingMealNote] = useState("");

  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [openWorkoutDayIds, setOpenWorkoutDayIds] = useState<string[]>([]);
  const [openExerciseIds, setOpenExerciseIds] = useState<string[]>([]);

  const [showNewWorkoutModal, setShowNewWorkoutModal] = useState(false);
  const [newWorkoutTitle, setNewWorkoutTitle] = useState("");
  const [newWorkoutWeekLabel, setNewWorkoutWeekLabel] = useState("");
  const [newWorkoutStartDate, setNewWorkoutStartDate] = useState("");

  const [showRenameWorkoutModal, setShowRenameWorkoutModal] = useState(false);
  const [renameWorkoutTitle, setRenameWorkoutTitle] = useState("");
  const [renameWorkoutWeekLabel, setRenameWorkoutWeekLabel] = useState("");
  const [renameWorkoutStartDate, setRenameWorkoutStartDate] = useState("");

  const [showNewDayModal, setShowNewDayModal] = useState(false);
  const [selectedDayPreset, setSelectedDayPreset] = useState("יום 1");
  const [newDayName, setNewDayName] = useState("");

  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingDayName, setEditingDayName] = useState("");

  const [showExercisePickerModal, setShowExercisePickerModal] = useState(false);
  const [selectedWorkoutDayId, setSelectedWorkoutDayId] = useState<string | null>(
    null
  );
  const [exerciseSearch, setExerciseSearch] = useState("");

  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editingExerciseNotes, setEditingExerciseNotes] = useState("");

  const statusLabel = useMemo(() => {
    if (!client) return "";
    return client.status === "inactive" ? "לא פעילה" : "פעילה";
  }, [client]);

  const activeMenu = useMemo(() => {
    return menuPlans.find((menu) => menu.id === activeMenuId) || null;
  }, [menuPlans, activeMenuId]);

  const activeMenuMeals = useMemo(() => {
    return normalizeMeals(activeMenu?.data);
  }, [activeMenu]);

  const filteredFoods = useMemo(() => {
    const q = foodSearch.trim().toLowerCase();
    if (!q) return foods;
    return foods.filter((food) => food.name.toLowerCase().includes(q));
  }, [foods, foodSearch]);

  const dailySummary = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    activeMenuMeals.forEach((meal) => {
      meal.foods.forEach((item) => {
        calories += Number(item.calories || 0);
        protein += Number(item.protein || 0);
        carbs += Number(item.carbs || 0);
        fat += Number(item.fat || 0);
      });
    });

    return {
      calories: round1(calories),
      protein: round1(protein),
      carbs: round1(carbs),
      fat: round1(fat),
    };
  }, [activeMenuMeals]);

  const activeWorkout = useMemo(() => {
    return workoutPlans.find((plan) => plan.id === activeWorkoutId) || null;
  }, [workoutPlans, activeWorkoutId]);

  const activeWorkoutData = useMemo(() => {
    return normalizeWorkoutData(activeWorkout?.data);
  }, [activeWorkout]);

  const filteredExercises = useMemo(() => {
    const q = exerciseSearch.trim().toLowerCase();
    if (!q) return exerciseBank;
    return exerciseBank.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(q) ||
        exercise.muscleGroup.toLowerCase().includes(q)
    );
  }, [exerciseBank, exerciseSearch]);

  async function loadClient() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      setMessage(`שגיאה בטעינת מתאמנת: ${error.message}`);
      setClient(null);
      setLoading(false);
      return;
    }

    const c = data as Client;
    setClient(c);

    setName(c.name || "");
    setPhone(c.phone || "");
    setGoal(c.goal || "");
    setStartWeight(c.start_weight || "");
    setCurrentWeight(c.current_weight || "");
    setNotes(c.notes || "");
    setMeetingDate(toDatetimeLocal(c.next_meeting));

    setLoading(false);
  }

  async function loadMeasurements() {
    const { data, error } = await supabase
      .from("measurements")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`שגיאה בטעינת מדידות: ${error.message}`);
      setMeasurements([]);
      return;
    }

    setMeasurements((data as Measurement[]) || []);
  }

  async function loadMenuPlans() {
    setLoadingMenus(true);

    const { data, error } = await supabase
      .from("menu_plans")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      setMessage(`שגיאה בטעינת תפריטים: ${error.message}`);
      setMenuPlans([]);
      setLoadingMenus(false);
      return;
    }

    const rows = (data as MenuPlanRow[]) || [];
    setMenuPlans(rows);

    setActiveMenuId((prev) => {
      if (prev && rows.some((row) => row.id === prev)) return prev;
      return rows[0]?.id ?? null;
    });

    setLoadingMenus(false);
  }

  async function loadWorkoutPlans() {
    setLoadingWorkouts(true);

    const { data, error } = await supabase
      .from("workout_plans")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      setMessage(`שגיאה בטעינת אימונים: ${error.message}`);
      setWorkoutPlans([]);
      setLoadingWorkouts(false);
      return;
    }

    const rows = (data as WorkoutPlanRow[]) || [];
    setWorkoutPlans(rows);

    setActiveWorkoutId((prev) => {
      if (prev && rows.some((row) => row.id === prev)) return prev;
      return rows[0]?.id ?? null;
    });

    setLoadingWorkouts(false);
  }

  function loadFoods() {
    try {
      const bank = getFoods();
      setFoods(Array.isArray(bank) ? bank : []);
    } catch {
      setFoods([]);
    }
  }

  function loadExercises() {
    try {
      seedDefaultExercises();
      const bank = getExercises();
      setExerciseBank(Array.isArray(bank) ? bank : []);
    } catch {
      setExerciseBank([]);
    }
  }

  async function saveProfile() {
    if (!client) return;
    if (!name.trim()) {
      setMessage("צריך למלא שם מתאמנת");
      return;
    }

    const { error } = await supabase
      .from("clients")
      .update({
        name: name.trim(),
        phone: phone.trim() || null,
        goal: goal.trim() || null,
        start_weight: startWeight.trim() || null,
        current_weight: currentWeight.trim() || null,
      })
      .eq("id", client.id);

    if (error) {
      setMessage(`שגיאה בשמירת פרטים: ${error.message}`);
      return;
    }

    setMessage("הפרטים נשמרו");
    setEditingProfile(false);
    await loadClient();
  }

  async function saveNotes() {
    if (!client) return;

    const { error } = await supabase
      .from("clients")
      .update({
        notes: notes.trim() || null,
      })
      .eq("id", client.id);

    if (error) {
      setMessage(`שגיאה בשמירת הערות: ${error.message}`);
      return;
    }

    setMessage("ההערות נשמרו");
    setEditingNotes(false);
    await loadClient();
  }

  async function saveMeeting() {
    if (!client) return;

    const { error } = await supabase
      .from("clients")
      .update({
        next_meeting: meetingDate || null,
      })
      .eq("id", client.id);

    if (error) {
      setMessage(`שגיאה בשמירת פגישה: ${error.message}`);
      return;
    }

    setMessage("הפגישה נשמרה");
    setShowMeetingModal(false);
    await loadClient();
  }

  async function clearMeeting() {
    if (!client) return;

    const ok = window.confirm("למחוק את הפגישה הבאה?");
    if (!ok) return;

    const { error } = await supabase
      .from("clients")
      .update({
        next_meeting: null,
      })
      .eq("id", client.id);

    if (error) {
      setMessage(`שגיאה במחיקת פגישה: ${error.message}`);
      return;
    }

    setMessage("הפגישה הוסרה");
    setShowMeetingModal(false);
    await loadClient();
  }

  function resetMeasurementForm() {
    setEditingMeasurementId(null);
    setMeasurementWeight("");
    setMeasurementNeck("");
    setMeasurementChest("");
    setMeasurementWaist("");
    setMeasurementNavel("");
    setMeasurementHip("");
    setMeasurementThigh("");
    setMeasurementBodyFat("");
  }

  function openNewMeasurementModal() {
    resetMeasurementForm();
    setShowMeasurementModal(true);
  }

  function openEditMeasurementModal(measurement: Measurement) {
    setEditingMeasurementId(measurement.id);
    setMeasurementWeight(toInputValue(measurement.weight));
    setMeasurementNeck(toInputValue(measurement.neck));
    setMeasurementChest(toInputValue(measurement.chest));
    setMeasurementWaist(toInputValue(measurement.waist));
    setMeasurementNavel(toInputValue(measurement.navel));
    setMeasurementHip(toInputValue(measurement.hip));
    setMeasurementThigh(toInputValue(measurement.thigh));
    setMeasurementBodyFat(toInputValue(measurement.body_fat));
    setShowMeasurementModal(true);
  }

  function closeMeasurementModal() {
    setShowMeasurementModal(false);
    resetMeasurementForm();
  }

  async function saveMeasurement() {
    if (!client) return;

    const payload = {
      client_id: client.id,
      weight: measurementWeight.trim() ? Number(measurementWeight) : null,
      neck: measurementNeck.trim() ? Number(measurementNeck) : null,
      chest: measurementChest.trim() ? Number(measurementChest) : null,
      waist: measurementWaist.trim() ? Number(measurementWaist) : null,
      navel: measurementNavel.trim() ? Number(measurementNavel) : null,
      hip: measurementHip.trim() ? Number(measurementHip) : null,
      thigh: measurementThigh.trim() ? Number(measurementThigh) : null,
      body_fat: measurementBodyFat.trim() ? Number(measurementBodyFat) : null,
    };

    const hasAnyValue =
      payload.weight !== null ||
      payload.neck !== null ||
      payload.chest !== null ||
      payload.waist !== null ||
      payload.navel !== null ||
      payload.hip !== null ||
      payload.thigh !== null ||
      payload.body_fat !== null;

    if (!hasAnyValue) {
      setMessage("צריך למלא לפחות מדד אחד");
      return;
    }

    if (editingMeasurementId) {
      const { error } = await supabase
        .from("measurements")
        .update(payload)
        .eq("id", editingMeasurementId);

      if (error) {
        setMessage(`שגיאה בעדכון מדידה: ${error.message}`);
        return;
      }

      if (payload.weight !== null) {
        await supabase
          .from("clients")
          .update({ current_weight: String(payload.weight) })
          .eq("id", client.id);
      }

      setMessage("המדידה עודכנה");
    } else {
      const { error } = await supabase.from("measurements").insert([payload]);

      if (error) {
        setMessage(`שגיאה בשמירת מדידה: ${error.message}`);
        return;
      }

      if (payload.weight !== null) {
        await supabase
          .from("clients")
          .update({ current_weight: String(payload.weight) })
          .eq("id", client.id);
      }

      setMessage("המדידה נוספה");
    }

    closeMeasurementModal();
    await loadClient();
    await loadMeasurements();
  }

  async function deleteMeasurement(measurementId: string) {
    const ok = window.confirm("למחוק את המדידה?");
    if (!ok) return;

    const { error } = await supabase
      .from("measurements")
      .delete()
      .eq("id", measurementId);

    if (error) {
      setMessage(`שגיאה במחיקת מדידה: ${error.message}`);
      return;
    }

    setMessage("המדידה נמחקה");
    await loadMeasurements();
  }

  async function createMenuPlan() {
    const title = newMenuTitle.trim();
    if (!title) {
      setMessage("צריך לכתוב שם לתפריט");
      return;
    }

    const { error } = await supabase.from("menu_plans").insert([
      {
        client_id: id,
        title,
        data: [],
      },
    ]);

    if (error) {
      setMessage(`שגיאה ביצירת תפריט: ${error.message}`);
      return;
    }

    setShowNewMenuModal(false);
    setNewMenuTitle("");
    await loadMenuPlans();
    setMessage("התפריט נוצר");
  }

  async function renameActiveMenu() {
    if (!activeMenu) return;

    const title = renameMenuTitle.trim();
    if (!title) {
      setMessage("צריך לכתוב שם לתפריט");
      return;
    }

    const { error } = await supabase
      .from("menu_plans")
      .update({ title })
      .eq("id", activeMenu.id);

    if (error) {
      setMessage(`שגיאה בשינוי שם תפריט: ${error.message}`);
      return;
    }

    setShowRenameMenuModal(false);
    setRenameMenuTitle("");
    await loadMenuPlans();
    setMessage("שם התפריט עודכן");
  }

  async function deleteActiveMenu() {
    if (!activeMenu) return;

    const ok = window.confirm("למחוק את התפריט הזה?");
    if (!ok) return;

    const { error } = await supabase
      .from("menu_plans")
      .delete()
      .eq("id", activeMenu.id);

    if (error) {
      setMessage(`שגיאה במחיקת תפריט: ${error.message}`);
      return;
    }

    await loadMenuPlans();
    setMessage("התפריט נמחק");
  }

  async function saveMealsToActiveMenu(nextMeals: Meal[], successMessage?: string) {
    if (!activeMenu) return;

    const { error } = await supabase
      .from("menu_plans")
      .update({ data: nextMeals })
      .eq("id", activeMenu.id);

    if (error) {
      setMessage(`שגיאה בשמירת תפריט: ${error.message}`);
      return;
    }

    await loadMenuPlans();
    if (successMessage) setMessage(successMessage);
  }

  function toggleMealOpen(mealId: string) {
    setOpenMealIds((prev) =>
      prev.includes(mealId) ? prev.filter((id) => id !== mealId) : [...prev, mealId]
    );
  }

  async function addMeal() {
    const title = newMealName.trim() || selectedMealPreset;
    if (!title) {
      setMessage("צריך לכתוב שם לארוחה");
      return;
    }

    const newMealId = uid();

    const nextMeals: Meal[] = [
      ...activeMenuMeals,
      {
        id: newMealId,
        name: title,
        foods: [],
        note: "",
      },
    ];

    setOpenMealIds((prev) => [...new Set([...prev, newMealId])]);
    setShowNewMealModal(false);
    setNewMealName("");
    setSelectedMealPreset("ארוחת בוקר");
    await saveMealsToActiveMenu(nextMeals, "הארוחה נוספה");
  }

  async function deleteMeal(mealId: string) {
    const ok = window.confirm("למחוק את הארוחה?");
    if (!ok) return;

    const nextMeals = activeMenuMeals.filter((meal) => meal.id !== mealId);
    setOpenMealIds((prev) => prev.filter((id) => id !== mealId));
    await saveMealsToActiveMenu(nextMeals, "הארוחה נמחקה");
  }

  function openEditMealName(meal: Meal) {
    setEditingMealId(meal.id);
    setEditingMealName(meal.name);
  }

  async function saveMealName(mealId: string) {
    const title = editingMealName.trim();
    if (!title) {
      setMessage("צריך לכתוב שם לארוחה");
      return;
    }

    const nextMeals = activeMenuMeals.map((meal) =>
      meal.id === mealId ? { ...meal, name: title } : meal
    );

    setEditingMealId(null);
    setEditingMealName("");
    await saveMealsToActiveMenu(nextMeals, "שם הארוחה עודכן");
  }

  function openEditMealNote(meal: Meal) {
    setEditingMealNoteId(meal.id);
    setEditingMealNote(meal.note || "");
  }

  async function saveMealNote(mealId: string) {
    const nextMeals = activeMenuMeals.map((meal) =>
      meal.id === mealId ? { ...meal, note: editingMealNote } : meal
    );

    setEditingMealNoteId(null);
    setEditingMealNote("");
    await saveMealsToActiveMenu(nextMeals, "ההערה נשמרה");
  }

  function openFoodPicker(mealId: string) {
    setSelectedMealId(mealId);
    setFoodSearch("");
    setShowFoodModal(true);
  }

  function closeFoodPicker() {
    setSelectedMealId(null);
    setFoodSearch("");
    setShowFoodModal(false);
  }

  async function addFoodToMeal(food: FoodItem) {
    if (!selectedMealId) return;

    const amount = 1;
    const macros = calcMacrosByAmount(food, amount);

    const nextMeals = activeMenuMeals.map((meal) => {
      if (meal.id !== selectedMealId) return meal;

      const newItem: MealFoodItem = {
        id: Date.now(),
        foodId: food.id,
        name: food.name,
        category: food.category,
        unitType: food.unitType,
        gramsPerUnit: food.gramsPerUnit,
        amount: "1",
        calories: macros.calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
      };

      return {
        ...meal,
        foods: sortFoods([...meal.foods, newItem]),
      };
    });

    setOpenMealIds((prev) => [...new Set([...prev, selectedMealId])]);
    closeFoodPicker();
    await saveMealsToActiveMenu(nextMeals, "המזון נוסף לארוחה");
  }

  async function updateMealFoodAmount(mealId: string, foodItemId: number, amountText: string) {
    const safeAmount = !amountText.trim() || Number(amountText) <= 0 ? 1 : Number(amountText);

    const nextMeals = activeMenuMeals.map((meal) => {
      if (meal.id !== mealId) return meal;

      const nextFoods = meal.foods.map((foodItem) => {
        if (foodItem.id !== foodItemId) return foodItem;

        const sourceFood = foods.find((food) => food.id === foodItem.foodId);
        if (!sourceFood) {
          return {
            ...foodItem,
            amount: amountText,
          };
        }

        const macros = calcMacrosByAmount(sourceFood, safeAmount);

        return {
          ...foodItem,
          amount: amountText,
          calories: macros.calories,
          protein: macros.protein,
          carbs: macros.carbs,
          fat: macros.fat,
        };
      });

      return {
        ...meal,
        foods: sortFoods(nextFoods),
      };
    });

    await saveMealsToActiveMenu(nextMeals);
  }

  async function deleteMealFood(mealId: string, foodItemId: number) {
    const nextMeals = activeMenuMeals.map((meal) => {
      if (meal.id !== mealId) return meal;

      return {
        ...meal,
        foods: meal.foods.filter((foodItem) => foodItem.id !== foodItemId),
      };
    });

    await saveMealsToActiveMenu(nextMeals, "המזון נמחק מהארוחה");
  }

  async function createWorkoutPlan() {
    const title = newWorkoutTitle.trim();
    if (!title) {
      setMessage("צריך לכתוב שם לתוכנית אימון");
      return;
    }

    const { error } = await supabase.from("workout_plans").insert([
      {
        client_id: id,
        title,
        week_label: newWorkoutWeekLabel.trim() || null,
        start_date: newWorkoutStartDate || null,
        data: { days: [] },
      },
    ]);

    if (error) {
      setMessage(`שגיאה ביצירת תוכנית אימון: ${error.message}`);
      return;
    }

    setShowNewWorkoutModal(false);
    setNewWorkoutTitle("");
    setNewWorkoutWeekLabel("");
    setNewWorkoutStartDate("");
    await loadWorkoutPlans();
    setMessage("תוכנית האימון נוצרה");
  }

  async function renameActiveWorkout() {
    if (!activeWorkout) return;

    const title = renameWorkoutTitle.trim();
    if (!title) {
      setMessage("צריך לכתוב שם לתוכנית אימון");
      return;
    }

    const { error } = await supabase
      .from("workout_plans")
      .update({
        title,
        week_label: renameWorkoutWeekLabel.trim() || null,
        start_date: renameWorkoutStartDate || null,
      })
      .eq("id", activeWorkout.id);

    if (error) {
      setMessage(`שגיאה בעדכון תוכנית אימון: ${error.message}`);
      return;
    }

    setShowRenameWorkoutModal(false);
    setRenameWorkoutTitle("");
    setRenameWorkoutWeekLabel("");
    setRenameWorkoutStartDate("");
    await loadWorkoutPlans();
    setMessage("התוכנית עודכנה");
  }

  async function deleteActiveWorkout() {
    if (!activeWorkout) return;

    const ok = window.confirm("למחוק את תוכנית האימון?");
    if (!ok) return;

    const { error } = await supabase
      .from("workout_plans")
      .delete()
      .eq("id", activeWorkout.id);

    if (error) {
      setMessage(`שגיאה במחיקת תוכנית אימון: ${error.message}`);
      return;
    }

    await loadWorkoutPlans();
    setMessage("תוכנית האימון נמחקה");
  }

  async function saveWorkoutData(nextData: WorkoutPlanData, successMessage?: string) {
    if (!activeWorkout) return;

    const { error } = await supabase
      .from("workout_plans")
      .update({ data: nextData })
      .eq("id", activeWorkout.id);

    if (error) {
      setMessage(`שגיאה בשמירת אימונים: ${error.message}`);
      return;
    }

    await loadWorkoutPlans();
    if (successMessage) setMessage(successMessage);
  }

  function toggleWorkoutDayOpen(dayId: string) {
    setOpenWorkoutDayIds((prev) =>
      prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId]
    );
  }

  function toggleExerciseOpen(exerciseId: string) {
    setOpenExerciseIds((prev) =>
      prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId]
    );
  }

  async function addWorkoutDay() {
    const title = newDayName.trim() || selectedDayPreset;
    if (!title) {
      setMessage("צריך לכתוב שם ליום אימון");
      return;
    }

    const newDayId = uid();

    const nextData: WorkoutPlanData = {
      days: [
        ...activeWorkoutData.days,
        {
          id: newDayId,
          name: title,
          exercises: [],
        },
      ],
    };

    setOpenWorkoutDayIds((prev) => [...new Set([...prev, newDayId])]);
    setShowNewDayModal(false);
    setNewDayName("");
    setSelectedDayPreset("יום 1");
    await saveWorkoutData(nextData, "יום האימון נוסף");
  }

  function openEditDayName(day: WorkoutDay) {
    setEditingDayId(day.id);
    setEditingDayName(day.name);
  }

  async function saveDayName(dayId: string) {
    const title = editingDayName.trim();
    if (!title) {
      setMessage("צריך לכתוב שם ליום אימון");
      return;
    }

    const nextData: WorkoutPlanData = {
      days: activeWorkoutData.days.map((day) =>
        day.id === dayId ? { ...day, name: title } : day
      ),
    };

    setEditingDayId(null);
    setEditingDayName("");
    await saveWorkoutData(nextData, "שם יום האימון עודכן");
  }

  async function deleteWorkoutDay(dayId: string) {
    const ok = window.confirm("למחוק את יום האימון?");
    if (!ok) return;

    const nextData: WorkoutPlanData = {
      days: activeWorkoutData.days.filter((day) => day.id !== dayId),
    };

    setOpenWorkoutDayIds((prev) => prev.filter((id) => id !== dayId));
    await saveWorkoutData(nextData, "יום האימון נמחק");
  }

  function openExercisePicker(dayId: string) {
    setSelectedWorkoutDayId(dayId);
    setExerciseSearch("");
    setShowExercisePickerModal(true);
  }

  function closeExercisePicker() {
    setSelectedWorkoutDayId(null);
    setExerciseSearch("");
    setShowExercisePickerModal(false);
  }

  async function addExerciseToDay(exercise: ExerciseItem) {
    if (!selectedWorkoutDayId) return;

    const newExerciseId = uid();

    const nextData: WorkoutPlanData = {
      days: activeWorkoutData.days.map((day) => {
        if (day.id !== selectedWorkoutDayId) return day;

        const nextExercise: WorkoutExercise = {
          id: newExerciseId,
          exerciseId: exercise.id,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          videoUrl: exercise.videoUrl || "",
          notes: exercise.notes || "",
          sets: [
            {
              id: uid(),
              reps: "",
              weight: "",
              note: "",
            },
          ],
        };

        return {
          ...day,
          exercises: [...day.exercises, nextExercise],
        };
      }),
    };

    setOpenWorkoutDayIds((prev) => [...new Set([...prev, selectedWorkoutDayId])]);
    setOpenExerciseIds((prev) => [...new Set([...prev, newExerciseId])]);
    closeExercisePicker();
    await saveWorkoutData(nextData, "התרגיל נוסף");
  }

  async function deleteExerciseFromDay(dayId: string, exerciseId: string) {
    const nextData: WorkoutPlanData = {
      days: activeWorkoutData.days.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          exercises: day.exercises.filter((exercise) => exercise.id !== exerciseId),
        };
      }),
    };

    setOpenExerciseIds((prev) => prev.filter((id) => id !== exerciseId));
    await saveWorkoutData(nextData, "התרגיל נמחק");
  }

  async function addSetToExercise(dayId: string, exerciseId: string) {
    const nextData: WorkoutPlanData = {
      days: activeWorkoutData.days.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          exercises: day.exercises.map((exercise) => {
            if (exercise.id !== exerciseId) return exercise;
            return {
              ...exercise,
              sets: [
                ...exercise.sets,
                {
                  id: uid(),
                  reps: "",
                  weight: "",
                  note: "",
                },
              ],
            };
          }),
        };
      }),
    };

    await saveWorkoutData(nextData, "סט נוסף");
  }

  async function duplicateLastSet(dayId: string, exerciseId: string) {
    const targetDay = activeWorkoutData.days.find((day) => day.id === dayId);
    const targetExercise = targetDay?.exercises.find((ex) => ex.id === exerciseId);
    const lastSet = targetExercise?.sets[targetExercise.sets.length - 1];

    if (!lastSet) return;

    const nextData: WorkoutPlanData = {
      days: activeWorkoutData.days.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          exercises: day.exercises.map((exercise) => {
            if (exercise.id !== exerciseId) return exercise;
            return {
              ...exercise,
              sets: [
                ...exercise.sets,
                {
                  ...lastSet,
                  id: uid(),
                },
              ],
            };
          }),
        };
      }),
    };

    await saveWorkoutData(nextData, "הסט שוכפל");
  }

  async function deleteSet(dayId: string, exerciseId: string, setId: string) {
    const nextData: WorkoutPlanData = {
      days: activeWorkoutData.days.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          exercises: day.exercises.map((exercise) => {
            if (exercise.id !== exerciseId) return exercise;
            return {
              ...exercise,
              sets: exercise.sets.filter((set) => set.id !== setId),
            };
          }),
        };
      }),
    };

    await saveWorkoutData(nextData);
  }

  async function updateSetField(
    dayId: string,
    exerciseId: string,
    setId: string,
    field: keyof WorkoutSet,
    value: string
  ) {
    const nextData: WorkoutPlanData = {
      days: activeWorkoutData.days.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          exercises: day.exercises.map((exercise) => {
            if (exercise.id !== exerciseId) return exercise;
            return {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? { ...set, [field]: value } : set
              ),
            };
          }),
        };
      }),
    };

    await saveWorkoutData(nextData);
  }

  function openEditExerciseNotes(exercise: WorkoutExercise) {
    setEditingExerciseId(exercise.id);
    setEditingExerciseNotes(exercise.notes || "");
  }

  async function saveExerciseNotes(dayId: string, exerciseId: string) {
    const nextData: WorkoutPlanData = {
      days: activeWorkoutData.days.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          exercises: day.exercises.map((exercise) =>
            exercise.id === exerciseId
              ? { ...exercise, notes: editingExerciseNotes }
              : exercise
          ),
        };
      }),
    };

    setEditingExerciseId(null);
    setEditingExerciseNotes("");
    await saveWorkoutData(nextData, "הערות התרגיל נשמרו");
  }

  async function toggleStatus() {
    if (!client) return;

    const nextStatus = client.status === "inactive" ? "active" : "inactive";
    const confirmText =
      nextStatus === "inactive"
        ? "להעביר את המתאמנת ללא פעילה?"
        : "להחזיר את המתאמנת לפעילות?";

    const ok = window.confirm(confirmText);
    if (!ok) return;

    const { error } = await supabase
      .from("clients")
      .update({ status: nextStatus })
      .eq("id", client.id);

    if (error) {
      setMessage(`שגיאה בעדכון סטטוס: ${error.message}`);
      return;
    }

    setMessage(
      nextStatus === "inactive"
        ? "המתאמנת הועברה ללא פעילה"
        : "המתאמנת חזרה לפעילות"
    );
    await loadClient();
  }

  async function deleteClient() {
    if (!client) return;

    const ok = window.confirm("למחוק את המתאמנת?");
    if (!ok) return;

    const { error } = await supabase.from("clients").delete().eq("id", client.id);

    if (error) {
      setMessage(`שגיאה במחיקה: ${error.message}`);
      return;
    }

    router.push("/dashboard");
  }

  useEffect(() => {
    async function init() {
      await loadClient();
      await loadMeasurements();
      await loadMenuPlans();
      await loadWorkoutPlans();
      loadFoods();
      loadExercises();
    }
    init();
  }, [id]);

  if (loading) {
    return (
      <div dir="rtl" style={pageStyle}>
        <div style={containerStyle}>
          <div style={loadingCardStyle}>טוען...</div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div dir="rtl" style={pageStyle}>
        <div style={containerStyle}>
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>לא נמצאה מתאמנת</div>
            <button style={ghostButtonStyle} onClick={() => router.push("/dashboard")}>
              חזרה לדשבורד
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={pageStyle}>
      <div style={containerStyle}>
        <div style={topActionsStyle}>
          <button style={ghostButtonStyle} onClick={() => router.push("/dashboard")}>
            חזרה לדשבורד
          </button>

          <div style={topActionsRightStyle}>
            <button style={meetingButtonStyle} onClick={() => setShowMeetingModal(true)}>
              פגישה
            </button>

            <button
              style={client.status === "inactive" ? primaryButtonStyle : warnButtonStyle}
              onClick={toggleStatus}
            >
              {client.status === "inactive" ? "החזרה לפעילות" : "ללא פעילה"}
            </button>

            <button style={dangerButtonStyle} onClick={deleteClient}>
              מחיקה
            </button>
          </div>
        </div>

        {message ? <div style={messageStyle}>{message}</div> : null}

        <div style={heroCardStyle}>
          <div>
            <div style={heroNameStyle}>{client.name || "ללא שם"}</div>
            <div style={heroSubStyle}>{client.goal || "מטרה עדיין לא הוזנה"}</div>

            <div style={heroInfoRowStyle}>
              <span style={heroInfoItemStyle}>📞 {client.phone || "אין טלפון"}</span>
              <span style={heroInfoItemStyle}>
                📅 נרשמה: {formatDate(client.created_at)}
              </span>
              <span style={heroInfoItemStyle}>
                📆 פגישה: {formatDateTime(client.next_meeting)}
              </span>
            </div>
          </div>

          <div
            style={
              client.status === "inactive"
                ? statusPillInactiveStyle
                : statusPillActiveStyle
            }
          >
            {statusLabel}
          </div>
        </div>

        <div style={tabsRowStyle}>
          <TabButton label="פרטים כלליים" isActive={activeTab === "general"} onClick={() => setActiveTab("general")} />
          <TabButton label="מדדים" isActive={activeTab === "measurements"} onClick={() => setActiveTab("measurements")} />
          <TabButton label="תפריט" isActive={activeTab === "menu"} onClick={() => setActiveTab("menu")} />
          <TabButton label="אימונים" isActive={activeTab === "workouts"} onClick={() => setActiveTab("workouts")} />
          <TabButton label="תשלומים" isActive={activeTab === "payments"} onClick={() => setActiveTab("payments")} />
          <TabButton label="הערות" isActive={activeTab === "notes"} onClick={() => setActiveTab("notes")} />
        </div>

        {activeTab === "general" && (
          <div style={tabContentCardStyle}>
            <div style={cardHeaderStyle}>
              <div style={sectionTitleStyle}>פרטים כלליים</div>

              {!editingProfile ? (
                <button style={ghostButtonStyle} onClick={() => setEditingProfile(true)}>
                  עריכה
                </button>
              ) : (
                <div style={actionsRowStyle}>
                  <button style={primaryButtonStyle} onClick={saveProfile}>
                    שמירה
                  </button>
                  <button
                    style={ghostButtonStyle}
                    onClick={() => {
                      setEditingProfile(false);
                      setName(client.name || "");
                      setPhone(client.phone || "");
                      setGoal(client.goal || "");
                      setStartWeight(client.start_weight || "");
                      setCurrentWeight(client.current_weight || "");
                    }}
                  >
                    ביטול
                  </button>
                </div>
              )}
            </div>

            {!editingProfile ? (
              <div style={detailsGridStyle}>
                <div style={detailBoxStyle}>
                  <div style={detailLabelStyle}>טלפון</div>
                  <div>{client.phone || "לא הוזן"}</div>
                </div>

                <div style={detailBoxStyle}>
                  <div style={detailLabelStyle}>תאריך הרשמה</div>
                  <div>{formatDate(client.created_at)}</div>
                </div>

                <div style={detailBoxStyle}>
                  <div style={detailLabelStyle}>משקל התחלתי</div>
                  <div>{client.start_weight || "לא הוזן"}</div>
                </div>

                <div style={detailBoxStyle}>
                  <div style={detailLabelStyle}>משקל נוכחי</div>
                  <div>{client.current_weight || "לא הוזן"}</div>
                </div>

                <div style={detailBoxStyle}>
                  <div style={detailLabelStyle}>פגישה הבאה</div>
                  <div>{formatDateTime(client.next_meeting)}</div>
                </div>

                <div style={detailBoxStyle}>
                  <div style={detailLabelStyle}>סטטוס</div>
                  <div>{statusLabel}</div>
                </div>
              </div>
            ) : (
              <div style={formWrapStyle}>
                <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="שם" />
                <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="טלפון" />
                <input style={inputStyle} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="מטרה" />
                <input style={inputStyle} value={startWeight} onChange={(e) => setStartWeight(e.target.value)} placeholder="משקל התחלתי" />
                <input style={inputStyle} value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} placeholder="משקל נוכחי" />
              </div>
            )}
          </div>
        )}

        {activeTab === "measurements" && (
          <div style={tabContentCardStyle}>
            <div style={cardHeaderStyle}>
              <div style={sectionTitleStyle}>מדדים</div>
              <button style={primaryButtonStyle} onClick={openNewMeasurementModal}>
                הוספת מדדים
              </button>
            </div>

            {measurements.length === 0 ? (
              <div style={placeholderBoxStyle}>עדיין לא הוזנו מדדים למתאמנת.</div>
            ) : (
              <div style={measurementsListStyle}>
                {measurements.map((measurement) => (
                  <div key={measurement.id} style={measurementCardStyle}>
                    <div style={measurementCardHeaderStyle}>
                      <div style={measurementDateStyle}>{formatDate(measurement.created_at)}</div>
                      <div style={actionsRowStyle}>
                        <button style={ghostButtonStyle} onClick={() => openEditMeasurementModal(measurement)}>
                          עריכה
                        </button>
                        <button style={dangerButtonStyle} onClick={() => deleteMeasurement(measurement.id)}>
                          מחיקה
                        </button>
                      </div>
                    </div>

                    <div style={chipsWrapStyle}>
                      <Chip label="משקל" value={measurement.weight} />
                      <Chip label="צוואר" value={measurement.neck} />
                      <Chip label="חזה" value={measurement.chest} />
                      <Chip label="מותן" value={measurement.waist} />
                      <Chip label="קו פופיק" value={measurement.navel} />
                      <Chip label="ישבן" value={measurement.hip} />
                      <Chip label="ירך" value={measurement.thigh} />
                      <Chip label="אחוז שומן" value={measurement.body_fat} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "menu" && (
          <div style={tabContentCardStyle}>
            <div style={compactHeaderStyle}>
              <div style={sectionTitleStyle}>תפריט</div>
              <div style={actionsRowStyle}>
                <button style={primaryButtonStyle} onClick={() => setShowNewMenuModal(true)}>
                  תפריט חדש
                </button>
                <button
                  style={ghostButtonStyle}
                  onClick={() => {
                    if (!activeMenu) return;
                    setRenameMenuTitle(activeMenu.title || "");
                    setShowRenameMenuModal(true);
                  }}
                  disabled={!activeMenu}
                >
                  שינוי שם
                </button>
                <button style={dangerButtonStyle} onClick={deleteActiveMenu} disabled={!activeMenu}>
                  מחיקת תפריט
                </button>
              </div>
            </div>

            {loadingMenus ? (
              <div style={placeholderBoxStyle}>טוען תפריטים...</div>
            ) : (
              <>
                <div style={menuTabsWrapStyle}>
                  {menuPlans.map((menu) => (
                    <button
                      key={menu.id}
                      onClick={() => setActiveMenuId(menu.id)}
                      style={{
                        ...menuTabButtonStyle,
                        ...(menu.id === activeMenuId ? activeMenuTabButtonStyle : {}),
                      }}
                    >
                      {menu.title || "ללא שם"}
                    </button>
                  ))}
                </div>

                {!activeMenu ? (
                  <div style={placeholderBoxStyle}>עדיין אין תפריטים למתאמנת.</div>
                ) : (
                  <>
                    <div style={summaryGridStyle}>
                      <div style={summaryCardStyle}>
                        <div style={summaryLabelStyle}>קלוריות</div>
                        <div style={summaryValueStyle}>{dailySummary.calories}</div>
                      </div>
                      <div style={summaryCardStyle}>
                        <div style={summaryLabelStyle}>חלבון</div>
                        <div style={summaryValueStyle}>{dailySummary.protein}</div>
                      </div>
                      <div style={summaryCardStyle}>
                        <div style={summaryLabelStyle}>פחמימה</div>
                        <div style={summaryValueStyle}>{dailySummary.carbs}</div>
                      </div>
                      <div style={summaryCardStyle}>
                        <div style={summaryLabelStyle}>שומן</div>
                        <div style={summaryValueStyle}>{dailySummary.fat}</div>
                      </div>
                    </div>

                    <div style={compactHeaderStyle}>
                      <div style={sectionTitleStyle}>ארוחות</div>
                      <button style={primaryButtonStyle} onClick={() => setShowNewMealModal(true)}>
                        הוספת ארוחה
                      </button>
                    </div>

                    {activeMenuMeals.length === 0 ? (
                      <div style={placeholderBoxStyle}>עדיין לא נוספו ארוחות לתפריט הזה.</div>
                    ) : (
                      <div style={mealsWrapStyle}>
                        {activeMenuMeals.map((meal) => {
                          const isOpen = openMealIds.includes(meal.id);
                          const sortedMealFoods = sortFoods(meal.foods);

                          return (
                            <div key={meal.id} style={mealCardStyle}>
                              <div style={mealHeaderStyle}>
                                <div style={{ flex: 1, minWidth: 180 }}>
                                  {editingMealId === meal.id ? (
                                    <div style={actionsRowStyle}>
                                      <input
                                        style={{ ...smallInputStyle, marginBottom: 0 }}
                                        value={editingMealName}
                                        onChange={(e) => setEditingMealName(e.target.value)}
                                        placeholder="שם ארוחה"
                                      />
                                      <button style={primaryButtonStyle} onClick={() => saveMealName(meal.id)}>
                                        שמירה
                                      </button>
                                      <button
                                        style={ghostButtonStyle}
                                        onClick={() => {
                                          setEditingMealId(null);
                                          setEditingMealName("");
                                        }}
                                      >
                                        ביטול
                                      </button>
                                    </div>
                                  ) : (
                                    <button onClick={() => toggleMealOpen(meal.id)} style={mealTitleButtonStyle}>
                                      {meal.name}
                                    </button>
                                  )}
                                </div>

                                <div style={actionsRowStyle}>
                                  <button style={ghostButtonStyle} onClick={() => openEditMealName(meal)}>
                                    שינוי שם
                                  </button>
                                  <button style={ghostButtonStyle} onClick={() => openFoodPicker(meal.id)}>
                                    הוספת מזון
                                  </button>
                                  <button style={dangerButtonStyle} onClick={() => deleteMeal(meal.id)}>
                                    מחיקת ארוחה
                                  </button>
                                </div>
                              </div>

                              {isOpen && (
                                <div style={mealBodyStyle}>
                                  <div style={mealSectionStyle}>
                                    <div style={mealSectionHeaderStyle}>
                                      <div style={mealSectionTitleStyle}>הערה לארוחה</div>
                                      {editingMealNoteId === meal.id ? (
                                        <div style={actionsRowStyle}>
                                          <button style={primaryButtonStyle} onClick={() => saveMealNote(meal.id)}>
                                            שמירה
                                          </button>
                                          <button
                                            style={ghostButtonStyle}
                                            onClick={() => {
                                              setEditingMealNoteId(null);
                                              setEditingMealNote("");
                                            }}
                                          >
                                            ביטול
                                          </button>
                                        </div>
                                      ) : (
                                        <button style={ghostButtonStyle} onClick={() => openEditMealNote(meal)}>
                                          עריכת הערה
                                        </button>
                                      )}
                                    </div>

                                    {editingMealNoteId === meal.id ? (
                                      <textarea
                                        style={smallTextAreaStyle}
                                        value={editingMealNote}
                                        onChange={(e) => setEditingMealNote(e.target.value)}
                                        placeholder="כתבי הערה לארוחה"
                                      />
                                    ) : (
                                      <div style={noteBoxStyle}>{meal.note?.trim() ? meal.note : "אין הערה לארוחה"}</div>
                                    )}
                                  </div>

                                  <div style={mealSectionStyle}>
                                    <div style={mealSectionTitleStyle}>מזונות</div>

                                    {sortedMealFoods.length === 0 ? (
                                      <div style={emptyMealStyle}>עדיין לא נוספו מזונות לארוחה הזו.</div>
                                    ) : (
                                      <div style={foodsListStyle}>
                                        {sortedMealFoods.map((foodItem) => (
                                          <div key={foodItem.id} style={foodItemCardStyle}>
                                            <div style={foodItemTopStyle}>
                                              <div>
                                                <div style={foodItemNameStyle}>{foodItem.name}</div>
                                                <div style={foodItemMetaStyle}>
                                                  {categoryLabel(foodItem.category)} · {unitTypeLabel(foodItem.unitType)}
                                                  {foodItem.gramsPerUnit ? ` · ${foodItem.gramsPerUnit} גרם` : ""}
                                                </div>
                                              </div>

                                              <button
                                                style={dangerMiniButtonStyle}
                                                onClick={() => deleteMealFood(meal.id, foodItem.id)}
                                              >
                                                מחיקה
                                              </button>
                                            </div>

                                            <div style={mealFoodControlRowStyle}>
                                              <label style={controlLabelStyle}>כמות</label>
                                              <input
                                                type="number"
                                                step="0.5"
                                                min="0.5"
                                                value={foodItem.amount}
                                                onChange={(e) =>
                                                  updateMealFoodAmount(meal.id, foodItem.id, e.target.value)
                                                }
                                                style={amountInputStyle}
                                              />
                                            </div>

                                            <div style={chipsWrapStyle}>
                                              <Chip label="קלוריות" value={foodItem.calories} />
                                              <Chip label="חלבון" value={foodItem.protein} />
                                              <Chip label="פחמימה" value={foodItem.carbs} />
                                              <Chip label="שומן" value={foodItem.fat} />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "workouts" && (
          <div style={tabContentCardStyle}>
            <div style={compactHeaderStyle}>
              <div style={sectionTitleStyle}>אימונים</div>
              <div style={actionsRowStyle}>
                <button style={primaryButtonStyle} onClick={() => setShowNewWorkoutModal(true)}>
                  תוכנית חדשה
                </button>
                <button
                  style={ghostButtonStyle}
                  onClick={() => {
                    if (!activeWorkout) return;
                    setRenameWorkoutTitle(activeWorkout.title || "");
                    setRenameWorkoutWeekLabel(activeWorkout.week_label || "");
                    setRenameWorkoutStartDate(activeWorkout.start_date || "");
                    setShowRenameWorkoutModal(true);
                  }}
                  disabled={!activeWorkout}
                >
                  עריכת כותרת
                </button>
                <button
                  style={dangerButtonStyle}
                  onClick={deleteActiveWorkout}
                  disabled={!activeWorkout}
                >
                  מחיקת תוכנית
                </button>
              </div>
            </div>

            {loadingWorkouts ? (
              <div style={placeholderBoxStyle}>טוען תוכניות אימון...</div>
            ) : (
              <>
                <div style={menuTabsWrapStyle}>
                  {workoutPlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setActiveWorkoutId(plan.id)}
                      style={{
                        ...menuTabButtonStyle,
                        ...(plan.id === activeWorkoutId ? activeMenuTabButtonStyle : {}),
                      }}
                    >
                      {plan.title || "ללא שם"}
                    </button>
                  ))}
                </div>

                {!activeWorkout ? (
                  <div style={placeholderBoxStyle}>עדיין אין תוכניות אימון למתאמנת.</div>
                ) : (
                  <>
                    <div style={workoutMetaCardStyle}>
                      <div style={workoutMetaItemStyle}>
                        <div style={detailLabelStyle}>שם תוכנית</div>
                        <div>{activeWorkout.title || "ללא שם"}</div>
                      </div>
                      <div style={workoutMetaItemStyle}>
                        <div style={detailLabelStyle}>שבוע / בלוק</div>
                        <div>{activeWorkout.week_label || "לא הוזן"}</div>
                      </div>
                      <div style={workoutMetaItemStyle}>
                        <div style={detailLabelStyle}>תאריך התחלה</div>
                        <div>{activeWorkout.start_date || "לא הוזן"}</div>
                      </div>
                    </div>

                    <div style={compactHeaderStyle}>
                      <div style={sectionTitleStyle}>ימי אימון</div>
                      <button style={primaryButtonStyle} onClick={() => setShowNewDayModal(true)}>
                        הוספת יום
                      </button>
                    </div>

                    {activeWorkoutData.days.length === 0 ? (
                      <div style={placeholderBoxStyle}>עדיין לא נוספו ימים לתוכנית הזו.</div>
                    ) : (
                      <div style={mealsWrapStyle}>
                        {activeWorkoutData.days.map((day) => {
                          const dayOpen = openWorkoutDayIds.includes(day.id);

                          return (
                            <div key={day.id} style={mealCardStyle}>
                              <div style={mealHeaderStyle}>
                                <div style={{ flex: 1, minWidth: 180 }}>
                                  {editingDayId === day.id ? (
                                    <div style={actionsRowStyle}>
                                      <input
                                        style={{ ...smallInputStyle, marginBottom: 0 }}
                                        value={editingDayName}
                                        onChange={(e) => setEditingDayName(e.target.value)}
                                        placeholder="שם יום"
                                      />
                                      <button style={primaryButtonStyle} onClick={() => saveDayName(day.id)}>
                                        שמירה
                                      </button>
                                      <button
                                        style={ghostButtonStyle}
                                        onClick={() => {
                                          setEditingDayId(null);
                                          setEditingDayName("");
                                        }}
                                      >
                                        ביטול
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => toggleWorkoutDayOpen(day.id)}
                                      style={mealTitleButtonStyle}
                                    >
                                      {day.name}
                                    </button>
                                  )}
                                </div>

                                <div style={actionsRowStyle}>
                                  <button style={ghostButtonStyle} onClick={() => openEditDayName(day)}>
                                    שינוי שם
                                  </button>
                                  <button style={ghostButtonStyle} onClick={() => openExercisePicker(day.id)}>
                                    הוספת תרגיל
                                  </button>
                                  <button style={dangerButtonStyle} onClick={() => deleteWorkoutDay(day.id)}>
                                    מחיקת יום
                                  </button>
                                </div>
                              </div>

                              {dayOpen && (
                                <div style={mealBodyStyle}>
                                  {day.exercises.length === 0 ? (
                                    <div style={emptyMealStyle}>עדיין לא נוספו תרגילים ליום הזה.</div>
                                  ) : (
                                    <div style={foodsListStyle}>
                                      {day.exercises.map((exercise) => {
                                        const exerciseOpen = openExerciseIds.includes(exercise.id);

                                        return (
                                          <div key={exercise.id} style={exerciseCardStyle}>
                                            <div style={exerciseHeaderStyle}>
                                              <button
                                                style={exerciseTitleButtonStyle}
                                                onClick={() => toggleExerciseOpen(exercise.id)}
                                              >
                                                {exercise.name}
                                              </button>

                                              <div style={actionsRowStyle}>
                                                <button
                                                  style={ghostButtonStyle}
                                                  onClick={() => openEditExerciseNotes(exercise)}
                                                >
                                                  הערות
                                                </button>
                                                <button
                                                  style={ghostButtonStyle}
                                                  onClick={() => addSetToExercise(day.id, exercise.id)}
                                                >
                                                  הוספת סט
                                                </button>
                                                <button
                                                  style={ghostButtonStyle}
                                                  onClick={() => duplicateLastSet(day.id, exercise.id)}
                                                >
                                                  שכפול סט
                                                </button>
                                                <button
                                                  style={dangerButtonStyle}
                                                  onClick={() => deleteExerciseFromDay(day.id, exercise.id)}
                                                >
                                                  מחיקת תרגיל
                                                </button>
                                              </div>
                                            </div>

                                            <div style={exerciseMetaStyle}>
                                              {exercise.muscleGroup || ""}
                                            </div>

                                            {exerciseOpen && (
                                              <div style={exerciseBodyStyle}>
                                                {editingExerciseId === exercise.id ? (
                                                  <div style={mealSectionStyle}>
                                                    <div style={mealSectionHeaderStyle}>
                                                      <div style={mealSectionTitleStyle}>הערות לתרגיל</div>
                                                      <div style={actionsRowStyle}>
                                                        <button
                                                          style={primaryButtonStyle}
                                                          onClick={() => saveExerciseNotes(day.id, exercise.id)}
                                                        >
                                                          שמירה
                                                        </button>
                                                        <button
                                                          style={ghostButtonStyle}
                                                          onClick={() => {
                                                            setEditingExerciseId(null);
                                                            setEditingExerciseNotes("");
                                                          }}
                                                        >
                                                          ביטול
                                                        </button>
                                                      </div>
                                                    </div>

                                                    <textarea
                                                      style={smallTextAreaStyle}
                                                      value={editingExerciseNotes}
                                                      onChange={(e) => setEditingExerciseNotes(e.target.value)}
                                                      placeholder="כתבי הערות לתרגיל"
                                                    />
                                                  </div>
                                                ) : exercise.notes ? (
                                                  <div style={exerciseNotesBoxStyle}>{exercise.notes}</div>
                                                ) : null}

                                                <div style={setsWrapStyle}>
                                                  {exercise.sets.map((set, index) => (
                                                    <div key={set.id} style={setRowStyle}>
                                                      <div style={setIndexStyle}>סט {index + 1}</div>

                                                      <input
                                                        style={smallSetInputStyle}
                                                        value={set.reps}
                                                        onChange={(e) =>
                                                          updateSetField(day.id, exercise.id, set.id, "reps", e.target.value)
                                                        }
                                                        placeholder="חזרות"
                                                      />

                                                      <input
                                                        style={smallSetInputStyle}
                                                        value={set.weight}
                                                        onChange={(e) =>
                                                          updateSetField(day.id, exercise.id, set.id, "weight", e.target.value)
                                                        }
                                                        placeholder="משקל"
                                                      />

                                                      <input
                                                        style={largeSetInputStyle}
                                                        value={set.note}
                                                        onChange={(e) =>
                                                          updateSetField(day.id, exercise.id, set.id, "note", e.target.value)
                                                        }
                                                        placeholder="הערה לסט"
                                                      />

                                                      <button
                                                        style={dangerMiniButtonStyle}
                                                        onClick={() => deleteSet(day.id, exercise.id, set.id)}
                                                      >
                                                        מחיקת סט
                                                      </button>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div style={tabContentCardStyle}>
            <div style={sectionTitleStyle}>תשלומים</div>
            <div style={placeholderBoxStyle}>כאן יוצג מצב התשלום, תאריכים ותזכורות.</div>
          </div>
        )}

        {activeTab === "notes" && (
          <div style={tabContentCardStyle}>
            <div style={cardHeaderStyle}>
              <div style={sectionTitleStyle}>הערות</div>

              {!editingNotes ? (
                <button style={ghostButtonStyle} onClick={() => setEditingNotes(true)}>
                  עריכה
                </button>
              ) : (
                <div style={actionsRowStyle}>
                  <button style={primaryButtonStyle} onClick={saveNotes}>
                    שמירה
                  </button>
                  <button
                    style={ghostButtonStyle}
                    onClick={() => {
                      setEditingNotes(false);
                      setNotes(client.notes || "");
                    }}
                  >
                    ביטול
                  </button>
                </div>
              )}
            </div>

            {!editingNotes ? (
              <div style={notesBoxStyle}>{client.notes || "אין הערות כרגע"}</div>
            ) : (
              <textarea
                style={textAreaStyle}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="כתבי כאן הערות על המתאמנת"
              />
            )}
          </div>
        )}
      </div>

      {showMeetingModal && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalTitleStyle}>קביעת פגישה</div>
            <div style={modalSubtitleStyle}>{client.name || "מתאמנת"}</div>

            <input
              type="datetime-local"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              style={inputStyle}
            />

            <div style={stickyModalActionsStyle}>
              <button style={primaryButtonStyle} onClick={saveMeeting}>
                שמירת פגישה
              </button>
              <button style={ghostButtonStyle} onClick={clearMeeting}>
                מחיקת פגישה
              </button>
              <button
                style={ghostButtonStyle}
                onClick={() => {
                  setShowMeetingModal(false);
                  setMeetingDate(toDatetimeLocal(client.next_meeting));
                }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {showMeasurementModal && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalTitleStyle}>
              {editingMeasurementId ? "עריכת מדדים" : "הוספת מדדים"}
            </div>
            <div style={modalSubtitleStyle}>{client.name || "מתאמנת"}</div>

            <input style={inputStyle} value={measurementWeight} onChange={(e) => setMeasurementWeight(e.target.value)} placeholder="משקל" type="number" step="0.1" />
            <input style={inputStyle} value={measurementNeck} onChange={(e) => setMeasurementNeck(e.target.value)} placeholder="צוואר" type="number" step="0.1" />
            <input style={inputStyle} value={measurementChest} onChange={(e) => setMeasurementChest(e.target.value)} placeholder="חזה" type="number" step="0.1" />
            <input style={inputStyle} value={measurementWaist} onChange={(e) => setMeasurementWaist(e.target.value)} placeholder="מותן" type="number" step="0.1" />
            <input style={inputStyle} value={measurementNavel} onChange={(e) => setMeasurementNavel(e.target.value)} placeholder="קו פופיק" type="number" step="0.1" />
            <input style={inputStyle} value={measurementHip} onChange={(e) => setMeasurementHip(e.target.value)} placeholder="ישבן" type="number" step="0.1" />
            <input style={inputStyle} value={measurementThigh} onChange={(e) => setMeasurementThigh(e.target.value)} placeholder="ירך" type="number" step="0.1" />
            <input style={inputStyle} value={measurementBodyFat} onChange={(e) => setMeasurementBodyFat(e.target.value)} placeholder="אחוז שומן" type="number" step="0.1" />

            <div style={stickyModalActionsStyle}>
              <button style={primaryButtonStyle} onClick={saveMeasurement}>
                {editingMeasurementId ? "שמירת שינויים" : "שמירת מדדים"}
              </button>
              <button style={ghostButtonStyle} onClick={closeMeasurementModal}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewMenuModal && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalTitleStyle}>תפריט חדש</div>
            <input
              style={inputStyle}
              value={newMenuTitle}
              onChange={(e) => setNewMenuTitle(e.target.value)}
              placeholder="שם התפריט"
            />

            <div style={stickyModalActionsStyle}>
              <button style={primaryButtonStyle} onClick={createMenuPlan}>
                יצירת תפריט
              </button>
              <button
                style={ghostButtonStyle}
                onClick={() => {
                  setShowNewMenuModal(false);
                  setNewMenuTitle("");
                }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {showRenameMenuModal && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalTitleStyle}>שינוי שם תפריט</div>
            <input
              style={inputStyle}
              value={renameMenuTitle}
              onChange={(e) => setRenameMenuTitle(e.target.value)}
              placeholder="שם חדש לתפריט"
            />

            <div style={stickyModalActionsStyle}>
              <button style={primaryButtonStyle} onClick={renameActiveMenu}>
                שמירה
              </button>
              <button
                style={ghostButtonStyle}
                onClick={() => {
                  setShowRenameMenuModal(false);
                  setRenameMenuTitle("");
                }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewMealModal && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalTitleStyle}>הוספת ארוחה</div>

            <div style={presetWrapStyle}>
              {MEAL_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setSelectedMealPreset(preset);
                    setNewMealName("");
                  }}
                  style={{
                    ...presetButtonStyle,
                    ...(selectedMealPreset === preset && !newMealName.trim()
                      ? activePresetButtonStyle
                      : {}),
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            <input
              style={inputStyle}
              value={newMealName}
              onChange={(e) => setNewMealName(e.target.value)}
              placeholder="או שם חופשי לארוחה"
            />

            <div style={stickyModalActionsStyle}>
              <button style={primaryButtonStyle} onClick={addMeal}>
                הוספת ארוחה
              </button>
              <button
                style={ghostButtonStyle}
                onClick={() => {
                  setShowNewMealModal(false);
                  setNewMealName("");
                  setSelectedMealPreset("ארוחת בוקר");
                }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {showFoodModal && (
        <div style={modalOverlayStyle}>
          <div style={wideModalCardStyle}>
            <div style={modalTitleStyle}>הוספת מזון לארוחה</div>

            <input
              style={inputStyle}
              value={foodSearch}
              onChange={(e) => setFoodSearch(e.target.value)}
              placeholder="חיפוש מזון"
            />

            <div style={foodListStyle}>
              {filteredFoods.length === 0 ? (
                <div style={emptyMealStyle}>לא נמצאו מזונות במאגר</div>
              ) : (
                filteredFoods.map((food) => (
                  <div key={food.id} style={foodBankRowStyle}>
                    <div>
                      <div style={foodBankNameStyle}>{food.name}</div>
                      <div style={foodBankMetaStyle}>
                        {categoryLabel(food.category)} · {unitTypeLabel(food.unitType)}
                        {food.gramsPerUnit ? ` · ${food.gramsPerUnit} גרם` : ""}
                      </div>
                    </div>

                    <button style={primaryButtonStyle} onClick={() => addFoodToMeal(food)}>
                      הוספה
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={stickyModalActionsStyle}>
              <button style={ghostButtonStyle} onClick={closeFoodPicker}>
                סגירה
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewWorkoutModal && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalTitleStyle}>תוכנית אימון חדשה</div>

            <input
              style={inputStyle}
              value={newWorkoutTitle}
              onChange={(e) => setNewWorkoutTitle(e.target.value)}
              placeholder="שם התוכנית"
            />
            <input
              style={inputStyle}
              value={newWorkoutWeekLabel}
              onChange={(e) => setNewWorkoutWeekLabel(e.target.value)}
              placeholder="שבוע / בלוק"
            />
            <input
              type="date"
              style={inputStyle}
              value={newWorkoutStartDate}
              onChange={(e) => setNewWorkoutStartDate(e.target.value)}
            />

            <div style={stickyModalActionsStyle}>
              <button style={primaryButtonStyle} onClick={createWorkoutPlan}>
                יצירת תוכנית
              </button>
              <button
                style={ghostButtonStyle}
                onClick={() => {
                  setShowNewWorkoutModal(false);
                  setNewWorkoutTitle("");
                  setNewWorkoutWeekLabel("");
                  setNewWorkoutStartDate("");
                }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {showRenameWorkoutModal && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalTitleStyle}>עריכת תוכנית אימון</div>

            <input
              style={inputStyle}
              value={renameWorkoutTitle}
              onChange={(e) => setRenameWorkoutTitle(e.target.value)}
              placeholder="שם התוכנית"
            />
            <input
              style={inputStyle}
              value={renameWorkoutWeekLabel}
              onChange={(e) => setRenameWorkoutWeekLabel(e.target.value)}
              placeholder="שבוע / בלוק"
            />
            <input
              type="date"
              style={inputStyle}
              value={renameWorkoutStartDate}
              onChange={(e) => setRenameWorkoutStartDate(e.target.value)}
            />

            <div style={stickyModalActionsStyle}>
              <button style={primaryButtonStyle} onClick={renameActiveWorkout}>
                שמירה
              </button>
              <button
                style={ghostButtonStyle}
                onClick={() => {
                  setShowRenameWorkoutModal(false);
                  setRenameWorkoutTitle("");
                  setRenameWorkoutWeekLabel("");
                  setRenameWorkoutStartDate("");
                }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewDayModal && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalTitleStyle}>הוספת יום אימון</div>

            <div style={presetWrapStyle}>
              {DAY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setSelectedDayPreset(preset);
                    setNewDayName("");
                  }}
                  style={{
                    ...presetButtonStyle,
                    ...(selectedDayPreset === preset && !newDayName.trim()
                      ? activePresetButtonStyle
                      : {}),
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            <input
              style={inputStyle}
              value={newDayName}
              onChange={(e) => setNewDayName(e.target.value)}
              placeholder="או שם חופשי ליום"
            />

            <div style={stickyModalActionsStyle}>
              <button style={primaryButtonStyle} onClick={addWorkoutDay}>
                הוספת יום
              </button>
              <button
                style={ghostButtonStyle}
                onClick={() => {
                  setShowNewDayModal(false);
                  setNewDayName("");
                  setSelectedDayPreset("יום 1");
                }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {showExercisePickerModal && (
        <div style={modalOverlayStyle}>
          <div style={wideModalCardStyle}>
            <div style={modalTitleStyle}>הוספת תרגיל ליום</div>

            <input
              style={inputStyle}
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              placeholder="חיפוש תרגיל"
            />

            <div style={foodListStyle}>
              {filteredExercises.length === 0 ? (
                <div style={emptyMealStyle}>לא נמצאו תרגילים</div>
              ) : (
                filteredExercises.map((exercise) => (
                  <div key={exercise.id} style={foodBankRowStyle}>
                    <div>
                      <div style={foodBankNameStyle}>{exercise.name}</div>
                      <div style={foodBankMetaStyle}>{exercise.muscleGroup}</div>
                    </div>

                    <button style={primaryButtonStyle} onClick={() => addExerciseToDay(exercise)}>
                      הוספה
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={stickyModalActionsStyle}>
              <button style={ghostButtonStyle} onClick={closeExercisePicker}>
                סגירה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#fcf7f4",
  padding: 18,
  fontFamily: "Arial, sans-serif",
  color: "#2b2b2b",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const loadingCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 18,
  padding: 20,
};

const topActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 12,
};

const topActionsRightStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const heroCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 20,
  padding: 18,
  marginBottom: 14,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 14,
  flexWrap: "wrap",
};

const heroNameStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 800,
  lineHeight: 1.1,
};

const heroSubStyle: React.CSSProperties = {
  color: "#777",
  marginTop: 6,
  fontSize: 15,
};

const heroInfoRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 12,
  color: "#555",
};

const heroInfoItemStyle: React.CSSProperties = {
  background: "#fcf7f4",
  borderRadius: 999,
  padding: "7px 10px",
  fontSize: 13,
};

const statusPillActiveStyle: React.CSSProperties = {
  background: "#e9f8ee",
  color: "#1f7a3d",
  borderRadius: 999,
  padding: "8px 12px",
  fontWeight: 700,
  fontSize: 13,
};

const statusPillInactiveStyle: React.CSSProperties = {
  background: "#fff0e6",
  color: "#a85a1b",
  borderRadius: 999,
  padding: "8px 12px",
  fontWeight: 700,
  fontSize: 13,
};

const tabsRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 14,
};

const tabButtonStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e7ddd6",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14,
};

const activeTabButtonStyle: React.CSSProperties = {
  background: "#e88f6f",
  color: "#fff",
  border: "1px solid #e88f6f",
};

const tabContentCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 20,
  padding: 16,
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 20,
  padding: 16,
};

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 12,
};

const compactHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 10,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
};

const detailsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
};

const detailBoxStyle: React.CSSProperties = {
  background: "#fcf7f4",
  borderRadius: 14,
  padding: 12,
};

const detailLabelStyle: React.CSSProperties = {
  color: "#777",
  fontSize: 12,
  marginBottom: 6,
};

const placeholderBoxStyle: React.CSSProperties = {
  minHeight: 160,
  background: "#fcf7f4",
  borderRadius: 14,
  padding: 14,
  color: "#666",
  lineHeight: 1.6,
  fontSize: 14,
};

const notesBoxStyle: React.CSSProperties = {
  minHeight: 180,
  background: "#fcf7f4",
  borderRadius: 14,
  padding: 14,
  lineHeight: 1.7,
  whiteSpace: "pre-wrap",
};

const formWrapStyle: React.CSSProperties = {
  maxWidth: 700,
};

const messageStyle: React.CSSProperties = {
  marginBottom: 12,
  padding: 10,
  borderRadius: 10,
  background: "#f7efe9",
  fontSize: 14,
};

const measurementsListStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const measurementCardStyle: React.CSSProperties = {
  background: "#fcf7f4",
  borderRadius: 14,
  padding: 14,
};

const measurementCardHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 10,
};

const measurementDateStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 14,
};

const chipsWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const chipStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  border: "1px solid #eee",
  display: "flex",
  gap: 5,
  alignItems: "center",
};

const chipLabelStyle: React.CSSProperties = {
  color: "#777",
};

const menuTabsWrapStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 12,
};

const menuTabButtonStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  padding: "8px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13,
};

const activeMenuTabButtonStyle: React.CSSProperties = {
  background: "#f4e5de",
  border: "1px solid #e4b9a7",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 8,
  marginBottom: 12,
};

const summaryCardStyle: React.CSSProperties = {
  background: "#fcf7f4",
  borderRadius: 12,
  padding: 10,
};

const summaryLabelStyle: React.CSSProperties = {
  color: "#777",
  fontSize: 12,
  marginBottom: 4,
};

const summaryValueStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
};

const mealsWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const mealCardStyle: React.CSSProperties = {
  background: "#fcf7f4",
  borderRadius: 14,
  padding: 12,
};

const mealHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 10,
  flexWrap: "wrap",
};

const mealTitleButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  cursor: "pointer",
  textAlign: "right",
};

const mealBodyStyle: React.CSSProperties = {
  marginTop: 10,
  display: "grid",
  gap: 10,
};

const mealSectionStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: 12,
};

const mealSectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 8,
};

const mealSectionTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
};

const noteBoxStyle: React.CSSProperties = {
  color: "#666",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
  fontSize: 14,
};

const smallTextAreaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 80,
  padding: 10,
  borderRadius: 10,
  border: "1px solid #ddd",
  direction: "rtl",
  resize: "vertical",
  fontFamily: "Arial, sans-serif",
};

const emptyMealStyle: React.CSSProperties = {
  background: "#fcf7f4",
  borderRadius: 10,
  padding: 10,
  color: "#777",
  fontSize: 14,
};

const foodsListStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const foodItemCardStyle: React.CSSProperties = {
  background: "#fcf7f4",
  borderRadius: 12,
  padding: 12,
};

const foodItemTopStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 8,
};

const foodItemNameStyle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 16,
};

const foodItemMetaStyle: React.CSSProperties = {
  color: "#777",
  fontSize: 12,
  marginTop: 4,
};

const mealFoodControlRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 8,
};

const controlLabelStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 13,
};

const amountInputStyle: React.CSSProperties = {
  width: 80,
  padding: 8,
  borderRadius: 10,
  border: "1px solid #ddd",
  direction: "rtl",
};

const workoutMetaCardStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
  marginBottom: 12,
};

const workoutMetaItemStyle: React.CSSProperties = {
  background: "#fcf7f4",
  borderRadius: 12,
  padding: 10,
};

const exerciseCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: 12,
};

const exerciseHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

const exerciseTitleButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  margin: 0,
  fontSize: 16,
  fontWeight: 800,
  cursor: "pointer",
  textAlign: "right",
};

const exerciseMetaStyle: React.CSSProperties = {
  color: "#777",
  fontSize: 12,
  marginTop: 4,
};

const exerciseBodyStyle: React.CSSProperties = {
  marginTop: 10,
  display: "grid",
  gap: 10,
};

const exerciseNotesBoxStyle: React.CSSProperties = {
  background: "#fcf7f4",
  borderRadius: 10,
  padding: 10,
  fontSize: 14,
  whiteSpace: "pre-wrap",
};

const setsWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const setRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "80px 100px 100px 1fr auto",
  gap: 8,
  alignItems: "center",
  background: "#fcf7f4",
  borderRadius: 10,
  padding: 8,
};

const setIndexStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 13,
};

const smallSetInputStyle: React.CSSProperties = {
  width: "100%",
  padding: 8,
  borderRadius: 8,
  border: "1px solid #ddd",
  direction: "rtl",
  fontSize: 13,
};

const largeSetInputStyle: React.CSSProperties = {
  width: "100%",
  padding: 8,
  borderRadius: 8,
  border: "1px solid #ddd",
  direction: "rtl",
  fontSize: 13,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 10,
  marginBottom: 10,
  borderRadius: 10,
  border: "1px solid #ddd",
  direction: "rtl",
  fontSize: 14,
};

const smallInputStyle: React.CSSProperties = {
  width: 220,
  padding: 9,
  borderRadius: 10,
  border: "1px solid #ddd",
  direction: "rtl",
  fontSize: 14,
};

const textAreaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 180,
  padding: 10,
  borderRadius: 10,
  border: "1px solid #ddd",
  direction: "rtl",
  resize: "vertical",
  fontFamily: "Arial, sans-serif",
};

const actionsRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const primaryButtonStyle: React.CSSProperties = {
  background: "#e88f6f",
  color: "#fff",
  border: "none",
  padding: "9px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13,
};

const ghostButtonStyle: React.CSSProperties = {
  background: "#fff",
  color: "#333",
  border: "1px solid #ddd",
  padding: "9px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13,
};

const dangerMiniButtonStyle: React.CSSProperties = {
  background: "#fff",
  color: "#c44",
  border: "1px solid #f0d4d4",
  padding: "7px 10px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 12,
};

const meetingButtonStyle: React.CSSProperties = {
  background: "#f59e0b",
  color: "#fff",
  border: "none",
  padding: "9px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13,
};

const warnButtonStyle: React.CSSProperties = {
  background: "#f2ad59",
  color: "#fff",
  border: "none",
  padding: "9px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13,
};

const dangerButtonStyle: React.CSSProperties = {
  background: "#d9534f",
  color: "#fff",
  border: "none",
  padding: "9px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13,
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
  overflowY: "auto",
};

const modalCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 18,
  padding: 18,
  width: "100%",
  maxWidth: 420,
  maxHeight: "85vh",
  overflowY: "auto",
};

const wideModalCardStyle: React.CSSProperties = {
  ...modalCardStyle,
  maxWidth: 760,
};

const modalTitleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  marginBottom: 6,
};

const modalSubtitleStyle: React.CSSProperties = {
  color: "#777",
  marginBottom: 12,
  fontSize: 14,
};

const stickyModalActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  position: "sticky",
  bottom: 0,
  background: "#fff",
  paddingTop: 10,
};

const foodListStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  maxHeight: "50vh",
  overflowY: "auto",
};

const foodBankRowStyle: React.CSSProperties = {
  background: "#fcf7f4",
  borderRadius: 12,
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

const foodBankNameStyle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 15,
};

const foodBankMetaStyle: React.CSSProperties = {
  color: "#777",
  fontSize: 12,
  marginTop: 4,
};

const presetWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginBottom: 10,
};

const presetButtonStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13,
};

const activePresetButtonStyle: React.CSSProperties = {
  background: "#f4e5de",
  border: "1px solid #e4b9a7",
};