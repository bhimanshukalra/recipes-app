/// <reference types="node" />
// Run with: node --test src/storage/filter.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";

import { addTag, collectTags, filterRecipes, hasActiveFilter, normaliseTag } from "./filter.ts";
import type { Recipe } from "./types.ts";

function recipe(overrides: Partial<Recipe> & Pick<Recipe, "id" | "name">): Recipe {
  return {
    sourceUrl: `https://example.com/${overrides.id}`,
    ingredients: [],
    steps: [],
    favourite: false,
    tags: [],
    createdAt: overrides.id,
    ...overrides,
  };
}

const pancakes = recipe({
  id: 1,
  name: "Almond flour pancakes",
  ingredients: [{ raw: "2 eggs", name: "eggs", qty: 2 }, { raw: "60ml almond milk", name: "almond milk" }],
  tags: ["breakfast", "gluten free"],
  favourite: true,
});
const bread = recipe({
  id: 2,
  name: "Banana bread",
  ingredients: [{ raw: "140g caster sugar", name: "caster sugar" }, { raw: "2 large eggs beaten", name: "large eggs" }],
  tags: ["baking", "breakfast"],
});
const chilli = recipe({
  id: 3,
  name: "Beef chilli",
  ingredients: [{ raw: "500g beef mince" }],
  tags: ["dinner"],
  favourite: true,
});
const all = [pancakes, bread, chilli];

test("no filter returns everything", () => {
  assert.deepEqual(filterRecipes(all, {}), all);
  assert.equal(hasActiveFilter({}), false);
  assert.equal(hasActiveFilter({ query: "  " }), false);
});

test("search matches the name, ingredients and tags, ignoring case", () => {
  assert.deepEqual(filterRecipes(all, { query: "BANANA" }).map((r) => r.id), [2]);
  assert.deepEqual(filterRecipes(all, { query: "eggs" }).map((r) => r.id), [1, 2]);
  assert.deepEqual(filterRecipes(all, { query: "dinner" }).map((r) => r.id), [3]);
  assert.deepEqual(filterRecipes(all, { query: "mince" }).map((r) => r.id), [3]);
});

test("every search word must match somewhere", () => {
  assert.deepEqual(filterRecipes(all, { query: "eggs almond" }).map((r) => r.id), [1]);
  assert.deepEqual(filterRecipes(all, { query: "eggs chilli" }), []);
});

test("favourites and tag filters combine with search", () => {
  assert.deepEqual(filterRecipes(all, { favouritesOnly: true }).map((r) => r.id), [1, 3]);
  assert.deepEqual(filterRecipes(all, { tag: "breakfast" }).map((r) => r.id), [1, 2]);
  assert.deepEqual(filterRecipes(all, { tag: "breakfast", favouritesOnly: true }).map((r) => r.id), [1]);
  assert.deepEqual(filterRecipes(all, { tag: "breakfast", query: "banana" }).map((r) => r.id), [2]);
  assert.equal(hasActiveFilter({ tag: "dinner" }), true);
  assert.equal(hasActiveFilter({ favouritesOnly: true }), true);
});

test("tags are normalised and de-duplicated", () => {
  assert.equal(normaliseTag("  Gluten   FREE "), "gluten free");
  assert.equal(normaliseTag("   "), "");
  assert.equal(normaliseTag("x".repeat(50)).length, 30);
  assert.deepEqual(addTag(["dinner"], " Quick "), ["dinner", "quick"]);
  assert.deepEqual(addTag(["dinner"], "DINNER"), ["dinner"]);
  const same = ["dinner"];
  assert.equal(addTag(same, "  "), same);
});

test("tags in use are listed most used first, then alphabetically", () => {
  assert.deepEqual(collectTags(all), ["breakfast", "baking", "dinner", "gluten free"]);
  assert.deepEqual(collectTags([]), []);
});
