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
import { findDurations, formatClock, useCookTimers, type CookTimer } from "@/timers";
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

/** Running timers, shown on every tab and step so none is forgotten. */
function TimerBar({
  timers,
  now,
  onCancel,
  onOpen,
}: {
  timers: CookTimer[];
  now: number;
  onCancel: (timer: CookTimer) => void;
  onOpen: (step: number) => void;
}) {
  const { colors } = useTheme();
  if (timers.length === 0) return null;
  return (
    <View
      style={{
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        gap: spacing.sm,
      }}>
      {timers.map((timer) => {
        const remaining = (timer.endsAt - now) / 1000;
        const done = remaining <= 0;
        return (
          <View
            key={timer.key}
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderRadius: radius.pill,
              backgroundColor: done ? colors.danger : colors.surface,
              borderWidth: 1,
              borderColor: done ? colors.danger : colors.border,
              paddingLeft: spacing.lg,
            }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Go to step ${timer.step + 1}`}
              onPress={() => onOpen(timer.step)}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
                paddingVertical: spacing.sm,
              }}>
              <Text variant="heading" style={{ color: done ? colors.onAccent : colors.text }}>
                {done ? "Time's up" : formatClock(remaining)}
              </Text>
              <Text
                variant="muted"
                numberOfLines={1}
                style={{ flex: 1, color: done ? colors.onAccent : undefined }}>
                Step {timer.step + 1} · {timer.label}
              </Text>
            </Pressable>
            <IconButton
              symbol="close"
              label={done ? "Dismiss timer" : "Cancel timer"}
              tintColor={done ? colors.onAccent : colors.muted}
              onPress={() => onCancel(timer)}
            />
          </View>
        );
      })}
    </View>
  );
}

/** Cook mode: the screen stays on, text is large, ingredients can be ticked off, steps go one at a time. */
export default function CookScreen() {
  const { id, servings } = useLocalSearchParams<{
    id: string;
    servings?: string;
  }>();
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
  const { timers, now, start: startTimer, cancel: cancelTimer } = useCookTimers(recipe?.name ?? "Recipe");

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
  const durations = findDurations(recipe.steps[step] ?? "");

  return (
    <Screen>
      <AppBar title={recipe.name} left={backButton} />

      <ContentColumn>
        <View style={{ padding: spacing.lg }}>
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              {
                value: "ingredients",
                label: `Ingredients (${ticked.size}/${recipe.ingredients.length})`,
              },
              { value: "steps", label: "Steps" },
            ]}
          />
        </View>

        <TimerBar
          timers={timers}
          now={now}
          onCancel={cancelTimer}
          onOpen={(index) => {
            setTab("steps");
            setStep(index);
          }}
        />

        {tab === "ingredients" ? (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.xxxl,
            }}>
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
            <View
              style={{
                flexDirection: "row",
                gap: spacing.xs,
                paddingHorizontal: spacing.xxl,
              }}>
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
              <Text
                style={{
                  fontSize: fontSize.display,
                  lineHeight: fontSize.display * 1.35,
                }}>
                {recipe.steps[step]}
              </Text>
            </ScrollView>
            {/* Pinned above the buttons so a long step never pushes the timers out of sight. */}
            {durations.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  gap: spacing.sm,
                  paddingHorizontal: spacing.lg,
                  paddingBottom: spacing.sm,
                }}
                style={{ flexGrow: 0, flexShrink: 0 }}>
                {durations.map((duration, index) => {
                  const key = `${step}-${index}`;
                  const running = timers.some((timer) => timer.key === key);
                  return (
                    <Button
                      key={key}
                      label={running ? `${duration.label} · running` : `Start ${duration.label}`}
                      variant="secondary"
                      compact
                      disabled={running}
                      onPress={() => startTimer(key, step, duration.label, duration.seconds)}
                    />
                  );
                })}
              </ScrollView>
            ) : null}
            <View
              style={{
                flexDirection: "row",
                gap: spacing.md,
                padding: spacing.lg,
              }}>
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
