import { useTheme } from "@/context/ThemeContext";
import React from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { Colors } from "../theme/colors";
import { typography } from "../theme/typography";

type LoadingButtonProps = {
  title: string;
  loading?: boolean;
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
};

export default function LoadingButton({
  title,
  loading = false,
  disabled = false,
  onPress,
  style,
}: LoadingButtonProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        { backgroundColor: theme.primary, opacity: isDisabled ? 0.6 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.onSurface} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: theme.onSurface,
              fontFamily: typography.fonts.medium,
              fontSize: typography.fontSizes.body,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  text: {
    textAlign: "center",
  },
});
