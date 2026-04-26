export type FoodCategory = "protein" | "carb" | "fat" | "vegetable" | "fruit";

export type FoodUnitType =
  | "unit"
  | "100g"
  | "tbsp"
  | "tsp"
  | "cup"
  | "half_cup"
  | "slice"
  | "container";

export type FoodItem = {
  id: number;
  name: string;
  category: FoodCategory;
  unitType: FoodUnitType;
  gramsPerUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type ExerciseItem = {
  id: number;
  name: string;
  muscleGroup: string;
  videoLink?: string;
  notes?: string;
};

const FOODS_KEY = "forma_foods";
const EXERCISES_KEY = "forma_exercises";

function isBrowser() {
  return typeof window !== "undefined";
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function unitTypeLabel(unitType: FoodUnitType) {
  switch (unitType) {
    case "unit":
      return "יחידה";
    case "100g":
      return "100 גרם";
    case "tbsp":
      return "כף";
    case "tsp":
      return "כפית";
    case "cup":
      return "כוס";
    case "half_cup":
      return "חצי כוס";
    case "slice":
      return "פרוסה";
    case "container":
      return "גביע";
    default:
      return unitType;
  }
}

export function categoryLabel(category: FoodCategory) {
  switch (category) {
    case "protein":
      return "חלבון";
    case "carb":
      return "פחמימה";
    case "fat":
      return "שומן";
    case "vegetable":
      return "ירק";
    case "fruit":
      return "פרי";
    default:
      return category;
  }
}

export function getFoods(): FoodItem[] {
  if (!isBrowser()) return [];

  const foods = safeParse<FoodItem[]>(localStorage.getItem(FOODS_KEY), []);
  return Array.isArray(foods) ? foods : [];
}

export function saveFoods(foods: FoodItem[]) {
  if (!isBrowser()) return;
  localStorage.setItem(FOODS_KEY, JSON.stringify(foods));
}

export function addFood(food: Omit<FoodItem, "id">): FoodItem {
  const foods = getFoods();

  const newFood: FoodItem = {
    id: Date.now(),
    name: food.name,
    category: food.category,
    unitType: food.unitType,
    gramsPerUnit: food.gramsPerUnit,
    calories: Number(food.calories || 0),
    protein: Number(food.protein || 0),
    carbs: Number(food.carbs || 0),
    fat: Number(food.fat || 0),
  };

  const nextFoods = [...foods, newFood];
  saveFoods(nextFoods);

  return newFood;
}

export function updateFood(updatedFood: FoodItem) {
  const foods = getFoods();

  const nextFoods = foods.map((food) =>
    food.id === updatedFood.id
      ? {
          ...updatedFood,
          calories: Number(updatedFood.calories || 0),
          protein: Number(updatedFood.protein || 0),
          carbs: Number(updatedFood.carbs || 0),
          fat: Number(updatedFood.fat || 0),
        }
      : food
  );

  saveFoods(nextFoods);
}

export function deleteFood(foodId: number) {
  const foods = getFoods();
  const nextFoods = foods.filter((food) => food.id !== foodId);
  saveFoods(nextFoods);
}

export function getFoodById(foodId: number): FoodItem | undefined {
  return getFoods().find((food) => food.id === foodId);
}

export function getExercises(): ExerciseItem[] {
  if (!isBrowser()) return [];

  const exercises = safeParse<ExerciseItem[]>(
    localStorage.getItem(EXERCISES_KEY),
    []
  );

  return Array.isArray(exercises) ? exercises : [];
}

export function saveExercises(exercises: ExerciseItem[]) {
  if (!isBrowser()) return;
  localStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));
}

export function addExercise(exercise: Omit<ExerciseItem, "id">): ExerciseItem {
  const exercises = getExercises();

  const newExercise: ExerciseItem = {
    id: Date.now(),
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    videoLink: exercise.videoLink || "",
    notes: exercise.notes || "",
  };

  const nextExercises = [...exercises, newExercise];
  saveExercises(nextExercises);

  return newExercise;
}

export function updateExercise(updatedExercise: ExerciseItem) {
  const exercises = getExercises();

  const nextExercises = exercises.map((exercise) =>
    exercise.id === updatedExercise.id ? updatedExercise : exercise
  );

  saveExercises(nextExercises);
}

export function deleteExercise(exerciseId: number) {
  const exercises = getExercises();
  const nextExercises = exercises.filter(
    (exercise) => exercise.id !== exerciseId
  );
  saveExercises(nextExercises);
}

export function seedDefaultExercises() {
  const existing = getExercises();
  if (existing.length > 0) return;

  const defaults: ExerciseItem[] = [
    { id: 1, name: "היפ טראסט", muscleGroup: "ישבן" },
    { id: 2, name: "בולגריאן ספליט סקוואט", muscleGroup: "ישבן / רגליים" },
    { id: 3, name: "סקוואט", muscleGroup: "רגליים" },
    { id: 4, name: "לאנג' רוורס", muscleGroup: "ישבן / רגליים" },
    { id: 5, name: "רומניאן דדליפט", muscleGroup: "ירך אחורית / ישבן" },
    { id: 6, name: "קיקבק", muscleGroup: "ישבן" },
    { id: 7, name: "דונקי קיק", muscleGroup: "ישבן" },
    { id: 8, name: "לאט פולדאון", muscleGroup: "גב" },
    { id: 9, name: "חתירה", muscleGroup: "גב" },
    { id: 10, name: "לחיצת כתפיים", muscleGroup: "כתפיים" },
    { id: 11, name: "הרחקת כתף לצדדים", muscleGroup: "כתפיים" },
    { id: 12, name: "פשיטת מרפקים", muscleGroup: "יד אחורית" },
    { id: 13, name: "לחיצת רגליים", muscleGroup: "רגליים" },
    { id: 14, name: "כפיפת ברך", muscleGroup: "ירך אחורית" },
    { id: 15, name: "פשיטת ברך", muscleGroup: "ארבע ראשי" },
  ];

  saveExercises(defaults);
}

// ================= CLIENTS =================

export type Client = {
  id: number;
  firstName: string;
  lastName: string;
  status?: string;

  phone?: string;
  goal?: string;
  startWeight?: string;
  currentWeight?: string;

  nextMeeting?: string;
  nextMeetingTime?: string;

  nextPaymentDate?: string;
  lastPaymentDate?: string;
  paymentAmount?: string;
  paymentReminderDismissed?: boolean;
  showPaymentReminder?: boolean;

  showClientWeight?: boolean;
  showClientMeasurements?: boolean;

  measurementHistory?: {
    measurements: Record<string, string>;
  }[];

  dailyData?: any;
  notes?: string;
};

const CLIENTS_KEY = "forma_clients";

export function getClients(): Client[] {
  if (!isBrowser()) return [];

  const clients = safeParse<Client[]>(
    localStorage.getItem(CLIENTS_KEY),
    []
  );

  return Array.isArray(clients) ? clients : [];
}

export function saveClients(clients: Client[]) {
  if (!isBrowser()) return;
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

// ================= MENU =================

export type MealFoodItem = {
  foodId: number;
  quantity: number;
};

export type Meal = {
  id: number;
  name: string;
  foods: MealFoodItem[];
  note?: string;
};

export type MenuPlan = {
  id: number;
  title: string;
  meals: Meal[];
};

const MENUS_KEY = "forma_menus";

export function getMenus(): MenuPlan[] {
  if (!isBrowser()) return [];

  const menus = safeParse<MenuPlan[]>(
    localStorage.getItem(MENUS_KEY),
    []
  );

  return Array.isArray(menus) ? menus : [];
}

export function saveMenus(menus: MenuPlan[]) {
  if (!isBrowser()) return;
  localStorage.setItem(MENUS_KEY, JSON.stringify(menus));
}