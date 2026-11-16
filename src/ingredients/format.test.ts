/// <reference types="node" />
// Run with: node --test src/ingredients/format.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";

import { formatIngredientAmount, formatQuantity } from "./format.ts";

test("quantities become tidy numbers and fractions", () => {
  assert.equal(formatQuantity(1), "1");
  assert.equal(formatQuantity(250), "250");
  assert.equal(formatQuantity(0.5), "½");
  assert.equal(formatQuantity(1.5), "1½");
  assert.equal(formatQuantity(4 / 3), "1⅓");
  assert.equal(formatQuantity(0.3333333333), "⅓");
  assert.equal(formatQuantity(0.75), "¾");
  assert.equal(formatQuantity(2.999), "3");
  assert.equal(formatQuantity(1.1), "1.1");
  assert.equal(formatQuantity(0.07), "0.07");
});

test("amounts combine quantity and unit, pluralising word units", () => {
  assert.equal(formatIngredientAmount({ raw: "", qty: 140, unit: "g" }), "140 g");
  assert.equal(formatIngredientAmount({ raw: "", qty: 1, unit: "cup" }), "1 cup");
  assert.equal(formatIngredientAmount({ raw: "", qty: 1.5, unit: "cup" }), "1½ cups");
  assert.equal(formatIngredientAmount({ raw: "", qty: 0.5, unit: "cup" }), "½ cup");
  assert.equal(formatIngredientAmount({ raw: "", qty: 3, unit: "clove" }), "3 cloves");
  assert.equal(formatIngredientAmount({ raw: "", qty: 2, unit: "tbsp" }), "2 tbsp");
  assert.equal(formatIngredientAmount({ raw: "", qty: 2, qtyMax: 3, unit: "tbsp" }), "2–3 tbsp");
  assert.equal(formatIngredientAmount({ raw: "", qty: 1, qtyMax: 2, unit: "pinch" }), "1–2 pinches");
});

test("no unit, and no quantity", () => {
  assert.equal(formatIngredientAmount({ raw: "", qty: 2 }), "2");
  assert.equal(formatIngredientAmount({ raw: "" }), "");
  assert.equal(formatIngredientAmount({ raw: "", unit: "cup" }), "");
});
