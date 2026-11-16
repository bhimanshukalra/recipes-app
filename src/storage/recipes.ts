import type { SQLiteDatabase } from "expo-sqlite";

import type { Ingredient, NewRecipe, Recipe } from "./types";

type RecipeRow = {
  id: number;
  sourceUrl: string;
  name: string;
  image: string | null;
  recipeYield: string | null;
  totalTime: string | null;
  ingredients: string;
  steps: string;
  favourite: number;
  tags: string;
  createdAt: number;
};

function parseJson<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

function fromRow(row: RecipeRow): Recipe {
  return {
    id: row.id,
    sourceUrl: row.sourceUrl,
    name: row.name,
    image: row.image ?? undefined,
    recipeYield: row.recipeYield ?? undefined,
    totalTime: row.totalTime ?? undefined,
    ingredients: parseJson<Ingredient[]>(row.ingredients, []),
    steps: parseJson<string[]>(row.steps, []),
    favourite: row.favourite === 1,
    tags: parseJson<string[]>(row.tags, []),
    createdAt: row.createdAt,
  };
}

/**
 * Saves a recipe. If one with the same `sourceUrl` exists, it is updated in place
 * (keeping its id and `createdAt`), so sharing the same page twice leaves one entry.
 */
export async function saveRecipe(db: SQLiteDatabase, recipe: NewRecipe): Promise<Recipe> {
  await db.runAsync(
    `INSERT INTO recipes
       (sourceUrl, name, image, recipeYield, totalTime, ingredients, steps, createdAt)
     VALUES
       ($sourceUrl, $name, $image, $recipeYield, $totalTime, $ingredients, $steps, $createdAt)
     ON CONFLICT(sourceUrl) DO UPDATE SET
       name = excluded.name,
       image = excluded.image,
       recipeYield = excluded.recipeYield,
       totalTime = excluded.totalTime,
       ingredients = excluded.ingredients,
       steps = excluded.steps`,
    {
      $sourceUrl: recipe.sourceUrl,
      $name: recipe.name,
      $image: recipe.image ?? null,
      $recipeYield: recipe.recipeYield ?? null,
      $totalTime: recipe.totalTime ?? null,
      $ingredients: JSON.stringify(recipe.ingredients),
      $steps: JSON.stringify(recipe.steps),
      $createdAt: Date.now(),
    },
  );
  const saved = await getRecipeBySourceUrl(db, recipe.sourceUrl);
  if (!saved) throw new Error("Recipe was not saved");
  return saved;
}

/** All recipes, newest first. */
export async function listRecipes(db: SQLiteDatabase): Promise<Recipe[]> {
  const rows = await db.getAllAsync<RecipeRow>(
    "SELECT * FROM recipes ORDER BY createdAt DESC, id DESC",
  );
  return rows.map(fromRow);
}

export async function getRecipe(db: SQLiteDatabase, id: number): Promise<Recipe | null> {
  const row = await db.getFirstAsync<RecipeRow>("SELECT * FROM recipes WHERE id = ?", id);
  return row ? fromRow(row) : null;
}

export async function getRecipeBySourceUrl(
  db: SQLiteDatabase,
  sourceUrl: string,
): Promise<Recipe | null> {
  const row = await db.getFirstAsync<RecipeRow>(
    "SELECT * FROM recipes WHERE sourceUrl = ?",
    sourceUrl,
  );
  return row ? fromRow(row) : null;
}

/** Returns true if a recipe was deleted. */
export async function deleteRecipe(db: SQLiteDatabase, id: number): Promise<boolean> {
  // Planned meals point at the recipe, so they go with it.
  await db.runAsync("DELETE FROM meal_plan WHERE recipeId = ?", id);
  const result = await db.runAsync("DELETE FROM recipes WHERE id = ?", id);
  return result.changes > 0;
}

/** Marks a recipe as a favourite, or not. */
export async function setFavourite(db: SQLiteDatabase, id: number, favourite: boolean): Promise<void> {
  await db.runAsync("UPDATE recipes SET favourite = ? WHERE id = ?", favourite ? 1 : 0, id);
}

/** Replaces a recipe's tags. Callers pass them already normalised (see `normaliseTag`). */
export async function setTags(db: SQLiteDatabase, id: number, tags: string[]): Promise<void> {
  await db.runAsync("UPDATE recipes SET tags = ? WHERE id = ?", JSON.stringify(tags), id);
}
