import { View, type StyleProp, type ViewStyle } from "react-native";

import { sizes } from "@/theme";

export type ContentColumnProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Use the whole width, for screens that lay themselves out for wide windows (lists, the recipe page). */
  fullWidth?: boolean;
};

/** Fills the space, but never gets wider than `sizes.contentMaxWidth`, and stays centred. Keeps lines readable in landscape and on wide windows. */
export function ContentColumn({ children, style, fullWidth = false }: ContentColumnProps) {
  return (
    <View
      style={[{ flex: 1, width: "100%", maxWidth: fullWidth ? undefined : sizes.contentMaxWidth, alignSelf: "center" }, style]}>
      {children}
    </View>
  );
}
