import type { SQLiteDatabase } from "expo-sqlite";

import type { DateKey } from "@/planner";

import type { Ingredient } from "./types";

/** A recipe planned for a day. */
export type Meal = {
  id: number;
  date: DateKey;
  recipeId: number;
  name: string;
  image?: string;
};

type MealRow = { id: number; date: string; recipeId: number; name: string; image: string | null };

/** Meals from `from` to `to` (both included), earliest day first. */
export async function listMeals(db: SQLiteDatabase, from: DateKey, to: DateKey): Promise<Meal[]> {
  const rows = await db.getAllAsync<MealRow>(
    `SELECT m.id, m.date, m.recipeId, r.name, r.image
       FROM meal_plan m JOIN recipes r ON r.id = m.recipeId
      WHERE m.date >= ? AND m.date <= ?
      ORDER BY m.date, m.id`,
    from,
    to,
  );
  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    recipeId: row.recipeId,
    name: row.name,
    image: row.image ?? undefined,
  }));
}

export async function addMeal(db: SQLiteDatabase, date: DateKey, recipeId: number): Promise<void> {
  await db.runAsync(
    "INSERT INTO meal_plan (date, recipeId, createdAt) VALUES (?, ?, ?)",
    date,
    recipeId,
    Date.now(),
  );
}

export async function removeMeal(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync("DELETE FROM meal_plan WHERE id = ?", id);
}

/** The ingredients of every planned meal in a range, one recipe's lines per meal. */
export async function listMealIngredients(
  db: SQLiteDatabase,
  from: DateKey,
  to: DateKey,
): Promise<Ingredient[]> {
  const rows = await db.getAllAsync<{ ingredients: string }>(
    `SELECT r.ingredients FROM meal_plan m JOIN recipes r ON r.id = m.recipeId
      WHERE m.date >= ? AND m.date <= ? ORDER BY m.date, m.id`,
    from,
    to,
  );
  return rows.flatMap((row) => {
    try {
      return JSON.parse(row.ingredients) as Ingredient[];
    } catch {
      return [];
    }
  });
}
