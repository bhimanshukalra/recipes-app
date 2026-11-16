import { openHostApp, type InitialProps } from "expo-share-extension";
import { Button, ScrollView, Text, View } from "react-native";

import { encodeRecipePayload, extractRecipe } from "./extract-recipe";

type PreprocessingResults = {
  url?: string;
  title?: string;
  jsonld?: string[];
};

export default function ShareExtension({
  preprocessingResults,
}: InitialProps) {
  const data = (preprocessingResults ?? {}) as PreprocessingResults;
  const blocks = data.jsonld ?? [];
  const { recipe, parseErrors } = extractRecipe(blocks, data.url);

  const payload = recipe ? encodeRecipePayload(recipe) : "";

  const lines = [
    `URL: ${data.url ?? "(none)"}`,
    `Title: ${data.title ?? "(none)"}`,
    `JSON-LD blocks: ${blocks.length}`,
    `Block lengths: ${blocks.map((b) => b.length).join(", ") || "-"}`,
    `Parse errors: ${parseErrors}`,
    `Recipe node: ${recipe ? "yes" : "no"}`,
    `Recipe name: ${recipe?.name ?? "-"}`,
    `Ingredients: ${recipe?.ingredients.length ?? 0}`,
    `Steps: ${recipe?.steps.length ?? 0}`,
    `Handoff payload (base64url chars): ${payload.length}`,
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: 24 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        {lines.map((line) => (
          <Text key={line} allowFontScaling={false} style={{ fontSize: 15 }}>
            {line}
          </Text>
        ))}
        {recipe ? (
          <Button
            title="Open in app"
            onPress={() => openHostApp(`recipe?data=${payload}`)}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}
