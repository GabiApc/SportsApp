// src/context/ThemeContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Appearance } from "react-native";

type ColorScheme = "light" | "dark";
const STORAGE_KEY = "@theme_preference";

export const ThemeContext = createContext<{
  colorScheme: ColorScheme;
  toggleTheme: () => void;
} | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const system = (Appearance.getColorScheme() as ColorScheme) || "light";
  const [colorScheme, setColorScheme] = useState<ColorScheme>(system);

  // 1) on mount, read stored pref
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw === "light" || raw === "dark") {
        setColorScheme(raw);
      }
    })();
  }, []);

  // 2) whenever colorScheme changes (via toggle), persist it
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, colorScheme).catch(console.warn);
  }, [colorScheme]);

  const toggleTheme = useCallback(() => {
    setColorScheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return (
    <ThemeContext.Provider value={{ colorScheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
};
