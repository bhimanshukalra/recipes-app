/// <reference types="node" />
import assert from "node:assert/strict";
import { test } from "node:test";

import { parseBackup } from "./parse.ts";

const recipe = {
  sourceUrl: "https://example.com/a",
  name: "Pancakes",
  ingredients: [{ raw: "2 eggs", qty: 2, name: "eggs" }],
  steps: ["Mix", "Cook"],
  favourite: true,
  tags: ["breakfast"],
  createdAt: 123,
};
const file = (extra: object = {}) =>
  JSON.stringify({ app: "recipes-app", version: 1, exportedAt: "x", recipes: [recipe], ...extra });

test("a good file round-trips", () => {
  const backup = parseBackup(file({ groceryItems: [{ name: "milk", qty: 1, unit: "l", checked: false }], meals: [{ date: "2026-11-16", sourceUrl: recipe.sourceUrl }] }));
  assert.equal(backup.recipes[0].name, "Pancakes");
  assert.equal(backup.recipes[0].favourite, true);
  assert.deepEqual(backup.recipes[0].tags, ["breakfast"]);
  assert.equal(backup.groceryItems[0].unit, "l");
  assert.equal(backup.meals[0].date, "2026-11-16");
});

test("files that are not ours are refused with a readable message", () => {
  assert.throws(() => parseBackup("not json"), /not valid JSON/);
  assert.throws(() => parseBackup(JSON.stringify({ hello: 1 })), /not a backup from this app/);
  assert.throws(() => parseBackup(JSON.stringify({ app: "recipes-app", version: 2 })), /newer version/);
});

test("malformed entries are skipped, not fatal", () => {
  const backup = parseBackup(
    file({
      recipes: [recipe, { name: "no url" }, null, "x"],
      groceryItems: [{ name: " " }, { name: "ok" }],
      meals: [{ date: "tomorrow", sourceUrl: "u" }, { date: "2026-01-02", sourceUrl: "u" }],
    }),
  );
  assert.equal(backup.recipes.length, 1);
  assert.equal(backup.groceryItems.length, 1);
  assert.equal(backup.meals.length, 1);
});

test("missing optional parts get safe defaults", () => {
  const backup = parseBackup(JSON.stringify({ app: "recipes-app", version: 1, recipes: [{ sourceUrl: "u", name: "n" }] }));
  assert.deepEqual(backup.recipes[0].ingredients, []);
  assert.deepEqual(backup.recipes[0].tags, []);
  assert.equal(backup.recipes[0].favourite, false);
  assert.deepEqual(backup.groceryItems, []);
});
