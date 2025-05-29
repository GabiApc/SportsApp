import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Appearance } from "react-native";

type Scheme = "light" | "dark";

interface ThemeContextProps {
  colorScheme: Scheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  colorScheme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = (Appearance.getColorScheme() as Scheme) ?? "light";
  const [colorScheme, setColorScheme] = useState<Scheme>(system);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      // dacă n-a fost override-uit manual, reflectă schimbările OS
      setColorScheme((prev) =>
        prev === system ? (colorScheme as Scheme) : prev,
      );
    });
    return () => sub.remove();
  }, [system]);

  const toggleTheme = () =>
    setColorScheme((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ colorScheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
