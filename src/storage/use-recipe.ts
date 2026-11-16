import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";

import { getRecipe } from "./recipes";
import type { Recipe } from "./types";

/** Loads one recipe by id. `undefined` while loading, `null` when it does not exist. */
export function useRecipe(id: string | undefined): Recipe | null | undefined {
  const db = useSQLiteContext();
  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getRecipe(db, Number(id)).then((found) => {
      if (!cancelled) setRecipe(found);
    });
    return () => {
      cancelled = true;
    };
  }, [db, id]);

  return recipe;
}
