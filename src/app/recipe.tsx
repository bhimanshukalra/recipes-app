import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { decodeRecipePayload } from "@/share-extension/extract-recipe";

export default function RecipeScreen() {
  const { data } = useLocalSearchParams<{ data?: string }>();
  const recipe = decodeRecipePayload(data);

  if (!recipe) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 8 }}>
        <Text>No recipe received.</Text>
        <Text>
          data: {data === undefined ? "undefined" : `${data.length} chars, starts: ${data.slice(0, 60)}`}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "700" }}>{recipe.name}</Text>
      {recipe.image ? (
        <Image
          source={{ uri: recipe.image }}
          style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 12 }}
        />
      ) : null}
      <Text>
        {[recipe.recipeYield && `Yield: ${recipe.recipeYield}`, recipe.totalTime]
          .filter(Boolean)
          .join(" · ")}
      </Text>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>
        Ingredients ({recipe.ingredients.length})
      </Text>
      {recipe.ingredients.map((item, i) => (
        <Text key={i}>• {item}</Text>
      ))}
      <Text style={{ fontSize: 20, fontWeight: "600" }}>
        Steps ({recipe.steps.length})
      </Text>
      {recipe.steps.map((step, i) => (
        <Text key={i}>
          {i + 1}. {step}
        </Text>
      ))}
    </ScrollView>
  );
}
