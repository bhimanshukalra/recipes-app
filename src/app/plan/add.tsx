import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { FlatList, View } from "react-native";

import { AppBar, ContentColumn, EmptyState, IconButton, RecipeRow, Screen, SearchField } from "@/components";
import { formatDay } from "@/planner";
import { addMeal, filterRecipes, listRecipes, recipeMeta, type Recipe } from "@/storage";
import { spacing } from "@/theme";

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

/** Pick a recipe to plan for the day in the `date` parameter. */
export default function AddMealScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const db = useSQLiteContext();
  const [recipes, setRecipes] = useState<Recipe[] | undefined>(undefined);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listRecipes(db).then(setRecipes);
  }, [db]);

  const visible = recipes ? filterRecipes(recipes, { query }) : [];

  return (
    <Screen edges={["left", "right", "bottom"]}>
      <AppBar
        title={date ? `Plan ${formatDay(date)}` : "Plan a meal"}
        left={<IconButton symbol="back" label="Back" onPress={goBack} />}
      />
      <ContentColumn>
        {recipes === undefined ? null : recipes.length === 0 ? (
          <EmptyState title="No recipes yet" message="Save a recipe from Safari first, then plan it here." />
        ) : (
          <>
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
              <SearchField value={query} onChangeText={setQuery} placeholder="Search recipes" />
            </View>
            {visible.length === 0 ? (
              <EmptyState title="No matching recipes" message="Try a different word." />
            ) : (
              <FlatList
                data={visible}
                keyExtractor={(item) => String(item.id)}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <RecipeRow
                    name={item.name}
                    image={item.image}
                    meta={recipeMeta(item) || undefined}
                    onPress={async () => {
                      if (date) await addMeal(db, date, item.id);
                      goBack();
                    }}
                  />
                )}
              />
            )}
          </>
        )}
      </ContentColumn>
    </Screen>
  );
}
