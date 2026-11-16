import { Pressable, View } from "react-native";

import { fontSize, radius, sizes, spacing, useTheme } from "@/theme";

import { Text } from "./text";

export type SegmentedControlOption<T extends string> = {
  value: T;
  label: string;
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** A quiet switch between a few views. The accent colour is left for real actions. */
export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        padding: spacing.xs,
        gap: spacing.xs,
        borderRadius: radius.md,
        backgroundColor: colors.border,
      }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              minHeight: sizes.compactButtonHeight,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.md - spacing.xs,
              backgroundColor: selected ? colors.surface : "transparent",
            }}>
            <Text
              style={{
                fontSize: fontSize.label,
                fontWeight: selected ? "600" : "400",
                color: selected ? colors.text : colors.muted,
              }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
