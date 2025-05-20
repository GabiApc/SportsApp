// src/hooks/useTheme.ts
import { useGlobalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Appearance } from "react-native";

type ColorScheme = "light" | "dark";

export function useTheme(): {
  colorScheme: ColorScheme;
  toggleTheme: () => void;
} {
  const router = useRouter();
  const { colorScheme: rawScheme } = useGlobalSearchParams<{
    colorScheme?: string;
  }>();

  // validăm parametrul din URL
  const param: ColorScheme | undefined =
    rawScheme === "light" || rawScheme === "dark" ? rawScheme : undefined;

  // tema de sistem curentă
  const systemScheme = Appearance.getColorScheme() as ColorScheme;

  // starea locală pornește din param-ul URL (dacă există), altfel din sistem
  const [localScheme, setLocalScheme] = useState<ColorScheme>(
    param ?? systemScheme,
  );

  // dacă sistemul se schimbă (de ex. user trece în setările OS),
  // și NU avem override în URL, actualizăm
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      if (!param && (colorScheme === "light" || colorScheme === "dark")) {
        setLocalScheme(colorScheme);
      }
    });
    return () => sub.remove();
  }, [param]);

  // dacă URL-ul primește alt param, sincronizăm
  useEffect(() => {
    if (param && param !== localScheme) {
      setLocalScheme(param);
    }
  }, [param, localScheme]);

  // toggle între light/dark și scriem în URL ca override
  const toggleTheme = useCallback(() => {
    const next: ColorScheme = localScheme === "light" ? "dark" : "light";
    setLocalScheme(next);
    router.setParams({ colorScheme: next });
  }, [localScheme, router]);

  return { colorScheme: localScheme, toggleTheme };
}
