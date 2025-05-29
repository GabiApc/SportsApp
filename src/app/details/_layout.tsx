// app/details/_layout.tsx
import { useTheme } from "@/src/hooks/useTheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

export default function DetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { colorScheme } = useTheme();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {children}
    </ThemeProvider>
  );
}
