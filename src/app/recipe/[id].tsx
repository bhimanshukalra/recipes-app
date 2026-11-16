import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Alert, Linking, ScrollView, StyleSheet, View } from "react-native";

import {
  AppBar,
  Button,
  ContentColumn,
  EmptyState,
  IconButton,
  Screen,
  SectionHeader,
  Text,
} from "@/components";
import { deleteRecipe, recipeMeta, useRecipe } from "@/storage";
import { radius, spacing, useTheme } from "@/theme";

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const recipe = useRecipe(id);

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
          <View style={{ flexDirection: "row" }}>
            <IconButton
              symbol="link"
              label="View original page"
              onPress={() => Linking.openURL(recipe.sourceUrl)}
            />
            <IconButton
              symbol="trash"
              label="Delete recipe"
              tintColor={colors.danger}
              onPress={confirmDelete}
            />
          </View>
        }
      />
      <ContentColumn>
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
        </ScrollView>
        {/* Pinned outside the scroll area so it is always one tap away. */}
        <View
          style={{
            padding: spacing.lg,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}>
          <Button label="Start cooking" onPress={() => router.push(`/recipe/${recipe.id}/cook`)} />
        </View>
      </ContentColumn>
    </Screen>
  );
}
