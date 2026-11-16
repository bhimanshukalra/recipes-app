import { useKeepAwake } from "expo-keep-awake";
import { router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import { PanResponder, Pressable, ScrollView, StyleSheet, Text as NestedText, View } from "react-native";

import {
  AppBar,
  Button,
  ContentColumn,
  EmptyState,
  IconButton,
  Screen,
  SegmentedControl,
  Text,
  icons,
} from "@/components";
import { formatIngredientAmount, parseServings, scaleIngredients, type Ingredient } from "@/ingredients";
import { useRecipe } from "@/storage";
import { fontSize, opacity, radius, sizes, spacing, useTheme } from "@/theme";

type Tab = "ingredients" | "steps";

/** How far a horizontal drag must go, in points, to count as a swipe between steps. */
const SWIPE_DISTANCE = 50;

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

/** Amount in bold, then the name, then any note smaller underneath. Falls back to the raw line. */
function IngredientLine({ ingredient, done }: { ingredient: Ingredient; done: boolean }) {
  const amount = formatIngredientAmount(ingredient);
  return (
    <View style={{ flex: 1, gap: spacing.xs, opacity: done ? opacity.subtle : 1 }}>
      <Text
        style={{
          fontSize: fontSize.title,
          textDecorationLine: done ? "line-through" : "none",
        }}>
        {ingredient.name === undefined ? (
          ingredient.raw
        ) : (
          <>
            {amount ? <NestedText style={{ fontWeight: "700" }}>{amount} </NestedText> : null}
            {ingredient.name}
          </>
        )}
      </Text>
      {ingredient.name !== undefined && ingredient.note ? (
        <Text variant="muted">{ingredient.note}</Text>
      ) : null}
    </View>
  );
}

/** Cook mode: the screen stays on, text is large, ingredients can be ticked off, steps go one at a time. */
export default function CookScreen() {
  const { id, servings } = useLocalSearchParams<{ id: string; servings?: string }>();
  const recipe = useRecipe(id);
  // Servings picked on the detail screen scale the amounts here too.
  const base = parseServings(recipe?.recipeYield);
  const wanted = Number(servings);
  const factor = base && wanted > 0 ? wanted / base.count : 1;
  const ingredients = recipe ? scaleIngredients(recipe.ingredients, factor) : [];
  const { colors } = useTheme();

  const [tab, setTab] = useState<Tab>("ingredients");
  const [ticked, setTicked] = useState<ReadonlySet<number>>(new Set());
  const [step, setStep] = useState(0);

  // Holds the screen awake for as long as this screen is mounted.
  useKeepAwake();

  const stepCount = recipe?.steps.length ?? 0;

  // Swipe left for the next step, right for the previous one. Only mostly-horizontal
  // drags are claimed, so the step text can still be scrolled up and down.
  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) > 20 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 2,
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dx <= -SWIPE_DISTANCE) setStep((current) => Math.min(current + 1, stepCount - 1));
          else if (gesture.dx >= SWIPE_DISTANCE) setStep((current) => Math.max(current - 1, 0));
        },
      }),
    [stepCount],
  );

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

  const lastStep = stepCount - 1;

  return (
    <Screen>
      <AppBar title={recipe.name} left={backButton} />

      <ContentColumn>
        <View style={{ padding: spacing.lg }}>
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: "ingredients", label: `Ingredients (${ticked.size}/${recipe.ingredients.length})` },
              { value: "steps", label: "Steps" },
            ]}
          />
        </View>

        {tab === "ingredients" ? (
          <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}>
            {ingredients.map((ingredient, index) => {
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
                  <IngredientLine ingredient={ingredient} done={done} />
                </Pressable>
              );
            })}
          </ScrollView>
        ) : stepCount === 0 ? (
          <EmptyState title="No steps" message="This recipe has no instructions." />
        ) : (
          <View style={{ flex: 1 }} {...swipe.panHandlers}>
            {/* Tap a segment to jump to that step. The bar is thin, so the tap area is taller. */}
            <View style={{ flexDirection: "row", gap: spacing.xs, paddingHorizontal: spacing.xxl }}>
              {recipe.steps.map((_, index) => (
                <Pressable
                  key={index}
                  accessibilityRole="button"
                  accessibilityLabel={`Go to step ${index + 1}`}
                  accessibilityState={{ selected: index === step }}
                  onPress={() => setStep(index)}
                  style={{ flex: 1, paddingVertical: spacing.md }}>
                  <View
                    style={{
                      height: 4,
                      borderRadius: radius.pill,
                      backgroundColor: index <= step ? colors.accent : colors.border,
                    }}
                  />
                </Pressable>
              ))}
            </View>
            <Text variant="label" style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.md }}>
              Step {step + 1} of {stepCount}
            </Text>
            <ScrollView contentContainerStyle={{ padding: spacing.xxl }}>
              <Text style={{ fontSize: fontSize.display, lineHeight: fontSize.display * 1.35 }}>
                {recipe.steps[step]}
              </Text>
            </ScrollView>
            <View style={{ flexDirection: "row", gap: spacing.md, padding: spacing.lg }}>
              {/* Next is the button you press most, so it gets two thirds of the row; Previous is quiet. */}
              <Button
                label="Previous"
                variant="ghost"
                disabled={step === 0}
                onPress={() => setStep(step - 1)}
                style={{ flex: 1 }}
              />
              <Button
                label={step === lastStep ? "Done" : "Next"}
                onPress={() => (step === lastStep ? goBack() : setStep(step + 1))}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        )}
      </ContentColumn>
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
