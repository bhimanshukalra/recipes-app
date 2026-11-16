import { Pressable } from "react-native";

import { fontSize, opacity, radius, spacing, useTheme } from "@/theme";

import { Text } from "./text";

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** Spoken label, when the visible text is not enough ("Remove tag dinner"). */
  accessibilityLabel?: string;
};

/** A small pill for a filter or a tag. */
export function Chip({ label, selected = false, onPress, accessibilityLabel }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.border,
        backgroundColor: selected ? colors.accent : colors.surface,
        opacity: pressed ? opacity.pressed : 1,
      })}>
      <Text style={{ fontSize: fontSize.small, color: selected ? colors.onAccent : colors.text }}>{label}</Text>
    </Pressable>
  );
}
