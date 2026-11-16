import type { Ingredient } from "@/ingredients";

/** The file format. Meals point at recipes by `sourceUrl`, because ids differ between phones. */
export type Backup = {
  app: "recipes-app";
  version: 1;
  exportedAt: string;
  recipes: BackupRecipe[];
  groceryItems: BackupGroceryItem[];
  meals: BackupMeal[];
};

export type BackupRecipe = {
  sourceUrl: string;
  name: string;
  image?: string;
  recipeYield?: string;
  totalTime?: string;
  ingredients: Ingredient[];
  steps: string[];
  favourite: boolean;
  tags: string[];
  createdAt: number;
};

export type BackupGroceryItem = { name: string; qty?: number; unit?: string; checked: boolean };

export type BackupMeal = { date: string; sourceUrl: string };
