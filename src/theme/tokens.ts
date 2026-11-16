import type { TextStyle } from "react-native";

/** All values are in points (dp). */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  xs: 2,
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const fontSize = {
  caption: 13,
  small: 14,
  label: 15,
  body: 17,
  title: 22,
} as const;

export const opacity = {
  disabled: 0.4,
  pressed: 0.7,
  subtle: 0.6,
} as const;

/** Fixed component dimensions. */
export const sizes = {
  /** IconButton (Apple minimum tap target). */
  tapTarget: 44,
  /** Icon glyph size. */
  icon: 22,
  /** AppBar height, plus the top inset. */
  appBarHeight: 56,
  /** Min width of the AppBar left/right slots, keeps the title centred. */
  appBarSide: 88,
  buttonHeight: 50,
  compactButtonHeight: 38,
  /** RecipeRow image. */
  thumbnail: 64,
  /** Max width of list and detail content on wide windows. */
  contentMaxWidth: 640,
} as const;

export type TypographyVariant = "title" | "heading" | "body" | "label" | "muted";

/** Text variants used by `Text`. Colour comes from the theme, not from here. */
export const typography: Record<TypographyVariant, TextStyle> = {
  title: { fontSize: fontSize.title, fontWeight: "700" },
  heading: { fontSize: fontSize.body, fontWeight: "600" },
  body: { fontSize: fontSize.body },
  label: { fontSize: fontSize.label },
  muted: { fontSize: fontSize.small },
};

export const tokens = {
  spacing,
  radius,
  fontSize,
  opacity,
  sizes,
  typography,
};
