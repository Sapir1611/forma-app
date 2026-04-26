"use client";

import { useEffect, useState } from "react";
import {
  getFoods,
  addFood,
  deleteFood,
  FoodItem,
  FoodCategory,
  FoodUnitType,
  unitTypeLabel,
  categoryLabel,
} from "@/lib/storage";

export default function FoodPage() {
  const [foods, setFoods] = useState<FoodItem[]>([]);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<FoodCategory>("protein");
  const [unitType, setUnitType] = useState<FoodUnitType>("unit");
  const [gramsPerUnit, setGramsPerUnit] = useState("");

  const [calcMode, setCalcMode] = useState<"per100g" | "perUnit">("per100g");

  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  function load() {
    setFoods(getFoods());
  }

  useEffect(() => {
    load();
  }, []);

  function handleAddFood() {
    if (!name.trim()) return alert("חייב שם מזון");

    addFood({
      name,
      category,
      unitType,
      gramsPerUnit,
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
    });

    setName("");
    setGramsPerUnit("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");

    load();
  }

  return (
    <div style={{ padding: 24, direction: "rtl" }}>
      <h1>מאגר מזון</h1>

      {/* הוספת מזון */}
      <div style={{ background: "#fff", padding: 20, borderRadius: 16, marginBottom: 20 }}>
        <h3>הוספת מזון</h3>

        <input
          placeholder="שם המזון"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={input}
        />

        {/* קטגוריה */}
        <select value={category} onChange={(e) => setCategory(e.target.value as any)} style={input}>
          <option value="protein">חלבון</option>
          <option value="carb">פחמימה</option>
          <option value="fat">שומן</option>
          <option value="vegetable">ירק</option>
          <option value="fruit">פרי</option>
        </select>

        {/* סוג מדידה */}
        <select value={unitType} onChange={(e) => setUnitType(e.target.value as any)} style={input}>
          <option value="unit">יחידה</option>
          <option value="100g">100 גרם</option>
          <option value="tbsp">כף</option>
          <option value="tsp">כפית</option>
          <option value="cup">כוס</option>
          <option value="half_cup">חצי כוס</option>
          <option value="slice">פרוסה</option>
          <option value="container">גביע</option>
        </select>

        {/* גרם ליחידה */}
        <input
          placeholder="כמה גרם ביחידה (למשל כף = 15)"
          value={gramsPerUnit}
          onChange={(e) => setGramsPerUnit(e.target.value)}
          style={input}
        />

        {/* בחירת שיטת חישוב */}
        <div style={{ marginBottom: 10 }}>
          <label>
            <input
              type="radio"
              checked={calcMode === "per100g"}
              onChange={() => setCalcMode("per100g")}
            />
            לפי 100 גרם
          </label>

          <label style={{ marginRight: 20 }}>
            <input
              type="radio"
              checked={calcMode === "perUnit"}
              onChange={() => setCalcMode("perUnit")}
            />
            לפי יחידה
          </label>
        </div>

        <input
          placeholder={calcMode === "per100g" ? "קלוריות ל-100 גרם" : "קלוריות ליחידה"}
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          style={input}
        />

        <input
          placeholder={calcMode === "per100g" ? "חלבון ל-100 גרם" : "חלבון ליחידה"}
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
          style={input}
        />

        <input
          placeholder={calcMode === "per100g" ? "פחמימה ל-100 גרם" : "פחמימה ליחידה"}
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
          style={input}
        />

        <input
          placeholder={calcMode === "per100g" ? "שומן ל-100 גרם" : "שומן ליחידה"}
          value={fat}
          onChange={(e) => setFat(e.target.value)}
          style={input}
        />

        <button onClick={handleAddFood} style={btn}>
          הוספה
        </button>
      </div>

      {/* רשימה */}
      {foods.map((food) => (
        <div key={food.id} style={card}>
          <div>
            <b>{food.name}</b>
            <div>{categoryLabel(food.category)}</div>
            <div>{unitTypeLabel(food.unitType)}</div>
          </div>

          <button onClick={() => { deleteFood(food.id); load(); }} style={deleteBtn}>
            מחיקה
          </button>
        </div>
      ))}
    </div>
  );
}

const input = {
  display: "block",
  width: "100%",
  marginBottom: 10,
  padding: 10,
  borderRadius: 10,
  border: "1px solid #ddd",
};

const btn = {
  padding: 12,
  background: "#e88f6f",
  color: "#fff",
  border: "none",
  borderRadius: 10,
};

const deleteBtn = {
  background: "red",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: 8,
};

const card = {
  background: "#fff",
  padding: 12,
  borderRadius: 12,
  marginBottom: 10,
  display: "flex",
  justifyContent: "space-between",
};