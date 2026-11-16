import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";

import { colors, type ColorScheme, type Colors } from "./colors";

export type Theme = {
  colors: Colors;
  scheme: ColorScheme;
};

const ThemeContext = createContext<Theme>({
  colors: colors.light,
  scheme: "light",
});

/** Follows the system light/dark setting. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme: ColorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const value = useMemo<Theme>(
    () => ({ colors: colors[scheme], scheme }),
    [scheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
