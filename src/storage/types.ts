import type { Ingredient } from "@/ingredients";

export type { Ingredient };

/** A recipe as stored on the device. */
export type Recipe = {
  id: number;
  sourceUrl: string;
  name: string;
  image?: string;
  recipeYield?: string;
  totalTime?: string;
  ingredients: Ingredient[];
  steps: string[];
  favourite: boolean;
  /** Lower-case labels the user added, e.g. "dinner", "vegetarian". */
  tags: string[];
  /** Milliseconds since the epoch. */
  createdAt: number;
};

/** What the importer hands to storage. Favourite and tags belong to the user, so they are not set on import. */
export type NewRecipe = Omit<Recipe, "id" | "createdAt" | "favourite" | "tags">;
