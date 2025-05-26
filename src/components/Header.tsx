// src/components/Header.tsx
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "../hooks/useTheme";
import { Colors } from "../theme/colors";
import { typography } from "../theme/typography";

type HeaderProps = {
  onProfilePress?: () => void;
  onSearchChange?: (query: string) => void;
  showSearch?: boolean;
  iconName: any;
  iconState?: boolean;
  buttonStyle?: StyleProp<ViewStyle>; // <— aici
};

const Header: React.FC<HeaderProps> = ({
  onProfilePress,
  onSearchChange,
  showSearch = true,
  iconState = false,
  iconName,
  buttonStyle,
}) => {
  const { colorScheme } = useTheme();
  const isDarkMode = colorScheme === "dark";
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const [query, setQuery] = React.useState("");

  const handleChange = (text: string) => {
    setQuery(text);
    onSearchChange?.(text);
  };

  const styles = StyleSheet.create({
    container: {
      paddingTop: Platform.select({ ios: 50, android: 50 }),
      paddingHorizontal: 10,
      paddingBottom: 16,
      width: "90%",
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    title: {
      fontSize: typography.fontSizes.title,
      marginLeft: 8,
      fontFamily: typography.fonts.bold,
    },
    profileButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 20,
      borderRadius: 30,
      paddingHorizontal: 12,
      height: 40,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: typography.fontSizes.caption,
      fontFamily: typography.fonts.regular,
      padding: 0,
      marginTop: 3,
    },
  });

  return (
    <View style={[styles.container]}>
      {/* Rândul de sus: logo, titlu și buton profil */}
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <Feather name="zap" size={24} color={theme.primary} />
          <Text style={[styles.title, { color: theme.onBackground }]}>
            SportsApp
          </Text>
        </View>
        {iconState && (
          <TouchableOpacity
            onPress={onProfilePress}
            style={[
              styles.profileButton,
              iconState && { backgroundColor: theme.primary },
              buttonStyle, // <— îl punem la urmă, ca să poată suprascrie
            ]}
          >
            <Feather
              name={iconName}
              size={20}
              color={iconState ? theme.onSurface : theme.onBackground}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Bara de căutare */}
      {showSearch && (
        <View
          style={[
            styles.searchContainer,
            {
              borderWidth: 1.5,
              borderColor: theme.borderLight,
            },
          ]}
        >
          <Feather name="search" size={18} color={theme.primary} />
          <TextInput
            style={[styles.searchInput, { color: theme.onBackground }]}
            placeholder="Caută o echipă"
            placeholderTextColor={theme.textSecondary}
            value={query}
            onChangeText={handleChange}
            underlineColorAndroid="transparent"
            returnKeyType="search"
          />
        </View>
      )}
    </View>
  );
};

export default Header;
