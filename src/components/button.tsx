import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { opacity, radius, sizes, spacing, useTheme } from "@/theme";

import { Text } from "./text";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  compact?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Pill button. */
export function Button({
  label,
  onPress,
  variant = "primary",
  compact = false,
  disabled = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();

  const labelColor =
    variant === "primary" ? colors.onAccent : variant === "danger" ? colors.danger : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          paddingHorizontal: compact ? spacing.lg : spacing.xl,
          minHeight: compact ? sizes.compactButtonHeight : sizes.buttonHeight,
        },
        variant === "primary" && { backgroundColor: colors.accent },
        variant === "secondary" && {
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: colors.border,
        },
        disabled ? { opacity: opacity.disabled } : pressed && { opacity: opacity.pressed },
        style,
      ]}>
      <Text variant="heading" style={{ color: labelColor }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
  },
});
