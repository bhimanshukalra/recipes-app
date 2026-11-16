import { Text as RNText, type TextProps } from "react-native";

import { typography, useTheme, type TypographyVariant } from "@/theme";

export type AppTextProps = TextProps & {
  variant?: TypographyVariant;
};

/** Themed text. `label` and `muted` use the muted colour, the rest use the text colour. */
export function Text({ variant = "body", style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const color = variant === "label" || variant === "muted" ? colors.muted : colors.text;
  return <RNText style={[typography[variant], { color }, style]} {...rest} />;
}
