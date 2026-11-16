import type { SQLiteDatabase } from "expo-sqlite";

import { parseIngredient } from "@/ingredients";

export const DATABASE_NAME = "recipes.db";

/** Bump when the schema or the stored data format changes, and add a migration block below. */
const DATABASE_VERSION = 4;

function parseJson<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

/** Pass to `SQLiteProvider`'s `onInit`. Uses `PRAGMA user_version` to track the schema. */
export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) return;

  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sourceUrl TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        image TEXT,
        recipeYield TEXT,
        totalTime TEXT,
        ingredients TEXT NOT NULL,
        steps TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );
      CREATE INDEX recipes_createdAt ON recipes (createdAt DESC);
    `);
  }

  if (currentVersion < 3) {
    // Versions 2 and 3: ingredients are parsed into qty / unit / name, and the parser
    // was improved. Parse every saved line again from `raw`, which is kept on each line.
    // Bump DATABASE_VERSION to re-run this after changing the parser.
    const rows = await db.getAllAsync<{ id: number; ingredients: string }>(
      "SELECT id, ingredients FROM recipes",
    );
    await db.withTransactionAsync(async () => {
      for (const row of rows) {
        const lines = parseJson<{ raw?: unknown }[]>(row.ingredients, []);
        const parsed = lines
          .filter((line): line is { raw: string } => typeof line.raw === "string")
          .map((line) => parseIngredient(line.raw));
        await db.runAsync("UPDATE recipes SET ingredients = ? WHERE id = ?", JSON.stringify(parsed), row.id);
      }
    });
  }

  if (currentVersion < 4) {
    // Version 4: favourites and tags. Existing recipes start as not favourite, with no tags.
    await db.execAsync(`
      ALTER TABLE recipes ADD COLUMN favourite INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE recipes ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';
    `);
  }

  // Future migrations: add `if (currentVersion < 5) { ... }` blocks here.

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
