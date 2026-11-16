import type { SQLiteDatabase } from "expo-sqlite";

import type { Backup } from "@/backup";

import { listGroceryItems } from "./grocery";
import { listRecipes } from "./recipes";

/** Everything the app stores, as a backup file's contents. */
export async function buildBackup(db: SQLiteDatabase): Promise<Backup> {
  const [recipes, groceryItems, meals] = await Promise.all([
    listRecipes(db),
    listGroceryItems(db),
    db.getAllAsync<{ date: string; sourceUrl: string }>(
      `SELECT m.date, r.sourceUrl FROM meal_plan m JOIN recipes r ON r.id = m.recipeId ORDER BY m.date, m.id`,
    ),
  ]);
  return {
    app: "recipes-app",
    version: 1,
    exportedAt: new Date().toISOString(),
    recipes: recipes.map((recipe) => ({
      sourceUrl: recipe.sourceUrl,
      name: recipe.name,
      image: recipe.image,
      recipeYield: recipe.recipeYield,
      totalTime: recipe.totalTime,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      favourite: recipe.favourite,
      tags: recipe.tags,
      createdAt: recipe.createdAt,
    })),
    groceryItems: groceryItems.map(({ name, qty, unit, checked }) => ({ name, qty, unit, checked })),
    meals,
  };
}

export type RestoreResult = {
  recipesAdded: number;
  /** Recipes already in the app (same page), left as they are. */
  recipesSkipped: number;
  mealsAdded: number;
  groceryItemsAdded: number;
};

const groceryKey = (item: { name: string; qty?: number | null; unit?: string | null }) =>
  `${item.name.trim().toLowerCase()}|${item.unit ?? ""}|${item.qty ?? ""}`;

/**
 * Adds what is in a backup to the app. Nothing already here is changed or removed: recipes are matched
 * by their page address and skipped when present, and meals and grocery lines already there are not repeated.
 */
export async function restoreBackup(db: SQLiteDatabase, backup: Backup): Promise<RestoreResult> {
  const result: RestoreResult = { recipesAdded: 0, recipesSkipped: 0, mealsAdded: 0, groceryItemsAdded: 0 };

  await db.withTransactionAsync(async () => {
    for (const recipe of backup.recipes) {
      const existing = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM recipes WHERE sourceUrl = ?",
        recipe.sourceUrl,
      );
      if (existing) {
        result.recipesSkipped += 1;
        continue;
      }
      await db.runAsync(
        `INSERT INTO recipes (sourceUrl, name, image, recipeYield, totalTime, ingredients, steps, favourite, tags, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        recipe.sourceUrl,
        recipe.name,
        recipe.image ?? null,
        recipe.recipeYield ?? null,
        recipe.totalTime ?? null,
        JSON.stringify(recipe.ingredients),
        JSON.stringify(recipe.steps),
        recipe.favourite ? 1 : 0,
        JSON.stringify(recipe.tags),
        recipe.createdAt,
      );
      result.recipesAdded += 1;
    }

    for (const meal of backup.meals) {
      const recipe = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM recipes WHERE sourceUrl = ?",
        meal.sourceUrl,
      );
      if (!recipe) continue;
      const duplicate = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM meal_plan WHERE date = ? AND recipeId = ?",
        meal.date,
        recipe.id,
      );
      if (duplicate) continue;
      await db.runAsync(
        "INSERT INTO meal_plan (date, recipeId, createdAt) VALUES (?, ?, ?)",
        meal.date,
        recipe.id,
        Date.now(),
      );
      result.mealsAdded += 1;
    }

    const have = new Set((await listGroceryItems(db)).map(groceryKey));
    for (const item of backup.groceryItems) {
      if (have.has(groceryKey(item))) continue;
      have.add(groceryKey(item));
      await db.runAsync(
        "INSERT INTO grocery_items (name, qty, unit, checked, createdAt) VALUES (?, ?, ?, ?, ?)",
        item.name,
        item.qty ?? null,
        item.unit ?? null,
        item.checked ? 1 : 0,
        Date.now(),
      );
      result.groceryItemsAdded += 1;
    }
  });

  return result;
}
