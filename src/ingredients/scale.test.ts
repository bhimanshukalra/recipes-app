/// <reference types="node" />
import assert from "node:assert/strict";
import { test } from "node:test";

import { formatIngredientAmount } from "./format.ts";
import { parseServings, scaleIngredient } from "./scale.ts";

test("parseServings reads common yield wordings", () => {
  assert.deepEqual(parseServings("4 servings"), { count: 4, label: "servings" });
  assert.deepEqual(parseServings("Cuts into 8-10 slices"), { count: 8, label: "slices" });
  assert.deepEqual(parseServings("Makes 12 cookies."), { count: 12, label: "cookies" });
  assert.deepEqual(parseServings("Serves 4 to 6"), { count: 4, label: "servings" });
  assert.deepEqual(parseServings("4"), { count: 4, label: "servings" });
  assert.deepEqual(parseServings("16 squares or 32 triangles"), { count: 16, label: "squares" });
});

test("parseServings gives up when there is no number", () => {
  assert.equal(parseServings(undefined), undefined);
  assert.equal(parseServings("One loaf"), undefined);
  assert.equal(parseServings("0 servings"), undefined);
});

test("scaling doubles and halves with sensible fractions", () => {
  const cups = { raw: "1 cup milk", qty: 1, unit: "cup", name: "milk" };
  assert.equal(formatIngredientAmount(scaleIngredient(cups, 0.5)), "½ cup");
  assert.equal(formatIngredientAmount(scaleIngredient(cups, 1.5)), "1½ cups");
  assert.equal(formatIngredientAmount(scaleIngredient(cups, 3)), "3 cups");
});

test("grams round to a tidy number", () => {
  const flour = { raw: "140g flour", qty: 140, unit: "g", name: "flour" };
  assert.equal(scaleIngredient(flour, 1.5).qty, 210);
  assert.equal(scaleIngredient(flour, 1.48).qty, 205);
  assert.equal(scaleIngredient({ ...flour, qty: 50 }, 1.5).qty, 75);
});

test("ranges scale at both ends and lines with no amount are untouched", () => {
  const oil = { raw: "2-3 tbsp oil", qty: 2, qtyMax: 3, unit: "tbsp", name: "oil" };
  const scaled = scaleIngredient(oil, 2);
  assert.deepEqual([scaled.qty, scaled.qtyMax], [4, 6]);
  const salt = { raw: "Salt", name: "Salt" };
  assert.equal(scaleIngredient(salt, 2), salt);
});
