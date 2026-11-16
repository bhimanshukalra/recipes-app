import type { Recipe } from "./types";

export type RecipeFilter = {
  /** Words to look for. Every word must appear in the name, an ingredient or a tag. */
  query?: string;
  favouritesOnly?: boolean;
  /** Only recipes that have this tag. */
  tag?: string;
};

/** Tags are lower-case, trimmed, single-spaced, and at most 30 characters. Empty means "not a tag". */
export function normaliseTag(input: string): string {
  return input.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 30).trim();
}

/** Adds a tag to a list without duplicates. Returns the same list when the tag is empty or already there. */
export function addTag(tags: string[], input: string): string[] {
  const tag = normaliseTag(input);
  if (!tag || tags.includes(tag)) return tags;
  return [...tags, tag];
}

/** Every tag in use across the recipes, most used first, then alphabetically. */
export function collectTags(recipes: Recipe[]): string[] {
  const counts = new Map<string, number>();
  for (const recipe of recipes) {
    for (const tag of recipe.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
}

function searchableText(recipe: Recipe): string {
  const ingredients = recipe.ingredients.map((ingredient) => ingredient.name ?? ingredient.raw);
  return [recipe.name, ...ingredients, ...recipe.tags].join(" ").toLowerCase();
}

/** Applies the search words, the favourites switch and the tag, in that combination. */
export function filterRecipes(recipes: Recipe[], filter: RecipeFilter): Recipe[] {
  const words = (filter.query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  return recipes.filter((recipe) => {
    if (filter.favouritesOnly && !recipe.favourite) return false;
    if (filter.tag && !recipe.tags.includes(filter.tag)) return false;
    if (!words.length) return true;
    const text = searchableText(recipe);
    return words.every((word) => text.includes(word));
  });
}

/** True when any filter is active, so the screen can offer "clear". */
export function hasActiveFilter(filter: RecipeFilter): boolean {
  return !!(filter.query?.trim() || filter.favouritesOnly || filter.tag);
}
