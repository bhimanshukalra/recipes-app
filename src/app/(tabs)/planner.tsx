import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppBar, Button, ContentColumn, IconButton, Screen, Text } from "@/components";
import { toDrafts } from "@/grocery";
import { addDays, formatDay, formatWeek, toDateKey, weekDays, weekStart } from "@/planner";
import {
  addToGroceryList,
  listMealIngredients,
  listMeals,
  removeMeal,
  type Meal,
} from "@/storage";
import { opacity, spacing, useTheme } from "@/theme";

export default function PlannerScreen() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const today = toDateKey(new Date());
  const [start, setStart] = useState(() => weekStart(today));
  const [meals, setMeals] = useState<Meal[]>([]);
  const [added, setAdded] = useState(false);

  const days = weekDays(start);
  const end = days[6];

  // Reload whenever the tab is shown or the week changes, so meals added on the picker appear.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listMeals(db, start, addDays(start, 6)).then((list) => {
        if (!cancelled) setMeals(list);
      });
      return () => {
        cancelled = true;
      };
    }, [db, start]),
  );

  const changeWeek = (offset: number) => {
    setStart(addDays(start, offset * 7));
    setAdded(false);
  };

  const remove = (meal: Meal) => {
    setMeals((current) => current.filter((item) => item.id !== meal.id));
    setAdded(false);
    removeMeal(db, meal.id);
  };

  const addWeekToGroceries = async () => {
    setAdded(true);
    await addToGroceryList(db, toDrafts(await listMealIngredients(db, start, end)));
  };

  return (
    <Screen>
      <AppBar title="Meal plan" />
      <ContentColumn>
        <View style={styles.weekBar}>
          <IconButton symbol="back" label="Previous week" onPress={() => changeWeek(-1)} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go to this week"
            onPress={() => setStart(weekStart(today))}
            style={{ alignItems: "center" }}>
            <Text variant="heading">{formatWeek(start)}</Text>
            {start !== weekStart(today) ? <Text variant="muted">Tap for this week</Text> : null}
          </Pressable>
          <IconButton symbol="next" label="Next week" onPress={() => changeWeek(1)} />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}>
          {days.map((day) => {
            const dayMeals = meals.filter((meal) => meal.date === day);
            return (
              <View key={day} style={[styles.day, { borderBottomColor: colors.border }]}>
                <View style={styles.dayHeader}>
                  <Text variant="heading" style={day === today ? { color: colors.accent } : undefined}>
                    {formatDay(day)}
                    {day === today ? " · Today" : ""}
                  </Text>
                  <Button
                    label="Add"
                    variant="ghost"
                    compact
                    onPress={() => router.push(`/plan/add?date=${day}`)}
                  />
                </View>
                {dayMeals.map((meal) => (
                  <View key={meal.id} style={styles.meal}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => router.push(`/recipe/${meal.recipeId}`)}
                      style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: opacity.pressed }]}>
                      <Text numberOfLines={2}>{meal.name}</Text>
                    </Pressable>
                    <IconButton
                      symbol="close"
                      label={`Remove ${meal.name} from ${formatDay(day)}`}
                      tintColor={colors.muted}
                      onPress={() => remove(meal)}
                    />
                  </View>
                ))}
                {dayMeals.length === 0 ? <Text variant="muted">Nothing planned</Text> : null}
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <Button
            label={added ? "Added to grocery list" : "Add this week to grocery list"}
            variant="secondary"
            disabled={added || meals.length === 0}
            onPress={addWeekToGroceries}
          />
        </View>
      </ContentColumn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  weekBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  day: {
    paddingVertical: spacing.md,
    gap: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  meal: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
