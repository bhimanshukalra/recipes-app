import type { Ingredient } from "@/ingredients";

import type { GroceryDraft, GroceryItem } from "./types";

/** Turn parsed ingredient lines into things to buy. A range ("2-3") buys the upper end. */
export function toDrafts(ingredients: Ingredient[]): GroceryDraft[] {
  const drafts: GroceryDraft[] = [];
  for (const line of ingredients) {
    const name = (line.name ?? line.raw).trim();
    if (!name) continue;
    const qty = line.qtyMax ?? line.qty;
    drafts.push({ name, qty, unit: qty === undefined ? undefined : line.unit });
  }
  return drafts;
}

// Words that describe an ingredient without changing what to buy.
const FILLER = new Set(["large", "medium", "small", "big", "fresh", "ripe", "very"]);

/** Lines are the same product when this matches: "Eggs" and "egg" are one thing. */
export function itemKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((word) => !FILLER.has(word))
    .map((word) => (word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word))
    .join(" ");
}

export type AddPlan = {
  /** Existing items whose amount grows. */
  updates: { id: number; qty: number }[];
  /** New lines to add. */
  inserts: GroceryDraft[];
};

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Work out how to add `drafts` to the list: 2 eggs + 3 eggs becomes 5 eggs. Lines merge only when
 * the name and the unit match (1 cup flour and 200 g flour stay separate), and never into an item
 * that is already ticked off. A line with no amount joins a matching line with no amount.
 */
export function planAdd(items: GroceryItem[], drafts: GroceryDraft[]): AddPlan {
  type Slot = { id?: number; draft: GroceryDraft; changed: boolean };
  const slots: Slot[] = items
    .filter((item) => !item.checked)
    .map((item) => ({ id: item.id, draft: { name: item.name, qty: item.qty, unit: item.unit }, changed: false }));

  for (const draft of drafts) {
    const key = itemKey(draft.name);
    const match = slots.find(
      (slot) =>
        itemKey(slot.draft.name) === key &&
        slot.draft.unit === draft.unit &&
        (slot.draft.qty === undefined) === (draft.qty === undefined),
    );
    if (!match) {
      slots.push({ draft: { ...draft }, changed: true });
    } else if (draft.qty !== undefined && match.draft.qty !== undefined) {
      match.draft.qty = round(match.draft.qty + draft.qty);
      match.changed = true;
    }
  }

  return {
    updates: slots.flatMap((slot) =>
      slot.id !== undefined && slot.changed && slot.draft.qty !== undefined
        ? [{ id: slot.id, qty: slot.draft.qty }]
        : [],
    ),
    inserts: slots.filter((slot) => slot.id === undefined).map((slot) => slot.draft),
  };
}
