// src/components/ProfileCard.tsx
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { Colors } from "../theme/colors";
import { typography } from "../theme/typography";

export type ProfileCardProps = {
  name: string;
  email: string;
  onEditPress?: () => void;
};

const ProfileCard: React.FC<ProfileCardProps> = ({
  name,
  email,
  onEditPress,
}) => {
  const { colorScheme, toggleTheme } = useTheme();
  const isDarkMode = colorScheme === "dark";
  const theme = isDarkMode ? Colors.dark : Colors.light;

  return (
    <View style={[styles.card, { backgroundColor: theme.background }]}>
      {/* avatar */}
      <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
        <Feather name="user" size={24} color={theme.onSurface} />
      </View>

      {/* name + email */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.onBackground }]}>{name}</Text>
        <Text
          style={[
            styles.email,
            {
              color: theme.textSecondary,
              fontFamily: typography.fonts.regular,
            },
          ]}
        >
          {email}
        </Text>
      </View>

      {/* edit button */}
      <TouchableOpacity
        onPress={onEditPress}
        style={[
          styles.editButton,
          { backgroundColor: theme.backgroundSecondary },
        ]}
        activeOpacity={0.7}
      >
        <Feather name="edit" size={22} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );
};

export default ProfileCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    width: "85%",
    padding: 16,
    borderRadius: 12,
    // shadow for iOS
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    // elevation for Android
    elevation: 10,
    marginVertical: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    marginHorizontal: 12,
  },
  name: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.fontSizes.body,
  },
  email: {
    fontSize: typography.fontSizes.caption,
    lineHeight: typography.lineHeights.caption,
    marginTop: 2,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
