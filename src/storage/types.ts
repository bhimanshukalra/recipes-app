/** One ingredient line. `raw` is the text as published; structured fields can be added later. */
export type Ingredient = {
  raw: string;
};

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
  /** Milliseconds since the epoch. */
  createdAt: number;
};

/** What the importer hands to storage. */
export type NewRecipe = Omit<Recipe, "id" | "createdAt">;
