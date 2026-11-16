export type Colors = {
  background: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  danger: string;
  /** Text on an accent-coloured fill. */
  onAccent: string;
};

export type ColorScheme = "light" | "dark";

const dark: Colors = {
  background: "#0B0B0F",
  surface: "#17171F",
  border: "#2A2A36",
  text: "#F5F5F7",
  muted: "#8E8E9A",
  accent: "#3DA9FC",
  danger: "#FF453A",
  onAccent: "#00121F",
};

const light: Colors = {
  background: "#F5F5F7",
  surface: "#FFFFFF",
  border: "#D8D8E0",
  text: "#111114",
  muted: "#6B6B76",
  accent: "#2B9CF0",
  danger: "#D70015",
  onAccent: "#00121F",
};

export const colors: Record<ColorScheme, Colors> = { light, dark };
