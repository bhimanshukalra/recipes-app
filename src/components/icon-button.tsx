import { SymbolView } from "expo-symbols";
import { Pressable, type ColorValue } from "react-native";

import { opacity, radius, sizes, useTheme } from "@/theme";

import { icons, type IconName } from "./icons";

export type IconButtonProps = {
  symbol: IconName;
  onPress: () => void;
  /** Accessibility label. */
  label: string;
  tintColor?: ColorValue;
};

/** 44x44 round icon button. */
export function IconButton({ symbol, onPress, label, tintColor }: IconButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: sizes.tapTarget,
          height: sizes.tapTarget,
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
        },
        pressed && { opacity: opacity.pressed },
      ]}>
      <SymbolView name={icons[symbol]} size={sizes.icon} tintColor={tintColor ?? colors.text} />
    </Pressable>
  );
}
