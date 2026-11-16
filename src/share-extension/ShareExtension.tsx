import { close, openHostApp, Text, View, type InitialProps } from "expo-share-extension";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Pressable } from "react-native";

import { fontSize, opacity, radius, sizes, spacing, ThemeProvider, useTheme } from "@/theme";

import { encodeRecipePayload, extractRecipe, isUsableRecipe } from "./extract-recipe";

type PreprocessingResults = {
  url?: string;
  title?: string;
  jsonld?: string[];
};

/**
 * The share sheet UI. A page with a recipe is handed to the app straight away;
 * anything else shows why nothing was saved. Uses the Text and View exported by
 * expo-share-extension, because the default Text has a font-scaling problem here.
 */
export default function ShareExtension(props: InitialProps) {
  return (
    <ThemeProvider>
      <Content {...props} />
    </ThemeProvider>
  );
}

function Content({ preprocessingResults }: InitialProps) {
  const { colors } = useTheme();
  const handedOff = useRef(false);

  const data = (preprocessingResults ?? {}) as PreprocessingResults;
  const blocks = data.jsonld ?? [];
  const { recipe } = extractRecipe(blocks, data.url);
  const usable = isUsableRecipe(recipe) && !!recipe.url ? recipe : undefined;

  const payload = usable ? encodeRecipePayload(usable) : undefined;

  useEffect(() => {
    if (!payload || handedOff.current) return;
    handedOff.current = true;
    openHostApp(`import?data=${payload}`);
  }, [payload]);

  const message = !blocks.length
    ? "This page doesn't contain recipe data."
    : recipe && !isUsableRecipe(recipe)
      ? "The recipe on this page has no ingredients or steps."
      : "This page doesn't contain a recipe the app can read.";

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.md,
        padding: spacing.xxl,
        backgroundColor: colors.background,
      }}>
      {usable ? (
        <>
          <ActivityIndicator />
          <Text allowFontScaling={false} style={{ fontSize: fontSize.body, color: colors.text }}>
            Saving recipe…
          </Text>
        </>
      ) : (
        <>
          <Text
            allowFontScaling={false}
            style={{
              fontSize: fontSize.title,
              fontWeight: "700",
              color: colors.text,
              textAlign: "center",
            }}>
            No recipe found
          </Text>
          <Text
            allowFontScaling={false}
            style={{ fontSize: fontSize.small, color: colors.muted, textAlign: "center" }}>
            {message}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={close}
            style={({ pressed }) => ({
              marginTop: spacing.md,
              minHeight: sizes.compactButtonHeight,
              paddingHorizontal: spacing.xl,
              borderRadius: radius.pill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.accent,
              opacity: pressed ? opacity.pressed : 1,
            })}>
            <Text
              allowFontScaling={false}
              style={{ fontSize: fontSize.body, fontWeight: "600", color: colors.onAccent }}>
              Close
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
