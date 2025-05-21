import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Colors } from "../../theme/colors";

import { useTheme } from "@/src/hooks/useTheme";
import { StyleSheet, TouchableWithoutFeedback, View } from "react-native";

export default function TabLayout() {
  const { colorScheme } = useTheme();
  const isDarkMode = colorScheme === "dark";
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const styles = StyleSheet.create({
    tabBar: {
      position: "absolute",
      bottom: 35,
      height: 60,
      marginHorizontal: 30,
      borderRadius: 50,
      paddingTop: 11,
      borderTopWidth: 0, // fără linie nativă
      borderTopColor: "transparent", // fără linie nativă
      // umbre
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      backgroundColor: theme.backgroundSecondary,
    },
    iconWrapper: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    activeIconWrapper: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
    },
  });

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          ...styles.tabBar,
        },
        tabBarButton: (props) => {
          const { onPress, style, children } = props as any;
          return (
            <TouchableWithoutFeedback onPress={onPress}>
              <View style={style}>{children}</View>
            </TouchableWithoutFeedback>
          );
        },

        tabBarIcon: ({ focused }) => {
          let iconName: React.ComponentProps<typeof Feather>["name"];
          if (route.name === "index") iconName = "home";
          else if (route.name === "saved") iconName = "heart";
          else iconName = "settings";

          return (
            <View
              style={
                focused
                  ? {
                      ...styles.activeIconWrapper,
                      backgroundColor: theme.primary, // bula activă
                    }
                  : styles.iconWrapper
              }
            >
              <Feather
                name={iconName}
                size={24}
                color={
                  focused
                    ? theme.textPrimary // iconiță pe bula colorată
                    : theme.onBackground // iconiță inactivă
                }
              />
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
