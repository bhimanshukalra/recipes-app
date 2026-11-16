import { useState } from "react";
import { TextInput, View } from "react-native";

import { addTag } from "@/storage";
import { fontSize, radius, sizes, spacing, useTheme } from "@/theme";

import { Button } from "./button";
import { Chip } from "./chip";

export type TagEditorProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
  /** Tags already used on other recipes, offered as one-tap additions. */
  suggestions?: string[];
};

/** Shows a recipe's tags (tap one to remove it) and a box to add more. */
export function TagEditor({ tags, onChange, suggestions = [] }: TagEditorProps) {
  const { colors } = useTheme();
  const [text, setText] = useState("");

  const add = (value: string) => {
    const next = addTag(tags, value);
    if (next !== tags) onChange(next);
    setText("");
  };

  const unused = suggestions.filter((tag) => !tags.includes(tag));

  return (
    <View style={{ gap: spacing.md }}>
      {tags.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {tags.map((tag) => (
            <Chip
              key={tag}
              label={`${tag}  ✕`}
              accessibilityLabel={`Remove tag ${tag}`}
              selected
              onPress={() => onChange(tags.filter((existing) => existing !== tag))}
            />
          ))}
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
        <TextInput
          value={text}
          onChangeText={setText}
          // Use the text from the event, not state: on a fast keyboard the last character can still be in flight.
          onSubmitEditing={(event) => add(event.nativeEvent.text)}
          placeholder="Add a tag, e.g. dinner"
          placeholderTextColor={colors.muted}
          accessibilityLabel="New tag"
          autoCapitalize="none"
          autoCorrect={false}
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
        <Button label="Add" compact variant="secondary" disabled={!text.trim()} onPress={() => add(text)} />
      </View>

      {unused.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {unused.map((tag) => (
            <Chip key={tag} label={`+ ${tag}`} accessibilityLabel={`Add tag ${tag}`} onPress={() => add(tag)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
