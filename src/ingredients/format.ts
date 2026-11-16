import type { Ingredient } from "./types";

const FRACTIONS: [number, string][] = [
  [1 / 8, "⅛"],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [3 / 8, "⅜"],
  [1 / 2, "½"],
  [5 / 8, "⅝"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
  [7 / 8, "⅞"],
];

/** 1.5 becomes "1½", 0.333 becomes "⅓", 250 becomes "250". Falls back to up to 2 decimals. */
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "";
  const whole = Math.floor(value);
  const rest = value - whole;

  if (rest < 0.02) return String(whole);
  if (rest > 0.98) return String(whole + 1);

  const match = FRACTIONS.find(([fraction]) => Math.abs(fraction - rest) < 0.02);
  if (match) return whole ? `${whole}${match[1]}` : match[1];

  return String(Math.round(value * 100) / 100);
}

// Units that are real words and take a plural; abbreviations (g, tbsp, oz...) never do.
const PLURALS: Record<string, string> = {
  cup: "cups",
  pt: "pt",
  can: "cans",
  package: "packages",
  jar: "jars",
  bottle: "bottles",
  bag: "bags",
  box: "boxes",
  stick: "sticks",
  slice: "slices",
  piece: "pieces",
  clove: "cloves",
  bunch: "bunches",
  sprig: "sprigs",
  head: "heads",
  stalk: "stalks",
  pinch: "pinches",
  dash: "dashes",
  handful: "handfuls",
};

function formatUnit(unit: string, qty: number | undefined, qtyMax: number | undefined): string {
  const plural = PLURALS[unit];
  if (!plural) return unit;
  const amount = qtyMax ?? qty ?? 1;
  return amount > 1 ? plural : unit;
}

/**
 * The amount part of an ingredient for display: "140 g", "1½ cups", "2–3 tbsp".
 * Empty when the line has no quantity (or a unit with no quantity).
 */
export function formatIngredientAmount(ingredient: Ingredient): string {
  if (ingredient.qty === undefined) return "";
  const quantity =
    ingredient.qtyMax !== undefined
      ? `${formatQuantity(ingredient.qty)}–${formatQuantity(ingredient.qtyMax)}`
      : formatQuantity(ingredient.qty);
  if (!ingredient.unit) return quantity;

  // Metric and other short units sit close to the number ("140 g"); words get a space too.
  return `${quantity} ${formatUnit(ingredient.unit, ingredient.qty, ingredient.qtyMax)}`;
}

/** A whole ingredient line for display: "210 g butter, softened". Falls back to the raw line. */
export function formatIngredientLine(ingredient: Ingredient): string {
  if (ingredient.name === undefined) return ingredient.raw;
  const amount = formatIngredientAmount(ingredient);
  const text = amount ? `${amount} ${ingredient.name}` : ingredient.name;
  return ingredient.note ? `${text}, ${ingredient.note}` : text;
}
