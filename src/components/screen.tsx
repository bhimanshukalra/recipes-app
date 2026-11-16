import { View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme";

type Edge = "top" | "right" | "bottom" | "left";

export type ScreenProps = {
  children?: React.ReactNode;
  /** Which safe-area insets to pad. The AppBar handles the top inset, so it is off by default. */
  edges?: Edge[];
  /** Override the background colour. */
  background?: string;
  style?: StyleProp<ViewStyle>;
};

const DEFAULT_EDGES: Edge[] = ["left", "right", "bottom"];

/** Full-screen container with the themed background and safe-area padding. */
export function Screen({ children, edges = DEFAULT_EDGES, background, style }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: background ?? colors.background,
          paddingTop: edges.includes("top") ? insets.top : 0,
          paddingRight: edges.includes("right") ? insets.right : 0,
          paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
          paddingLeft: edges.includes("left") ? insets.left : 0,
        },
        style,
      ]}>
      {children}
    </View>
  );
}
