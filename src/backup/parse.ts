import type { Ingredient } from "@/ingredients";

import type { Backup, BackupGroceryItem, BackupMeal, BackupRecipe } from "./types";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";
const optionalString = (value: unknown) => (isString(value) && value ? value : undefined);
const optionalNumber = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : undefined);
const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter(isString) : []);

function parseIngredient(value: unknown): Ingredient | undefined {
  if (!isObject(value) || !isString(value.raw)) return undefined;
  return {
    raw: value.raw,
    qty: optionalNumber(value.qty),
    qtyMax: optionalNumber(value.qtyMax),
    unit: optionalString(value.unit),
    name: optionalString(value.name),
    note: optionalString(value.note),
  };
}

function parseRecipe(value: unknown): BackupRecipe | undefined {
  if (!isObject(value) || !isString(value.sourceUrl) || !value.sourceUrl || !isString(value.name)) return undefined;
  return {
    sourceUrl: value.sourceUrl,
    name: value.name,
    image: optionalString(value.image),
    recipeYield: optionalString(value.recipeYield),
    totalTime: optionalString(value.totalTime),
    ingredients: Array.isArray(value.ingredients)
      ? value.ingredients.flatMap((line) => parseIngredient(line) ?? [])
      : [],
    steps: strings(value.steps),
    favourite: value.favourite === true,
    tags: strings(value.tags),
    createdAt: optionalNumber(value.createdAt) ?? Date.now(),
  };
}

function parseGroceryItem(value: unknown): BackupGroceryItem | undefined {
  if (!isObject(value) || !isString(value.name) || !value.name.trim()) return undefined;
  return {
    name: value.name,
    qty: optionalNumber(value.qty),
    unit: optionalString(value.unit),
    checked: value.checked === true,
  };
}

function parseMeal(value: unknown): BackupMeal | undefined {
  if (!isObject(value) || !isString(value.date) || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) return undefined;
  if (!isString(value.sourceUrl) || !value.sourceUrl) return undefined;
  return { date: value.date, sourceUrl: value.sourceUrl };
}

const list = <T>(value: unknown, parse: (item: unknown) => T | undefined): T[] =>
  Array.isArray(value) ? value.flatMap((item) => parse(item) ?? []) : [];

/**
 * Reads a backup file's text. Throws an `Error` with a message fit to show the user when the
 * file is not one of ours. Entries that are malformed are skipped rather than failing the import.
 */
export function parseBackup(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file is not a backup (it is not valid JSON).");
  }
  if (!isObject(data) || data.app !== "recipes-app") {
    throw new Error("This file is not a backup from this app.");
  }
  if (data.version !== 1) {
    throw new Error("This backup was made by a newer version of the app. Update the app and try again.");
  }
  return {
    app: "recipes-app",
    version: 1,
    exportedAt: isString(data.exportedAt) ? data.exportedAt : "",
    recipes: list(data.recipes, parseRecipe),
    groceryItems: list(data.groceryItems, parseGroceryItem),
    meals: list(data.meals, parseMeal),
  };
}
