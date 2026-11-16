import { useKeepAwake } from "expo-keep-awake";
import { router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppBar, Button, EmptyState, IconButton, Screen, Text, icons } from "@/components";
import { useRecipe } from "@/storage";
import { fontSize, opacity, sizes, spacing, useTheme } from "@/theme";

type Tab = "ingredients" | "steps";

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

/** Cook mode: the screen stays on, text is large, ingredients can be ticked off, steps go one at a time. */
export default function CookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = useRecipe(id);
  const { colors } = useTheme();

  const [tab, setTab] = useState<Tab>("ingredients");
  const [ticked, setTicked] = useState<ReadonlySet<number>>(new Set());
  const [step, setStep] = useState(0);

  // Holds the screen awake for as long as this screen is mounted.
  useKeepAwake();

  const backButton = <IconButton symbol="back" label="Close cook mode" onPress={goBack} />;

  if (!recipe) {
    return (
      <Screen>
        <AppBar title="Cook" left={backButton} />
        {recipe === null ? <EmptyState title="Recipe not found" message="It may have been deleted." /> : null}
      </Screen>
    );
  }

  const toggle = (index: number) =>
    setTicked((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const lastStep = recipe.steps.length - 1;

  return (
    <Screen>
      <AppBar title={recipe.name} left={backButton} />

      <View style={{ flexDirection: "row", gap: spacing.sm, padding: spacing.lg }}>
        <Button
          label={`Ingredients (${ticked.size}/${recipe.ingredients.length})`}
          compact
          variant={tab === "ingredients" ? "primary" : "secondary"}
          onPress={() => setTab("ingredients")}
          style={{ flex: 1 }}
        />
        <Button
          label="Steps"
          compact
          variant={tab === "steps" ? "primary" : "secondary"}
          onPress={() => setTab("steps")}
          style={{ flex: 1 }}
        />
      </View>

      {tab === "ingredients" ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}>
          {recipe.ingredients.map((ingredient, index) => {
            const done = ticked.has(index);
            return (
              <Pressable
                key={index}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
                onPress={() => toggle(index)}
                style={({ pressed }) => [
                  styles.row,
                  { borderBottomColor: colors.border },
                  pressed && { opacity: opacity.pressed },
                ]}>
                <SymbolView
                  name={done ? icons.checked : icons.unchecked}
                  size={sizes.icon + 6}
                  tintColor={done ? colors.accent : colors.muted}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: fontSize.title,
                    textDecorationLine: done ? "line-through" : "none",
                    opacity: done ? opacity.subtle : 1,
                  }}>
                  {ingredient.raw}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : recipe.steps.length === 0 ? (
        <EmptyState title="No steps" message="This recipe has no instructions." />
      ) : (
        <View style={{ flex: 1 }}>
          <Text variant="label" style={{ paddingHorizontal: spacing.xxl }}>
            Step {step + 1} of {recipe.steps.length}
          </Text>
          <ScrollView contentContainerStyle={{ padding: spacing.xxl }}>
            <Text style={{ fontSize: fontSize.display, lineHeight: fontSize.display * 1.35 }}>
              {recipe.steps[step]}
            </Text>
          </ScrollView>
          <View style={{ flexDirection: "row", gap: spacing.md, padding: spacing.lg }}>
            <Button
              label="Previous"
              variant="secondary"
              disabled={step === 0}
              onPress={() => setStep(step - 1)}
              style={{ flex: 1 }}
            />
            <Button
              label={step === lastStep ? "Done" : "Next"}
              onPress={() => (step === lastStep ? goBack() : setStep(step + 1))}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
