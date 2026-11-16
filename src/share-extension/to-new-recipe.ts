import { parseIngredient } from "@/ingredients";
import type { NewRecipe } from "@/storage";

import type { CompactRecipe } from "./extract-recipe";

/**
 * Converts the recipe the extension hands over into the stored shape.
 * Returns undefined when there is no source URL, since that is what duplicates are matched on.
 */
export function toNewRecipe(compact: CompactRecipe): NewRecipe | undefined {
  if (!compact.url) return undefined;
  return {
    sourceUrl: compact.url,
    name: compact.name,
    image: compact.image,
    recipeYield: compact.recipeYield,
    totalTime: compact.totalTime,
    ingredients: compact.ingredients.map(parseIngredient),
    steps: compact.steps,
  };
}
