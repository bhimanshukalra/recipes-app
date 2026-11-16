import { SymbolView } from "expo-symbols";
import { TextInput, View } from "react-native";

import { fontSize, radius, sizes, spacing, useTheme } from "@/theme";

import { IconButton } from "./icon-button";
import { icons } from "./icons";

export type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

/** A rounded search box with a magnifier, and a clear button once there is text. */
export function SearchField({ value, onChangeText, placeholder = "Search" }: SearchFieldProps) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingLeft: spacing.md,
        minHeight: sizes.buttonHeight - spacing.md,
        borderRadius: radius.pill,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
      <SymbolView name={icons.search} size={sizes.icon - 4} tintColor={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={{ flex: 1, fontSize: fontSize.body, color: colors.text, paddingVertical: spacing.sm }}
      />
      {value ? (
        <IconButton symbol="close" label="Clear search" tintColor={colors.muted} onPress={() => onChangeText("")} />
      ) : null}
    </View>
  );
}
