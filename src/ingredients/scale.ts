import type { Ingredient } from "./types";

export type Servings = {
  /** How many the recipe makes as published. For a range ("8-10") this is the lower end. */
  count: number;
  /** What is being counted: "servings", "slices", "cookies". */
  label: string;
};

/**
 * Reads a published yield such as "4 servings", "Cuts into 8-10 slices" or "Makes 12 cookies".
 * Returns undefined when there is no number to scale from.
 */
export function parseServings(yieldText: string | undefined): Servings | undefined {
  if (!yieldText) return undefined;
  const match = yieldText.match(/(\d+(?:\.\d+)?)(?:\s*(?:-|–|to)\s*\d+(?:\.\d+)?)?\s*(.*)$/i);
  if (!match) return undefined;
  const count = Number(match[1]);
  if (!Number.isFinite(count) || count <= 0) return undefined;
  const label = match[2].replace(/[.,;:]+$/, "").trim();
  return { count, label: label || "servings" };
}

// Weights and volumes that read better rounded: 207 g becomes 205 g.
const ROUNDED_UNITS = new Set(["g", "ml"]);

function scaleAmount(value: number, factor: number, unit: string | undefined): number {
  const scaled = value * factor;
  if (unit && ROUNDED_UNITS.has(unit)) {
    if (scaled >= 100) return Math.round(scaled / 5) * 5;
    if (scaled >= 10) return Math.round(scaled);
  }
  return scaled;
}

/** The same ingredient for `factor` times the recipe. Lines with no amount are left as they are. */
export function scaleIngredient(ingredient: Ingredient, factor: number): Ingredient {
  if (factor === 1 || ingredient.qty === undefined) return ingredient;
  return {
    ...ingredient,
    qty: scaleAmount(ingredient.qty, factor, ingredient.unit),
    qtyMax:
      ingredient.qtyMax === undefined ? undefined : scaleAmount(ingredient.qtyMax, factor, ingredient.unit),
  };
}

export function scaleIngredients(ingredients: Ingredient[], factor: number): Ingredient[] {
  return factor === 1 ? ingredients : ingredients.map((ingredient) => scaleIngredient(ingredient, factor));
}
