/// <reference types="node" />
import assert from "node:assert/strict";
import { test } from "node:test";

import { itemKey, planAdd, toDrafts } from "./merge.ts";
import type { GroceryItem } from "./types.ts";

const item = (id: number, name: string, qty?: number, unit?: string, checked = false): GroceryItem => ({
  id,
  name,
  qty,
  unit,
  checked,
});

test("2 eggs plus 3 eggs becomes 5 eggs", () => {
  const plan = planAdd([item(1, "eggs", 2)], [{ name: "egg", qty: 3 }]);
  assert.deepEqual(plan, { updates: [{ id: 1, qty: 5 }], inserts: [] });
});

test("different units stay separate", () => {
  const plan = planAdd([item(1, "flour", 1, "cup")], [{ name: "flour", qty: 200, unit: "g" }]);
  assert.deepEqual(plan.updates, []);
  assert.deepEqual(plan.inserts, [{ name: "flour", qty: 200, unit: "g" }]);
});

test("the same unit adds up, with rounding", () => {
  const plan = planAdd([item(1, "milk", 0.1, "l")], [{ name: "Milk", qty: 0.2, unit: "l" }]);
  assert.deepEqual(plan.updates, [{ id: 1, qty: 0.3 }]);
});

test("lines with no amount are not repeated", () => {
  const plan = planAdd([item(1, "salt")], [{ name: "salt" }]);
  assert.deepEqual(plan, { updates: [], inserts: [] });
});

test("an amount and a no-amount line stay separate", () => {
  const plan = planAdd([item(1, "salt")], [{ name: "salt", qty: 1, unit: "tsp" }]);
  assert.equal(plan.inserts.length, 1);
});

test("ticked items are not merged into", () => {
  const plan = planAdd([item(1, "eggs", 2, undefined, true)], [{ name: "eggs", qty: 3 }]);
  assert.deepEqual(plan, { updates: [], inserts: [{ name: "eggs", qty: 3 }] });
});

test("repeated lines in one recipe merge with each other", () => {
  const plan = planAdd([], [{ name: "onion", qty: 1 }, { name: "onions", qty: 2 }]);
  assert.deepEqual(plan.inserts, [{ name: "onion", qty: 3 }]);
});

test("toDrafts uses the upper end of a range and falls back to raw", () => {
  const drafts = toDrafts([
    { raw: "2-3 tbsp oil", qty: 2, qtyMax: 3, unit: "tbsp", name: "oil" },
    { raw: "A good loaf" },
    { raw: "Salt", name: "Salt" },
  ]);
  assert.deepEqual(drafts, [
    { name: "oil", qty: 3, unit: "tbsp" },
    { name: "A good loaf", qty: undefined, unit: undefined },
    { name: "Salt", qty: undefined, unit: undefined },
  ]);
});

test("itemKey ignores case and simple plurals but not words like glass", () => {
  assert.equal(itemKey("Eggs"), itemKey("egg"));
  assert.equal(itemKey("  Red   Onions "), "red onion");
  assert.equal(itemKey("glass"), "glass");
  assert.equal(itemKey("2 large eggs".replace("2 ", "")), itemKey("eggs"));
});
