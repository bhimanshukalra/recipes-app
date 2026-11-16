/// <reference types="node" />
// Run with: node --test src/ingredients/
import assert from "node:assert/strict";
import { test } from "node:test";

import { parseIngredient } from "./parse-ingredient.ts";

/** Parses a line and drops `raw`, so cases only list the fields that matter. */
function parse(line: string) {
  const { raw, ...fields } = parseIngredient(line);
  assert.equal(raw, line, "raw must always be the original line");
  return fields;
}

test("simple amount, unit and name", () => {
  assert.deepEqual(parse("1 cup all-purpose flour"), { qty: 1, unit: "cup", name: "all-purpose flour" });
  assert.deepEqual(parse("2 tablespoons olive oil"), { qty: 2, unit: "tbsp", name: "olive oil" });
  assert.deepEqual(parse("1/2 teaspoon salt"), { qty: 0.5, unit: "tsp", name: "salt" });
  assert.deepEqual(parse("3 Tbsp. butter"), { qty: 3, unit: "tbsp", name: "butter" });
});

test("fractions, mixed numbers and unicode fractions", () => {
  assert.deepEqual(parse("1 1/2 cups milk"), { qty: 1.5, unit: "cup", name: "milk" });
  assert.deepEqual(parse("1-1/2 cups milk"), { qty: 1.5, unit: "cup", name: "milk" });
  assert.deepEqual(parse("½ cup sugar"), { qty: 0.5, unit: "cup", name: "sugar" });
  const third = parse("1⅓ cups sugar");
  assert.equal(third.unit, "cup");
  assert.equal(third.name, "sugar");
  assert.ok(Math.abs((third.qty ?? 0) - 4 / 3) < 1e-9);
  assert.deepEqual(parse("0.5 kg potatoes"), { qty: 0.5, unit: "kg", name: "potatoes" });
});

test("ranges", () => {
  assert.deepEqual(parse("2-3 tablespoons honey"), { qty: 2, qtyMax: 3, unit: "tbsp", name: "honey" });
  assert.deepEqual(parse("1 to 2 lemons"), { qty: 1, qtyMax: 2, name: "lemons" });
  assert.deepEqual(parse("2 – 3 cloves garlic"), { qty: 2, qtyMax: 3, unit: "clove", name: "garlic" });
});

test("no unit", () => {
  assert.deepEqual(parse("2 large eggs"), { qty: 2, name: "large eggs" });
  assert.deepEqual(parse("3 ripe bananas"), { qty: 3, name: "ripe bananas" });
});

test("no quantity", () => {
  assert.deepEqual(parse("Extra-virgin olive oil (for the pan)"), {
    name: "Extra-virgin olive oil",
    note: "for the pan",
  });
  assert.deepEqual(parse("Salt and pepper to taste"), { name: "Salt and pepper", note: "to taste" });
  assert.deepEqual(parse("Fresh parsley, chopped"), { name: "Fresh parsley", note: "chopped" });
});

test("notes in parentheses and after a comma", () => {
  assert.deepEqual(parse("1 (14.5 ounce) can diced tomatoes, drained"), {
    qty: 1,
    unit: "can",
    name: "diced tomatoes",
    note: "14.5 ounce, drained",
  });
  assert.deepEqual(parse("1 pound (450 g) ground beef"), {
    qty: 1,
    unit: "lb",
    name: "ground beef",
    note: "450 g",
  });
  assert.deepEqual(parse("3 cloves garlic, minced"), { qty: 3, unit: "clove", name: "garlic", note: "minced" });
  assert.deepEqual(parse("2 (large) eggs"), { qty: 2, name: "eggs", note: "large" });
});

test("units glued to the number, and multi-word units", () => {
  assert.deepEqual(parse("250g flour"), { qty: 250, unit: "g", name: "flour" });
  assert.deepEqual(parse("500ml milk"), { qty: 500, unit: "ml", name: "milk" });
  assert.deepEqual(parse("8 fl oz cream"), { qty: 8, unit: "fl oz", name: "cream" });
  assert.deepEqual(parse("2 fluid ounces rum"), { qty: 2, unit: "fl oz", name: "rum" });
});

test("a / an with a counting word", () => {
  assert.deepEqual(parse("a pinch of salt"), { qty: 1, unit: "pinch", name: "salt" });
  assert.deepEqual(parse("A handful of basil leaves"), { qty: 1, unit: "handful", name: "basil leaves" });
});

test("footnote marks and odd whitespace", () => {
  assert.deepEqual(parse("1/2 teaspoon salt*"), { qty: 0.5, unit: "tsp", name: "salt" });
  assert.deepEqual(parse("  2   cups   water  "), { qty: 2, unit: "cup", name: "water" });
});

test("does not guess when nothing is left", () => {
  assert.deepEqual(parse("2 cups"), {});
  assert.deepEqual(parse(""), {});
  assert.deepEqual(parse("   "), {});
});

test("words that look like units are only units after an amount", () => {
  assert.deepEqual(parse("Can of coconut milk"), { name: "Can of coconut milk" });
  assert.deepEqual(parse("Stick butter"), { name: "Stick butter" });
});

test("nested parentheses and footnote marks inside a line", () => {
  assert.deepEqual(parse("1⅓ cups blanched almond flour* (spooned and leveled (see note))").name, "blanched almond flour");
  assert.equal(
    parse("1⅓ cups blanched almond flour* (spooned and leveled (see note))").note,
    "spooned and leveled (see note)",
  );
});

test("plus tails and trailing phrases become notes", () => {
  assert.deepEqual(parse("1 tbsp sunflower or vegetable oil plus a little extra for frying"), {
    qty: 1,
    unit: "tbsp",
    name: "sunflower or vegetable oil",
    note: "plus a little extra for frying",
  });
  assert.deepEqual(parse("lemon wedges to serve (optional)"), {
    name: "lemon wedges",
    note: "optional, to serve",
  });
});

test("commas inside the name stay, commas before preparation split", () => {
  assert.deepEqual(parse("2 pounds boneless, skinless chicken breasts"), {
    qty: 2,
    unit: "lb",
    name: "boneless, skinless chicken breasts",
  });
  assert.deepEqual(parse("1 onion, finely chopped"), { qty: 1, name: "onion", note: "finely chopped" });
  assert.deepEqual(parse("1 pound chicken thighs, cut into pieces"), {
    qty: 1,
    unit: "lb",
    name: "chicken thighs",
    note: "cut into pieces",
  });
  assert.deepEqual(parse("1 (8-ounce) package cream cheese, softened"), {
    qty: 1,
    unit: "package",
    name: "cream cheese",
    note: "8-ounce, softened",
  });
});

test("preparation words at the end without a comma", () => {
  assert.deepEqual(parse("140g butter softened"), { qty: 140, unit: "g", name: "butter", note: "softened" });
  assert.deepEqual(parse("2 large eggs beaten"), { qty: 2, name: "large eggs", note: "beaten" });
  assert.deepEqual(parse("2 very ripe bananas mashed"), { qty: 2, name: "very ripe bananas", note: "mashed" });
});

test("count words with no number", () => {
  assert.deepEqual(parse("handful dried banana chips for decoration"), {
    qty: 1,
    unit: "handful",
    name: "dried banana chips",
    note: "for decoration",
  });
  assert.deepEqual(parse("blueberries to serve"), { name: "blueberries", note: "to serve" });
});
