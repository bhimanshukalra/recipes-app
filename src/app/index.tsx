import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { FlatList } from "react-native";

import { AppBar, EmptyState, RecipeRow, Screen } from "@/components";
import { listRecipes, recipeMeta, type Recipe } from "@/storage";

export default function RecipesScreen() {
  const db = useSQLiteContext();
  const [recipes, setRecipes] = useState<Recipe[] | undefined>(undefined);

  // Reload whenever the tab is shown, so a recipe saved by the importer appears.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listRecipes(db).then((list) => {
        if (!cancelled) setRecipes(list);
      });
      return () => {
        cancelled = true;
      };
    }, [db]),
  );

  return (
    <Screen>
      <AppBar title="Recipes" />
      {recipes === undefined ? null : recipes.length === 0 ? (
        <EmptyState
          title="No recipes yet"
          message="Open a recipe in Safari, tap Share, and choose this app to save it."
        />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => String(item.id)}
          contentInsetAdjustmentBehavior="automatic"
          renderItem={({ item }) => (
            <RecipeRow
              name={item.name}
              image={item.image}
              meta={recipeMeta(item) || undefined}
              onPress={() => router.push(`/recipe/${item.id}`)}
            />
          )}
        />
      )}
    </Screen>
  );
}
