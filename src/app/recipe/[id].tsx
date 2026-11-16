import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";

import {
  AppBar,
  Button,
  ContentColumn,
  EmptyState,
  IconButton,
  Screen,
  SectionHeader,
  Stepper,
  TagEditor,
  Text,
} from "@/components";
import { toDrafts } from "@/grocery";
import { formatIngredientLine, parseServings, scaleIngredients } from "@/ingredients";
import {
  addToGroceryList,
  collectTags,
  deleteRecipe,
  listRecipes,
  recipeMeta,
  setFavourite,
  setTags,
  useRecipe,
} from "@/storage";
import { radius, spacing, useTheme } from "@/theme";

/** Window width, in points, from which the recipe page uses two columns. */
const WIDE_WIDTH = 700;

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const loaded = useRecipe(id);
  const { width } = useWindowDimensions();
  // On a wide window (the Duo open, landscape) put the picture and tags beside the method.
  const wide = width >= WIDE_WIDTH;

  // Favourite and tags change on this screen, so keep the user's edits over the loaded copy.
  const [edits, setEdits] = useState<{ favourite?: boolean; tags?: string[] }>({});
  const recipe = loaded ? { ...loaded, ...edits } : loaded;

  // Tags already used on other recipes, offered as one-tap suggestions.
  const [added, setAdded] = useState(false);
  // Servings the user picked; undefined means the recipe as published.
  const [servings, setServings] = useState<number | undefined>(undefined);
  const [knownTags, setKnownTags] = useState<string[]>([]);
  useEffect(() => {
    listRecipes(db).then((all) => setKnownTags(collectTags(all)));
  }, [db]);

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
  const base = parseServings(recipe.recipeYield);
  const target = base ? (servings ?? base.count) : undefined;
  const factor = base && target ? target / base.count : 1;
  const ingredients = scaleIngredients(recipe.ingredients, factor);

  const overview = (
    <>
      <Text variant="title">{recipe.name}</Text>
      {recipe.image ? (
        <Image
          source={{ uri: recipe.image }}
          style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: radius.md }}
        />
      ) : null}
      {meta ? <Text variant="muted">{meta}</Text> : null}
      <SectionHeader title="Tags" />
      <TagEditor
        tags={recipe.tags}
        suggestions={knownTags}
        onChange={(tags) => {
          setEdits((current) => ({ ...current, tags }));
          setTags(db, recipe.id, tags);
        }}
      />
    </>
  );

  const method = (
    <>
      <SectionHeader title="Ingredients" count={recipe.ingredients.length} />
      {base && target ? (
        <Stepper
          value={target}
          label={base.label}
          onChange={(value) => {
            setServings(value);
            setAdded(false);
          }}
        />
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <Button
          label={added ? "Added to grocery list" : "Add to grocery list"}
          variant="secondary"
          compact
          disabled={added || recipe.ingredients.length === 0}
          onPress={() => {
            setAdded(true);
            addToGroceryList(db, toDrafts(ingredients));
          }}
        />
        {added ? (
          <Button label="View list" variant="ghost" compact onPress={() => router.navigate("/grocery")} />
        ) : null}
      </View>
      {ingredients.map((item, i) => (
        <Text key={i}>• {factor === 1 ? item.raw : formatIngredientLine(item)}</Text>
      ))}
      <SectionHeader title="Steps" count={recipe.steps.length} />
      {recipe.steps.map((step, i) => (
        <Text key={i}>
          {i + 1}. {step}
        </Text>
      ))}
    </>
  );

  return (
    <Screen edges={["left", "right", "bottom"]}>
      <AppBar
        title="Recipe"
        left={backButton}
        right={
          <View style={{ flexDirection: "row" }}>
            <IconButton
              symbol={recipe.favourite ? "favourited" : "favourite"}
              label={recipe.favourite ? "Remove from favourites" : "Add to favourites"}
              tintColor={recipe.favourite ? colors.danger : colors.text}
              onPress={() => {
                const favourite = !recipe.favourite;
                setEdits((current) => ({ ...current, favourite }));
                setFavourite(db, recipe.id, favourite);
              }}
            />
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
      <ContentColumn fullWidth>
        <ScrollView contentContainerStyle={{ padding: spacing.xxl }}>
          {wide ? (
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.xxl }}>
              <View style={{ flex: 1, gap: spacing.md }}>{overview}</View>
              <View style={{ flex: 1.3, gap: spacing.md }}>{method}</View>
            </View>
          ) : (
            <View style={{ gap: spacing.md }}>
              {overview}
              {method}
            </View>
          )}
        </ScrollView>
        {/* Pinned outside the scroll area so it is always one tap away. */}
        <View
          style={{
            padding: spacing.lg,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}>
          <Button
            label="Start cooking"
            onPress={() => router.push(`/recipe/${recipe.id}/cook?servings=${factor === 1 ? "" : target}`)}
          />
        </View>
      </ContentColumn>
    </Screen>
  );
}
