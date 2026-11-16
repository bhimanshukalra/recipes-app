import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { sizes, spacing, useTheme } from "@/theme";

import { Text } from "./text";

export type AppBarProps = {
  title?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

/** Custom header. Use `headerShown: false` in Expo Router when using it. */
export function AppBar({ title, left, right }: AppBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: sizes.appBarHeight + insets.top,
        paddingTop: insets.top,
        // Side safe-area insets (landscape notch) are applied by the surrounding `Screen`.
        paddingHorizontal: spacing.sm,
        backgroundColor: colors.background,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
      }}>
      <View style={{ minWidth: sizes.appBarSide, alignItems: "flex-start" }}>{left}</View>
      <Text variant="heading" numberOfLines={1} style={{ flex: 1, textAlign: "center" }}>
        {title}
      </Text>
      <View style={{ minWidth: sizes.appBarSide, alignItems: "flex-end" }}>{right}</View>
    </View>
  );
}
