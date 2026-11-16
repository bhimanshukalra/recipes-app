import { View, type StyleProp, type ViewStyle } from "react-native";

import { sizes } from "@/theme";

export type ContentColumnProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Fills the space, but never gets wider than `sizes.contentMaxWidth`, and stays centred. Keeps lines readable in landscape and on wide windows. */
export function ContentColumn({ children, style }: ContentColumnProps) {
  return (
    <View
      style={[{ flex: 1, width: "100%", maxWidth: sizes.contentMaxWidth, alignSelf: "center" }, style]}>
      {children}
    </View>
  );
}
