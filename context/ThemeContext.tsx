// src/context/ThemeContext.tsx
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Appearance, ColorSchemeName } from "react-native";

type ColorScheme = Exclude<ColorSchemeName, "no-preference">;

interface ThemeContextType {
  colorScheme: ColorScheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colorScheme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  // track a user override (or null to follow system)
  const [override, setOverride] = useState<ColorScheme | null>(null);
  const [system, setSystem] = useState<ColorScheme>(
    (Appearance.getColorScheme() as ColorScheme) || "light",
  );

  // listen to OS changes
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme === "light" || colorScheme === "dark") {
        setSystem(colorScheme);
      }
    });
    return () => sub.remove();
  }, []);

  const colorScheme = override ?? system;
  const toggleTheme = () =>
    setOverride((current) => (current === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ colorScheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
