// src/components/Toast.tsx
import { Colors } from "@/src/theme/colors";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { typography } from "../theme/typography";

const { width } = Dimensions.get("window");

type ToastProps = {
  /** The text to show */
  message: string;
  /** When true, toast appears; when false, it hides */
  visible: boolean;
  /** How long (ms) before auto‐hide */
  duration?: number;
  /** Callback after hide animation completes */
  onHide?: () => void;
};

export default function Toast({
  message,
  visible,
  duration = 3000,
  onHide,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const styles = StyleSheet.create({
    container: {
      zIndex: 10,
      position: "absolute",
      bottom: 150,
      alignSelf: "center",
      width: width * 0.9,
      backgroundColor: Colors.light.primary, // or Colors.dark.secondary if you theme it
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      elevation: 6,
    } as ViewStyle,
    text: {
      color: "#fff",
      textAlign: "center",
      fontSize: typography.fontSizes.caption,
      fontFamily: typography.fonts.regular,
    },
  });
  useEffect(() => {
    if (visible) {
      // enter
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // auto hide
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 70,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onHide?.());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}
