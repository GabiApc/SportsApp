import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import merge from "deepmerge";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  adaptNavigationTheme,
  MD3DarkTheme,
  MD3LightTheme,
  MD3Theme,
  PaperProvider,
} from "react-native-paper";

import { Colors } from "../theme/colors";
import { typography } from "../theme/typography";

import { useTheme } from "@/src/hooks/useTheme";

type ExtendedPaperTheme = MD3Theme & { typography: typeof typography };

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: { ...MD3DarkTheme.colors, ...Colors.dark },
  typography,
};
const customLightTheme = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, ...Colors.light },
  typography,
};

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const CombinedDefaultTheme = merge(
  LightTheme,
  customLightTheme,
) as ExtendedPaperTheme;
const CombinedDarkTheme = merge(
  DarkTheme,
  customDarkTheme,
) as ExtendedPaperTheme;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
  });

  // const colorScheme = useColorScheme();
  const { colorScheme } = useTheme();
  const paperTheme =
    colorScheme === "dark" ? CombinedDarkTheme : CombinedDefaultTheme;

  if (!fontsLoaded) {
    return null; // or a loading spinner
  }
  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : LightTheme}>
        <Stack>
          <Stack.Screen name="details" options={{ headerShown: false }} />

          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </PaperProvider>
  );
}
