import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { firestore } from "@/config/firebase";
import { useAuth } from "@/context/authContext";
import { useTheme } from "@/context/ThemeContext";
import { ConfirmationModal } from "@/src/components/ConfirmationModal";
import EditUserModal from "@/src/components/EditUserModal";
import Header from "@/src/components/Header";
import ProfileCard from "@/src/components/ProfileCard";
import { Colors } from "@/src/theme/colors";
import { typography } from "@/src/theme/typography";
import { UserType } from "@/types";

// --- Notification Handlers ---
const handlerEnableNotifications = {
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
};
const handlerDisableNotifications = {
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
};
Notifications.setNotificationHandler(handlerDisableNotifications);

// --- Main Component ---
export default function SettingsSection() {
  // --- Contexts & Hooks ---
  const { user, setUser, updateUserData, logout } = useAuth();
  const { colorScheme, toggleTheme } = useTheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const router = useRouter();
  const USER_KEY = "@cached_user";

  // --- State ---
  const [editVisible, setEditVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- Refs ---
  const expoPushTokenRef = useRef<string | null>(null);

  // --- User Info ---
  const name = user?.name ?? "";
  const email = user?.email ?? "";

  // --- Modal Handlers ---
  const openEdit = () => setEditVisible(true);
  const closeEdit = () => setEditVisible(false);

  // --- Save Profile Handler ---
  const handleSave = async (newName: string, newEmail: string) => {
    if (!user) return;
    setLoading(true);

    // 1. Update local context & storage
    const updated: UserType = { ...user, name: newName, email: newEmail };
    setUser(updated);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated)).catch(
      console.warn,
    );
    setLoading(false);
    closeEdit();

    // 2. Update Firestore
    try {
      const ref = doc(firestore, "users", user.id);
      await updateDoc(ref, { name: newName, email: newEmail });
    } catch {
      Alert.alert(
        "Ești offline",
        "Modificările au fost salvate local și vor fi sincronizate când revii online.",
      );
    }

    // 3. Reload user from server
    try {
      await updateUserData(user.id);
    } catch {}
  };

  // --- Logout Handler ---
  const handleLogout = async () => {
    logout();
    setLogoutModalVisible(false);
    router.replace("/(tabs)");
  };

  // --- Notification Permission Sync ---
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === "granted") {
        setNotificationsEnabled(true);
        const tokenData = await Notifications.getExpoPushTokenAsync();
        expoPushTokenRef.current = tokenData.data;
        Notifications.setNotificationHandler(handlerEnableNotifications);
      } else {
        setNotificationsEnabled(false);
        expoPushTokenRef.current = null;
        Notifications.setNotificationHandler(handlerDisableNotifications);
      }
    })();
  }, []);

  // --- Notification Toggle Handler ---
  const onToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);

    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permisiune refuzată",
          "Nu vom putea trimite notificări fără permisiune.",
        );
        setNotificationsEnabled(false);
        Notifications.setNotificationHandler(handlerDisableNotifications);
        return;
      }
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        expoPushTokenRef.current = tokenData.data;
      } catch (e) {
        console.warn("Eroare la obținerea Expo Push Token:", e);
      }
      Notifications.setNotificationHandler(handlerEnableNotifications);
    } else {
      expoPushTokenRef.current = null;
      Notifications.setNotificationHandler(handlerDisableNotifications);
    }
  };

  // --- Styles ---
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
      paddingHorizontal: 5,
    },
    loader: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });

  // --- Loading State ---
  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // --- Render ---
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        visible={logoutModalVisible}
        title="Ești sigur că vrei să te deloghezi?"
        confirmText="Nu"
        cancelText="Da"
        onConfirm={() => setLogoutModalVisible(false)}
        onCancel={handleLogout}
      />

      {/* Edit Profile Modal */}
      <EditUserModal
        visible={editVisible}
        initialName={name}
        initialEmail={email}
        onSave={handleSave}
        onCancel={closeEdit}
      />

      {/* Header */}
      <Header
        onProfilePress={() => setLogoutModalVisible(true)}
        showSearch={false}
        iconName="log-out"
        iconState={Boolean(user)}
        buttonStyle={{ backgroundColor: "transparent" }}
      />

      {/* Profile Card */}
      {user && <ProfileCard name={name} email={email} onEditPress={openEdit} />}

      {/* Settings Section */}
      <View style={styles.settings}>
        <Text style={[styles.header, { color: theme.onBackground }]}>
          Setările aplicației
        </Text>

        {/* Dark Mode Toggle */}
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
              thumbColor={theme.onSurface}
            />
          ) : (
            <View style={styles.toggle}>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.borderDark, true: theme.primary }}
                thumbColor={theme.onSurface}
              />
            </View>
          )}
        </View>

        {/* Push Notifications Toggle */}
        {user && (
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
                onValueChange={onToggleNotifications}
                trackColor={{
                  false: theme.textSecondary,
                  true: theme.primary,
                }}
                thumbColor={theme.onSurface}
              />
            ) : (
              <View style={styles.toggle2}>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={onToggleNotifications}
                  trackColor={{
                    false: isDark ? theme.textSecondary : theme.borderDark,
                    true: theme.primary,
                  }}
                  thumbColor={theme.onSurface}
                />
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
