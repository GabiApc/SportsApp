// src/components/ConfirmationModal.tsx
import React from "react";
import {
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useTheme } from "../hooks/useTheme";
import { Colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { hexToRgba } from "../utils/HexToRgba";

export type ConfirmationModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText = "DA!",
  cancelText = "NU",
  onConfirm,
  onCancel,
}) => {
  const { colorScheme, toggleTheme } = useTheme();
  const isDarkMode = colorScheme === "dark";
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: isDarkMode
        ? hexToRgba(theme.textPrimary, 0.4)
        : "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 16,
    },
    card: {
      width: "100%",
      maxWidth: 320,
      borderRadius: 12,
      padding: 25,
      paddingVertical: 35,
    },
    title: {
      fontFamily: typography.fonts.medium,
      textAlign: "center",
      marginBottom: 8,
    },
    message: {
      fontSize: typography.fontSizes.caption,
      fontFamily: typography.fonts.medium,
      textAlign: "center",
      marginBottom: 16,
    },
    buttonsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 15,
    },
    confirmButton: {
      flex: 1,
      height: 44,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    cancelButton: {
      flex: 1,
      height: 44,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },
    confirmText: {
      fontSize: typography.fontSizes.body,
    },
    cancelText: {
      fontSize: typography.fontSizes.body,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          {/* block tap from closing when touching inside card */}
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.card,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.onBackground,
                    fontFamily: typography.fonts.medium,
                    fontSize: typography.fontSizes.body,
                  },
                ]}
              >
                {title}
              </Text>
              {message ? (
                <Text
                  style={[
                    styles.message,
                    {
                      color: theme.textSecondary,
                      fontFamily: typography.fonts.regular,
                    },
                  ]}
                >
                  {message}
                </Text>
              ) : null}
              <View style={styles.buttonsRow}>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={onConfirm}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.confirmText,
                      {
                        color: theme.textPrimary,
                        fontFamily: typography.fonts.medium,
                      },
                    ]}
                  >
                    {confirmText}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    { borderColor: theme.onBackground },
                  ]}
                  onPress={onCancel}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.cancelText,
                      {
                        color: theme.onBackground,
                        fontFamily: typography.fonts.medium,
                      },
                    ]}
                  >
                    {cancelText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
