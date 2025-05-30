// src/app/_layout.tsx
import {
  DarkTheme as NavDark,
  DefaultTheme as NavDefault,
} from "@react-navigation/native";
import merge from "deepmerge";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  adaptNavigationTheme,
  MD3DarkTheme,
  MD3LightTheme,
  MD3Theme,
  PaperProvider,
} from "react-native-paper";

import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  prefetchFavorites,
  prefetchLeagueTable,
  prefetchTeam,
} from "../services/cache";
import { Colors } from "../theme/colors";
import { typography } from "../theme/typography";
const USER_KEY = "@cached_user";

const customDark = {
  ...MD3DarkTheme,
  colors: { ...MD3DarkTheme.colors, ...Colors.dark },
  typography,
};
const customLight = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, ...Colors.light },
  typography,
};
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavDefault,
  reactNavigationDark: NavDark,
});
const CombinedLight = merge(LightTheme, customLight) as MD3Theme & {
  typography: typeof typography;
};
const CombinedDark = merge(DarkTheme, customDark) as MD3Theme & {
  typography: typeof typography;
};

function AppContent() {
  const { colorScheme } = useTheme();
  const paperTheme = colorScheme === "dark" ? CombinedDark : CombinedLight;
  const { user } = useAuth();

  useEffect(() => {
    // global prefetch
    prefetchTeam("English Premier League");
    prefetchLeagueTable("4328", "2024-2025");
  }, []);

  useEffect(() => {
    (async () => {
      // 1) Încearcă din cache
      const json = await AsyncStorage.getItem(USER_KEY);
      if (json) {
        const cached: { id: string } = JSON.parse(json);
        if (cached.id) {
          console.log("Prefetch from cache:", cached.id);

          prefetchFavorites(cached.id);
          return;
        }
      }
      // 2) Dacă nu e în cache, încearcă din auth
      if (user?.id) {
        console.log("Prefetch from auth:", user.id);
        prefetchFavorites(user.id);
      }
    })();
  }, [user]);

  return (
    <PaperProvider theme={paperTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="details/[teamId]"
          options={{ headerShown: false }}
        />
      </Stack>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </PaperProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
