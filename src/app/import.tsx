import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator } from "react-native";

import { Button, EmptyState, Screen } from "@/components";
import { decodeRecipePayload } from "@/share-extension/extract-recipe";
import { toNewRecipe } from "@/share-extension/to-new-recipe";
import { saveRecipe } from "@/storage";

/**
 * Landing route for the share extension: `import?data=<base64url recipe>`.
 * Saves the recipe, then replaces itself with the recipe's detail screen.
 */
export default function ImportScreen() {
  const { data } = useLocalSearchParams<{ data?: string }>();
  const db = useSQLiteContext();
  const [saveFailed, setSaveFailed] = useState(false);
  const started = useRef(false);

  const compact = decodeRecipePayload(data);
  const recipe = compact ? toNewRecipe(compact) : undefined;

  useEffect(() => {
    if (!recipe || started.current) return;
    started.current = true;

    saveRecipe(db, recipe)
      .then((saved) => router.replace(`/recipe/${saved.id}`))
      .catch(() => setSaveFailed(true));
  }, [db, recipe]);

  if (!recipe || saveFailed) {
    return (
      <Screen edges={["top", "left", "right", "bottom"]}>
        <EmptyState
          title="Couldn't save this recipe"
          message={
            recipe
              ? "Something went wrong while saving it. Try sharing the page again."
              : "The shared page didn't contain a recipe the app could read."
          }
          action={<Button label="Go to my recipes" onPress={() => router.replace("/")} />}
        />
      </Screen>
    );
  }

  return (
    <Screen style={{ alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </Screen>
  );
}
