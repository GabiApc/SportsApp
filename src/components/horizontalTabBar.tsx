// src/components/HorizontalTabBar.tsx
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { Colors } from "../theme/colors";
import { typography } from "../theme/typography";

export type HorizontalTabBarProps = {
  /** List of tab labels */
  tabs: string[];
  /** Currently active tab label */
  activeTab: string;
  /** Called when the user taps a tab */
  onTabPress: (tab: string) => void;
};

const HorizontalTabBar: React.FC<HorizontalTabBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
}) => {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? Colors.dark : Colors.light;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <Pressable
              key={tab}
              onPress={() => onTabPress(tab)}
              style={[
                styles.tab,
                {
                  backgroundColor: isActive
                    ? theme.primary
                    : theme.backgroundSecondary,
                  borderColor: theme.borderLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? theme.onSurface : theme.textSecondary,
                  },
                ]}
              >
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default HorizontalTabBar;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {},
  tab: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  label: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.fontSizes.caption,
  },
});
