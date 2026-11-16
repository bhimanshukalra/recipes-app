import type { Recipe } from "./types";

/** One-line summary for lists and headers, e.g. "Yield: 4 · PT20M". Empty when nothing is known. */
export function recipeMeta(recipe: Pick<Recipe, "recipeYield" | "totalTime">): string {
  return [recipe.recipeYield && `Yield: ${recipe.recipeYield}`, recipe.totalTime]
    .filter(Boolean)
    .join(" · ");
}
