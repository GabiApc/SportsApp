// src/components/SettingsSection.tsx
import { auth } from "@/config/firebase";
import { useAuth } from "@/context/authContext";
import { ConfirmationModal } from "@/src/components/ConfirmationModal";
import Header from "@/src/components/Header";
import ProfileCard from "@/src/components/ProfileCard";
import { useTheme } from "@/src/hooks/useTheme";
import { Colors } from "@/src/theme/colors";
import { typography } from "@/src/theme/typography";
import { Feather } from "@expo/vector-icons";
import { signOut } from "@firebase/auth";
import { useRouter } from "expo-router";
import React, { useState } from "react";

import { Platform, StyleSheet, Switch, Text, View } from "react-native";

export default function SettingsSection() {
  const { colorScheme, toggleTheme } = useTheme();
  const isDarkMode = colorScheme === "dark";
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = React.useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [name, setName] = useState("Mihai Crăciun");
  const [email, setEmail] = useState("mihai.craciun@gmail.com");

  const openEdit = () => setEditVisible(true);
  const closeEdit = () => setEditVisible(false);

  const handleSave = (newName: string, newEmail: string) => {
    setName(newName);
    setEmail(newEmail);
    closeEdit();
  };
  const { user } = useAuth();
  const router = useRouter();
  const handleLogout = async () => {
    // logică de logout
    await signOut(auth);
    setLogoutModalVisible(false);
    router.replace("/(tabs)");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "flex-start",
      alignItems: "center",
      backgroundColor: theme.background,
    },
    header: {
      fontSize: typography.fontSizes.body,
      fontFamily: typography.fonts.bold,
      marginTop: 20,
      textAlign: "left",
      width: "100%",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 10,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: Colors.light.textSecondary,
    },
    label: {
      fontFamily: typography.fonts.medium,
      flex: 1,
      marginLeft: 12,
      fontSize: typography.fontSizes.body,
    },
    settings: {
      width: "85%",
      justifyContent: "center",
      alignItems: "center",
    },
    toggle: {
      backgroundColor: isDarkMode ? theme.primary : theme.borderDark,
      width: 49,
      height: 27,
      borderRadius: 15,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      alignContent: "center",
      paddingHorizontal: 5,
    },
    toggle2: {
      backgroundColor: notificationsEnabled
        ? theme.primary
        : isDarkMode
        ? theme.textSecondary
        : theme.borderDark,
      width: 49,
      height: 27,
      borderRadius: 15,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      alignContent: "center",
      paddingHorizontal: 5,
    },
  });

  return (
    <View style={styles.container}>
      <ConfirmationModal
        visible={logoutModalVisible}
        title="Ești sigur că vrei să te deloghezi?"
        confirmText="Nu"
        cancelText="Da"
        onConfirm={() => {
          // logică de logout
          setLogoutModalVisible(false);
        }}
        onCancel={() => handleLogout()}
      />

      <Header
        onProfilePress={() => setLogoutModalVisible(true)}
        onSearchChange={(q) => console.log("Căutare:", q)}
        showSearch={false}
        iconName="log-out"
        iconState={user ? true : false}
        buttonStyle={{ backgroundColor: "transparent" }}
      />
      {user && (
        <ProfileCard
          name={user.name || name}
          email={user.email || email}
          onEditPress={() => setEditVisible(true)}
        />
      )}

      <View style={styles.settings}>
        <Text style={[styles.header, { color: theme.onBackground }]}>
          Setările contului
        </Text>

        <View style={styles.row}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <Feather name="moon" size={20} color={theme.textSecondary} />
          </View>
          <Text style={[styles.label, { color: theme.onBackground }]}>
            Mod întunecat
          </Text>

          {Platform.OS === "ios" ? (
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.borderDark, true: theme.primary }}
              thumbColor={isDarkMode ? theme.onSurface : theme.onSurface}
            />
          ) : (
            <View style={styles.toggle}>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.borderDark, true: theme.primary }}
                thumbColor={isDarkMode ? theme.onSurface : theme.onSurface}
              />
            </View>
          )}
        </View>
        <View style={styles.row}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <Feather name="moon" size={20} color={theme.textSecondary} />
          </View>
          <Text style={[styles.label, { color: theme.onBackground }]}>
            Permite notificări
          </Text>

          {Platform.OS === "ios" ? (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.textSecondary, true: theme.primary }}
              thumbColor={
                notificationsEnabled ? theme.onSurface : theme.onSurface
              }
            />
          ) : (
            <View style={styles.toggle2}>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: isDarkMode ? theme.textSecondary : theme.borderDark,
                  true: theme.primary,
                }}
                thumbColor={
                  notificationsEnabled ? theme.onSurface : theme.onSurface
                }
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
