import type { Ingredient } from "./types";

// Hand-written parser for ingredient lines such as "1⅓ cups sugar" or
// "1 (14.5 ounce) can diced tomatoes, drained". It is deliberately conservative:
// whatever it cannot place stays in `name`, and the original line is always kept
// in `raw`, so a wrong guess never loses information.

const VULGAR_FRACTIONS: Record<string, string> = {
  "¼": "1/4",
  "½": "1/2",
  "¾": "3/4",
  "⅐": "1/7",
  "⅑": "1/9",
  "⅒": "1/10",
  "⅓": "1/3",
  "⅔": "2/3",
  "⅕": "1/5",
  "⅖": "2/5",
  "⅗": "3/5",
  "⅘": "4/5",
  "⅙": "1/6",
  "⅚": "5/6",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};

/** Every spelling we accept, mapped to one canonical unit. Matching is case-insensitive. */
const UNIT_ALIASES: Record<string, string> = {};

function addUnit(canonical: string, ...aliases: string[]) {
  UNIT_ALIASES[canonical] = canonical;
  for (const alias of aliases) UNIT_ALIASES[alias] = canonical;
}

// Volume
addUnit("cup", "cups");
addUnit("tbsp", "tablespoon", "tablespoons", "tbs", "tbsps", "tblsp");
addUnit("tsp", "teaspoon", "teaspoons", "tsps");
addUnit("fl oz", "fluid ounce", "fluid ounces", "fl. oz", "fl oz.");
addUnit("pt", "pint", "pints");
addUnit("qt", "quart", "quarts");
addUnit("gal", "gallon", "gallons");
addUnit("ml", "milliliter", "milliliters", "millilitre", "millilitres");
addUnit("l", "liter", "liters", "litre", "litres");
// Weight
addUnit("g", "gram", "grams", "gm");
addUnit("kg", "kilogram", "kilograms", "kilo", "kilos");
addUnit("mg", "milligram", "milligrams");
addUnit("oz", "ounce", "ounces");
addUnit("lb", "lbs", "pound", "pounds");
// Counts that behave like units
addUnit("can", "cans", "tin", "tins");
addUnit("package", "packages", "pkg", "packet", "packets");
addUnit("jar", "jars");
addUnit("bottle", "bottles");
addUnit("bag", "bags");
addUnit("box", "boxes");
addUnit("stick", "sticks");
addUnit("slice", "slices");
addUnit("piece", "pieces");
addUnit("clove", "cloves");
addUnit("bunch", "bunches");
addUnit("sprig", "sprigs");
addUnit("head", "heads");
addUnit("stalk", "stalks");
addUnit("pinch", "pinches");
addUnit("dash", "dashes");
addUnit("handful", "handfuls");

// Count words that mean "one" even with no number or article: "handful dried banana chips".
const SOLO_ONE_UNITS = new Set(["pinch", "dash", "handful"]);

// Units that can follow "a" / "an" with no number: "a pinch of salt".
const IMPLIED_ONE_UNITS = new Set(["pinch", "dash", "handful", "sprig", "clove", "bunch", "can", "stick", "slice"]);

const NUMBER = String.raw`(?:\d+[\s-]+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|\.\d+)`;
const QUANTITY = new RegExp(String.raw`^(${NUMBER})(?:\s*(?:-|to)\s*(${NUMBER}))?`, "i");

/** "1 1/2", "1-1/2", "3/4", "2", "0.5" to a number. */
function toNumber(text: string): number | undefined {
  const mixed = /^(\d+)[\s-]+(\d+)\/(\d+)$/.exec(text);
  if (mixed) {
    const den = Number(mixed[3]);
    return den ? Number(mixed[1]) + Number(mixed[2]) / den : undefined;
  }
  const fraction = /^(\d+)\/(\d+)$/.exec(text);
  if (fraction) {
    const den = Number(fraction[2]);
    return den ? Number(fraction[1]) / den : undefined;
  }
  const value = Number(text);
  return Number.isFinite(value) ? value : undefined;
}

/** Rewrites "1⅓" as "1 1/3", turns en dashes into hyphens, drops footnote marks. */
function normalise(raw: string): string {
  let text = raw.replace(/\s+/g, " ").trim();
  text = text.replace(/(\d)([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g, "$1 $2");
  text = text.replace(/[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, (fraction) => VULGAR_FRACTIONS[fraction]);
  text = text.replace(/[–—]/g, "-");
  text = text.replace(/[*†‡]+\s*$/, "").replace(/(\w)[*†‡]+/g, "$1");
  return text.trim();
}

/** Takes the first "(...)" group (with nesting) off the start of `text`. */
function takeLeadingParenthesis(text: string): { inner: string; rest: string } | undefined {
  if (!text.startsWith("(")) return undefined;
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")" && --depth === 0) {
      return { inner: text.slice(1, i).trim(), rest: text.slice(i + 1).trim() };
    }
  }
  return undefined;
}

/** Finds a unit at the start of `text`. Tries "fl oz" style two-word units first. */
function takeUnit(text: string): { unit: string; rest: string } | undefined {
  const two = /^([a-z.]+\s+[a-z.]+?)(?=[\s(,]|$)/i.exec(text);
  if (two) {
    const unit = UNIT_ALIASES[two[1].toLowerCase()];
    if (unit) return { unit, rest: text.slice(two[0].length).trim() };
  }
  const one = /^([a-z]+)\.?(?=[\s(,]|$)/i.exec(text);
  if (one) {
    const unit = UNIT_ALIASES[one[1].toLowerCase()];
    if (unit) return { unit, rest: text.slice(one[0].length).trim() };
  }
  return undefined;
}

/** Removes top-level "(...)" groups (keeping nested ones inside the note) and returns them. */
function extractParentheses(text: string): { text: string; groups: string[] } {
  const groups: string[] = [];
  let out = "";
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "(") {
      if (depth === 0) start = i + 1;
      depth++;
    } else if (char === ")" && depth > 0) {
      depth--;
      if (depth === 0) {
        const inner = text.slice(start, i).trim();
        if (inner) groups.push(inner);
        out += " ";
      }
    } else if (depth === 0) {
      out += char;
    }
  }
  // An unclosed "(" keeps whatever followed it in the note instead of losing it.
  if (depth > 0) {
    const inner = text.slice(start).trim();
    if (inner) groups.push(inner);
  }
  return { text: out, groups };
}

/** A comma only starts a note when what follows reads like preparation, not an adjective. */
const PREPARATION =
  /^(?:\w+ly|\w+ed|cut|torn|ground|beaten|to|for|at|plus|or|such|about|if|as|see|optional|divided|room|preferably|lightly)\b/i;

const TRAILING_PHRASES =
  /\s+(?:to (?:taste|serve|garnish|decorate)|for (?:serving|garnish|decoration|dusting|frying|greasing|brushing)|as needed)$/i;

/** A preparation word at the very end with no comma: "butter softened", "eggs beaten". */
const TRAILING_PREPARATION =
  /\s+(softened|melted|beaten|mashed|chopped|diced|sliced|minced|grated|peeled|drained|rinsed|crushed|cubed|shredded|toasted|halved|trimmed|thawed|sifted|cooled|divided)$/i;

/**
 * Splits a name phrase into the ingredient and its notes: parenthesised groups,
 * "plus ..." tails, "to taste" style endings, and a comma followed by preparation
 * ("minced", "cut into pieces"). "boneless, skinless chicken" is left whole.
 */
function splitNameAndNotes(phrase: string): { name: string; notes: string[] } {
  const { text, groups } = extractParentheses(phrase);
  let working = text.replace(/\s+/g, " ").trim();

  // Work from the end of the phrase backwards; each piece found sits earlier in the
  // text than the one before it, so reverse at the end to read in the original order.
  const tails: string[] = [];

  const comma = working.indexOf(",");
  if (comma !== -1) {
    const tail = working.slice(comma + 1).trim();
    if (!tail || PREPARATION.test(tail)) {
      if (tail) tails.push(tail);
      working = working.slice(0, comma);
    }
  }

  const plus = /\s+plus\s+/i.exec(working);
  if (plus) {
    tails.push(working.slice(plus.index).trim());
    working = working.slice(0, plus.index);
  }

  const trailing = TRAILING_PHRASES.exec(working);
  if (trailing) {
    tails.push(trailing[0].trim());
    working = working.slice(0, trailing.index);
  }

  const prep = TRAILING_PREPARATION.exec(working);
  if (prep) {
    tails.push(prep[1].toLowerCase());
    working = working.slice(0, prep.index);
  }

  const name = working
    .replace(/^(?:of|a|an)\s+/i, "")
    .replace(/\s+/g, " ")
    .replace(/[\s,;:-]+$/, "")
    .trim();
  return { name, notes: [...groups, ...tails.reverse()] };
}

export function parseIngredient(raw: string): Ingredient {
  const original: Ingredient = { raw };
  const text = normalise(raw);
  if (!text) return original;

  let rest = text;
  let qty: number | undefined;
  let qtyMax: number | undefined;
  const notes: string[] = [];

  const quantity = QUANTITY.exec(rest);
  if (quantity) {
    qty = toNumber(quantity[1]);
    if (qty !== undefined && quantity[2]) {
      const upper = toNumber(quantity[2]);
      if (upper !== undefined && upper > qty) qtyMax = upper;
    }
    if (qty !== undefined) rest = rest.slice(quantity[0].length).trim();
  }

  // "a pinch of salt", "an 8 oz block" is left alone: only count words imply "one".
  if (qty === undefined) {
    const article = /^(?:a|an)\s+([a-z]+)/i.exec(rest);
    if (article && IMPLIED_ONE_UNITS.has(UNIT_ALIASES[article[1].toLowerCase()] ?? "")) {
      qty = 1;
      rest = rest.slice(rest.indexOf(" ") + 1).trim();
    }
  }

  if (qty === undefined) {
    const solo = /^([a-z]+)\s+\S/i.exec(rest);
    if (solo && SOLO_ONE_UNITS.has(UNIT_ALIASES[solo[1].toLowerCase()] ?? "")) qty = 1;
  }

  let unit: string | undefined;
  if (qty !== undefined) {
    // "1 (14.5 ounce) can tomatoes": the size in parentheses comes before the unit.
    const leading = takeLeadingParenthesis(rest);
    let afterSize = rest;
    if (leading) {
      afterSize = leading.rest;
    }
    const found = takeUnit(afterSize);
    if (found) {
      unit = found.unit;
      rest = found.rest;
      if (leading && leading.inner) notes.push(leading.inner);
    } else if (leading) {
      // A parenthesis with no unit after it ("2 (large) eggs"): keep it as a note.
      if (leading.inner) notes.push(leading.inner);
      rest = leading.rest;
    }
  }

  const { name, notes: nameNotes } = splitNameAndNotes(rest);
  notes.push(...nameNotes);

  // Nothing left to call the ingredient: do not guess, fall back to the raw line.
  if (!name) return original;

  const parsed: Ingredient = { raw, name };
  if (qty !== undefined) parsed.qty = qty;
  if (qtyMax !== undefined) parsed.qtyMax = qtyMax;
  if (unit) parsed.unit = unit;
  if (notes.length) parsed.note = notes.join(", ");
  return parsed;
}
