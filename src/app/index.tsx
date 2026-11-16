import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { FlatList, ScrollView, View } from "react-native";

import {
  AppBar,
  Button,
  Chip,
  ContentColumn,
  EmptyState,
  IconButton,
  RecipeRow,
  Screen,
  SearchField,
} from "@/components";
import {
  collectTags,
  filterRecipes,
  hasActiveFilter,
  listRecipes,
  recipeMeta,
  setFavourite,
  type Recipe,
} from "@/storage";
import { spacing } from "@/theme";

export default function RecipesScreen() {
  const db = useSQLiteContext();
  const [recipes, setRecipes] = useState<Recipe[] | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);

  // Reload whenever the screen is shown, so imports, tag edits and favourites made elsewhere appear.
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

  const toggleFavourite = (recipe: Recipe) => {
    const favourite = !recipe.favourite;
    setRecipes((current) => current?.map((item) => (item.id === recipe.id ? { ...item, favourite } : item)));
    setFavourite(db, recipe.id, favourite);
  };

  const tags = recipes ? collectTags(recipes) : [];
  // A tag that no recipe has any more (it was removed elsewhere) should not keep filtering.
  const tag = selectedTag && tags.includes(selectedTag) ? selectedTag : undefined;
  const filter = { query, favouritesOnly, tag };
  const visible = recipes ? filterRecipes(recipes, filter) : [];

  const clearFilters = () => {
    setQuery("");
    setFavouritesOnly(false);
    setSelectedTag(undefined);
  };

  return (
    <Screen>
      <AppBar
        title="Recipes"
        right={<IconButton symbol="cart" label="Grocery list" onPress={() => router.push("/grocery")} />}
      />
      <ContentColumn>
        {recipes === undefined ? null : recipes.length === 0 ? (
          <EmptyState
            title="No recipes yet"
            message="Open a recipe in Safari, tap Share, and choose this app to save it."
          />
        ) : (
          <>
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md }}>
              <SearchField value={query} onChangeText={setQuery} placeholder="Search recipes and ingredients" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
                <Chip
                  label="Favourites"
                  selected={favouritesOnly}
                  onPress={() => setFavouritesOnly(!favouritesOnly)}
                />
                {tags.map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    selected={name === tag}
                    accessibilityLabel={`Tag ${name}`}
                    onPress={() => setSelectedTag(name === tag ? undefined : name)}
                  />
                ))}
              </ScrollView>
            </View>

            {visible.length === 0 ? (
              <EmptyState
                title="No matching recipes"
                message="Try a different word, or clear the filters."
                action={
                  hasActiveFilter(filter) ? (
                    <Button label="Clear filters" variant="secondary" onPress={clearFilters} />
                  ) : undefined
                }
              />
            ) : (
              <FlatList
                data={visible}
                keyExtractor={(item) => String(item.id)}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                renderItem={({ item }) => (
                  <RecipeRow
                    name={item.name}
                    image={item.image}
                    meta={recipeMeta(item) || undefined}
                    favourite={item.favourite}
                    onToggleFavourite={() => toggleFavourite(item)}
                    onPress={() => router.push(`/recipe/${item.id}`)}
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
