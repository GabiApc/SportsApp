// src/components/EditUserModal.tsx
import { useTheme } from "@/context/ThemeContext";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { hexToRgba } from "../utils/HexToRgba";

export type EditUserModalProps = {
  visible: boolean;
  initialName: string;
  initialEmail: string;
  onSave: (name: string, email: string) => void;
  onCancel: () => void;
};

const EditUserModal: React.FC<EditUserModalProps> = ({
  visible,
  initialName,
  initialEmail,
  onSave,
  onCancel,
}) => {
  const { colorScheme } = useTheme();
  const isDarkMode = colorScheme === "dark";
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setEmail(initialEmail);
    }
  }, [visible, initialName, initialEmail]);

  const handleSave = () => {
    onSave(name.trim(), email.trim());
    onCancel();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: isDarkMode
        ? hexToRgba(theme.textSecondary, 0.3)
        : "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 16,
    },
    card: {
      width: "100%",
      maxWidth: 360,
      borderRadius: 16,
      padding: 20,
      // shadow iOS
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      // elevation Android
      elevation: 3,
      paddingHorizontal: 35,
      paddingVertical: 35,
    },
    header: {
      alignItems: "center",
      marginBottom: 20,
    },
    avatar: {
      width: 45,
      height: 45,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    title: {
      fontFamily: typography.fonts.medium,
      fontSize: typography.fontSizes.body,
    },
    input: {
      width: "100%",
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
    },
    buttonsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
    },
    saveButton: {
      flex: 1,
      height: 44,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    saveText: {
      fontWeight: "600",
    },
    cancelButton: {
      flex: 1,
      height: 44,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelText: {
      fontWeight: "600",
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
          <View style={[styles.card, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <Feather name="user" size={30} color={theme.onSurface} />
              </View>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.onBackground,
                  },
                ]}
              >
                Editare detalii utilizator
              </Text>
            </View>

            {/* Inputs */}
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.borderLight,
                  color: theme.onBackground,
                  fontFamily: typography.fonts.regular,
                  fontSize: typography.fontSizes.caption,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Nume complet"
              placeholderTextColor={theme.textSecondary}
            />
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.borderLight,
                  color: theme.onBackground,
                  fontFamily: typography.fonts.regular,
                  fontSize: typography.fontSizes.caption,
                },
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="email@exemplu.com"
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Buttons */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.saveText,
                    {
                      color: theme.onSurface,
                      fontFamily: typography.fonts.medium,
                      fontSize: typography.fontSizes.body,
                    },
                  ]}
                >
                  Salvare
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  {
                    borderColor: isDarkMode
                      ? theme.onSurface
                      : theme.backgroundThird,
                  },
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
                      fontSize: typography.fontSizes.body,
                    },
                  ]}
                >
                  Renunță
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default EditUserModal;
