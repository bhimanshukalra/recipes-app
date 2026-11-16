import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { SymbolView } from "expo-symbols";
import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text as NestedText, TextInput, View } from "react-native";

import { AppBar, Button, ContentColumn, EmptyState, IconButton, Screen, Text, icons } from "@/components";
import { toDrafts, type GroceryItem } from "@/grocery";
import { formatIngredientAmount, parseIngredient } from "@/ingredients";
import {
  addToGroceryList,
  clearCheckedGroceryItems,
  deleteGroceryItem,
  listGroceryItems,
  setGroceryItemChecked,
} from "@/storage";
import { fontSize, opacity, radius, sizes, spacing, useTheme } from "@/theme";

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

export default function GroceryScreen() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [items, setItems] = useState<GroceryItem[] | undefined>(undefined);
  const [text, setText] = useState("");

  const reload = useCallback(() => listGroceryItems(db).then(setItems), [db]);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const toggle = (item: GroceryItem) => {
    const checked = !item.checked;
    setItems((current) => current?.map((other) => (other.id === item.id ? { ...other, checked } : other)));
    setGroceryItemChecked(db, item.id, checked);
  };

  const remove = (item: GroceryItem) => {
    setItems((current) => current?.filter((other) => other.id !== item.id));
    deleteGroceryItem(db, item.id);
  };

  const addOwn = async (value: string) => {
    const line = value.trim();
    if (!line) return;
    setText("");
    await addToGroceryList(db, toDrafts([parseIngredient(line)]));
    await reload();
  };

  const clearDone = async () => {
    await clearCheckedGroceryItems(db);
    await reload();
  };

  // Things still to buy first; ticked ones sink to the bottom.
  const sorted = items ? [...items].sort((a, b) => Number(a.checked) - Number(b.checked) || a.id - b.id) : [];
  const doneCount = sorted.filter((item) => item.checked).length;

  return (
    <Screen edges={["left", "right", "bottom"]}>
      <AppBar title="Grocery list" left={<IconButton symbol="back" label="Back" onPress={goBack} />} />
      <ContentColumn>
        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center", padding: spacing.lg }}>
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={(event) => addOwn(event.nativeEvent.text)}
            placeholder="Add an item, e.g. 2 lemons"
            placeholderTextColor={colors.muted}
            accessibilityLabel="New item"
            returnKeyType="done"
            style={{
              flex: 1,
              minHeight: sizes.compactButtonHeight,
              paddingHorizontal: spacing.md,
              fontSize: fontSize.body,
              color: colors.text,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
          />
          <Button label="Add" compact variant="secondary" disabled={!text.trim()} onPress={() => addOwn(text)} />
        </View>

        {items === undefined ? null : items.length === 0 ? (
          <EmptyState
            title="Your list is empty"
            message="Open a recipe and tap “Add to grocery list”, or add an item above."
          />
        ) : (
          <>
            <FlatList
              data={sorted}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ paddingHorizontal: spacing.lg }}
              renderItem={({ item }) => {
                const amount = formatIngredientAmount({ raw: "", qty: item.qty, unit: item.unit });
                return (
                  <View style={[styles.row, { borderBottomColor: colors.border }]}>
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: item.checked }}
                      onPress={() => toggle(item)}
                      style={({ pressed }) => [styles.main, pressed && { opacity: opacity.pressed }]}>
                      <SymbolView
                        name={item.checked ? icons.checked : icons.unchecked}
                        size={sizes.icon + 6}
                        tintColor={item.checked ? colors.accent : colors.muted}
                      />
                      <Text
                        style={{
                          flex: 1,
                          fontSize: fontSize.title,
                          opacity: item.checked ? opacity.subtle : 1,
                          textDecorationLine: item.checked ? "line-through" : "none",
                        }}>
                        {amount ? <NestedText style={{ fontWeight: "700" }}>{amount} </NestedText> : null}
                        {item.name}
                      </Text>
                    </Pressable>
                    <IconButton
                      symbol="close"
                      label={`Remove ${item.name}`}
                      tintColor={colors.muted}
                      onPress={() => remove(item)}
                    />
                  </View>
                );
              }}
            />
            {doneCount > 0 ? (
              <View style={{ padding: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
                <Button label={`Clear ${doneCount} done`} variant="secondary" onPress={clearDone} />
              </View>
            ) : null}
          </>
        )}
      </ContentColumn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  main: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
});
