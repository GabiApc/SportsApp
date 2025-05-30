// src/components/SettingsSection.tsx
import { auth, firestore } from "@/config/firebase";
import { useAuth } from "@/context/authContext";
import { useTheme } from "@/context/ThemeContext";
import { ConfirmationModal } from "@/src/components/ConfirmationModal";
import EditUserModal from "@/src/components/EditUserModal";
import Header from "@/src/components/Header";
import ProfileCard from "@/src/components/ProfileCard";
import { Colors } from "@/src/theme/colors";
import { typography } from "@/src/theme/typography";
import { UserType } from "@/types";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

export default function SettingsSection() {
  const { user, setUser, updateUserData } = useAuth();
  const { colorScheme, toggleTheme } = useTheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const router = useRouter();
  const USER_KEY = "@cached_user";

  const [editVisible, setEditVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const name = user?.name ?? "";
  const email = user?.email ?? "";

  const openEdit = () => setEditVisible(true);
  const closeEdit = () => setEditVisible(false);

  const handleSave = async (newName: string, newEmail: string) => {
    if (!user) return;

    // 1) Update context + cache immediately
    const updated: UserType = { ...user, name: newName, email: newEmail };
    setUser(updated);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
    AsyncStorage.setItem(USER_KEY, JSON.stringify(updated)).catch(console.warn);

    setLoading(false);
    closeEdit();

    // immediately hide loader & close modal

    // 2) Attempt Firestore write
    try {
      const ref = doc(firestore, "users", user.id);
      await updateDoc(ref, { name: newName, email: newEmail });
    } catch (err) {
      Alert.alert(
        "Ești offline",
        "Modificările au fost salvate local și vor fi sincronizate când revii online.",
      );
    }

    // 3) Try to refresh from server if online
    try {
      await updateUserData(user.id);
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
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
      backgroundColor: isDark ? theme.primary : theme.borderDark,
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
        : isDark
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
    loader: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Logout confirmation */}
      <ConfirmationModal
        visible={logoutModalVisible}
        title="Ești sigur că vrei să te deloghezi?"
        confirmText="Nu"
        cancelText="Da"
        onConfirm={() => setLogoutModalVisible(false)}
        onCancel={handleLogout}
      />

      {/* Edit profile modal */}
      <EditUserModal
        visible={editVisible}
        initialName={name}
        initialEmail={email}
        onSave={handleSave}
        onCancel={closeEdit}
      />

      {/* Header with logout icon */}
      <Header
        onProfilePress={() => setLogoutModalVisible(true)}
        showSearch={false}
        iconName="log-out"
        iconState={Boolean(user)}
        buttonStyle={{ backgroundColor: "transparent" }}
      />

      {/* Profile info */}
      {user && <ProfileCard name={name} email={email} onEditPress={openEdit} />}

      {/* Settings toggles */}
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
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.borderDark, true: theme.primary }}
              thumbColor={isDark ? theme.onSurface : theme.onSurface}
            />
          ) : (
            <View style={styles.toggle}>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.borderDark, true: theme.primary }}
                thumbColor={isDark ? theme.onSurface : theme.onSurface}
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
            <Feather name="bell" size={20} color={theme.textSecondary} />
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
                  false: isDark ? theme.textSecondary : theme.borderDark,
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
