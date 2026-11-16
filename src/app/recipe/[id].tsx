import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Alert, Linking, ScrollView } from "react-native";

import {
  AppBar,
  Button,
  EmptyState,
  IconButton,
  Screen,
  SectionHeader,
  Text,
} from "@/components";
import { deleteRecipe, getRecipe, recipeMeta, type Recipe } from "@/storage";
import { radius, spacing, useTheme } from "@/theme";

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { colors } = useTheme();
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

  const backButton = <IconButton symbol="back" label="Back" onPress={goBack} />;

  if (recipe === undefined) {
    return (
      <Screen edges={["left", "right"]}>
        <AppBar title="Recipe" left={backButton} />
      </Screen>
    );
  }

  if (recipe === null) {
    return (
      <Screen edges={["left", "right"]}>
        <AppBar title="Recipe" left={backButton} />
        <EmptyState title="Recipe not found" message="It may have been deleted." />
      </Screen>
    );
  }

  const confirmDelete = () => {
    Alert.alert("Delete this recipe?", recipe.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteRecipe(db, recipe.id).then(goBack);
        },
      },
    ]);
  };

  const meta = recipeMeta(recipe);

  return (
    <Screen edges={["left", "right", "bottom"]}>
      <AppBar
        title="Recipe"
        left={backButton}
        right={
          <IconButton
            symbol="trash"
            label="Delete recipe"
            tintColor={colors.danger}
            onPress={confirmDelete}
          />
        }
      />
      <ScrollView contentContainerStyle={{ padding: spacing.xxl, gap: spacing.md }}>
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
        <Button
          label="View original page"
          variant="secondary"
          onPress={() => Linking.openURL(recipe.sourceUrl)}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </Screen>
  );
}
