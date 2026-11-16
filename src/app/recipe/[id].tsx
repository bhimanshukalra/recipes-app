import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";

import { EmptyState, Screen, SectionHeader, Text } from "@/components";
import { getRecipe, recipeMeta, type Recipe } from "@/storage";
import { radius, spacing } from "@/theme";

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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

  if (recipe === undefined) return <Screen />;

  if (recipe === null) {
    return (
      <Screen>
        <EmptyState title="Recipe not found" message="It may have been deleted." />
      </Screen>
    );
  }

  const meta = recipeMeta(recipe);

  return (
    <Screen>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.xxl, gap: spacing.md }}>
        <Text variant="title">{recipe.name}</Text>
        {recipe.image ? (
          <Image
            source={{ uri: recipe.image }}
            style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: radius.md }}
          />
        ) : null}
        {meta ? <Text variant="muted">{meta}</Text> : null}
        <SectionHeader title="Ingredients" count={recipe.ingredients.length} />
        {recipe.ingredients.map((item, i) => (
          <Text key={i}>• {item.raw}</Text>
        ))}
        <SectionHeader title="Steps" count={recipe.steps.length} />
        {recipe.steps.map((step, i) => (
          <Text key={i}>
            {i + 1}. {step}
          </Text>
        ))}
      </ScrollView>
    </Screen>
  );
}
