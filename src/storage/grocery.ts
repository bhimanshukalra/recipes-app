import type { SQLiteDatabase } from "expo-sqlite";

import { planAdd, type GroceryDraft, type GroceryItem } from "@/grocery";

type GroceryRow = { id: number; name: string; qty: number | null; unit: string | null; checked: number };

function fromRow(row: GroceryRow): GroceryItem {
  return {
    id: row.id,
    name: row.name,
    qty: row.qty ?? undefined,
    unit: row.unit ?? undefined,
    checked: row.checked === 1,
  };
}

/** Items in the order they were added. */
export async function listGroceryItems(db: SQLiteDatabase): Promise<GroceryItem[]> {
  const rows = await db.getAllAsync<GroceryRow>(
    "SELECT id, name, qty, unit, checked FROM grocery_items ORDER BY id",
  );
  return rows.map(fromRow);
}

/** Adds items, merging amounts into matching lines that are not ticked off yet. */
export async function addToGroceryList(db: SQLiteDatabase, drafts: GroceryDraft[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    const { updates, inserts } = planAdd(await listGroceryItems(db), drafts);
    for (const update of updates) {
      await db.runAsync("UPDATE grocery_items SET qty = ? WHERE id = ?", update.qty, update.id);
    }
    for (const draft of inserts) {
      await db.runAsync(
        "INSERT INTO grocery_items (name, qty, unit, checked, createdAt) VALUES (?, ?, ?, 0, ?)",
        draft.name,
        draft.qty ?? null,
        draft.unit ?? null,
        Date.now(),
      );
    }
  });
}

export async function setGroceryItemChecked(db: SQLiteDatabase, id: number, checked: boolean): Promise<void> {
  await db.runAsync("UPDATE grocery_items SET checked = ? WHERE id = ?", checked ? 1 : 0, id);
}

export async function deleteGroceryItem(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync("DELETE FROM grocery_items WHERE id = ?", id);
}

export async function clearCheckedGroceryItems(db: SQLiteDatabase): Promise<void> {
  await db.runAsync("DELETE FROM grocery_items WHERE checked = 1");
}
