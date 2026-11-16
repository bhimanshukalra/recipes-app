import type { SQLiteDatabase } from "expo-sqlite";

export const DATABASE_NAME = "recipes.db";

/** Bump when the schema changes, and add a migration block below. */
const DATABASE_VERSION = 1;

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

  // Future migrations: add `if (currentVersion <= 1) { ... }` blocks here.

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
