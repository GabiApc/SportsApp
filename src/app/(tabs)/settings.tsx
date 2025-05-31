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

// 1. Importăm API-ul de notificări
import * as Notifications from "expo-notifications";

/**
 * 2. Definim două variante ale NotificationHandler-ului:
 *    - unul care AFIȘEAZĂ notificările (sunet, banner, badge etc.)
 *    - unul care LE IGNORĂ COMPLET (nu afișează nimic).
 */
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

/**
 * 3. La început, o setăm pe cea „activă” indiferent de toggle.
 *    (Ulterior, vom reactualiza handler-ul din componentă.)
 */
Notifications.setNotificationHandler(handlerDisableNotifications);

export default function SettingsSection() {
  const { user, setUser, updateUserData } = useAuth();
  const { colorScheme, toggleTheme } = useTheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const router = useRouter();
  const USER_KEY = "@cached_user";

  const [editVisible, setEditVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  // NOTĂ: inițial punem pe false; vom sincroniza cu permisiunea reală în useEffect
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const name = user?.name ?? "";
  const email = user?.email ?? "";

  // Reținem token-ul doar atâta timp cât este permis:
  const expoPushTokenRef = useRef<string | null>(null);

  const openEdit = () => setEditVisible(true);
  const closeEdit = () => setEditVisible(false);

  const handleSave = async (newName: string, newEmail: string) => {
    if (!user) return;

    // 1) Update context + AsyncStorage local
    const updated: UserType = { ...user, name: newName, email: newEmail };
    setUser(updated);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated)).catch(
      console.warn,
    );

    setLoading(false);
    closeEdit();

    // 2) Scrie în Firestore dacă e online
    try {
      const ref = doc(firestore, "users", user.id);
      await updateDoc(ref, { name: newName, email: newEmail });
    } catch {
      Alert.alert(
        "Ești offline",
        "Modificările au fost salvate local și vor fi sincronizate când revii online.",
      );
    }

    // 3) Reîncarcă useru‐l de pe server (dacă poți)
    try {
      await updateUserData(user.id);
    } catch {
      // ignorăm dacă nu se poate
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setLogoutModalVisible(false);
    router.replace("/(tabs)");
  };

  /**
   * 4. Când componenta se montează, verificăm dacă avem deja permisiune.
   *    Dacă da, setNotificationsEnabled(true) și obținem un token.
   *    În caz contrar, rămâne false și handler-ul va fi cel de „ignore”.
   */
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === "granted") {
        // Dacă permisiunea era deja acordată:
        setNotificationsEnabled(true);
        const tokenData = await Notifications.getExpoPushTokenAsync();
        expoPushTokenRef.current = tokenData.data;
        // Setăm handler-ul corespunzător:
        Notifications.setNotificationHandler(handlerEnableNotifications);
      } else {
        // Dacă nu suntem granted, lăsăm toggle pe false
        setNotificationsEnabled(false);
        expoPushTokenRef.current = null;
        Notifications.setNotificationHandler(handlerDisableNotifications);
      }
    })();
  }, []);

  /**
   * 5. Handler-ul pentru când userul apasă switch-ul „Permite notificări”:
   *    - Dacă trece ON:
   *        * cerem permisiunea native (requestPermissionsAsync)
   *        * dacă e granted => obținem token, setăm handler-ul de SHOW
   *        * dacă nu, readucem toggle pe false și îi arătăm Alert
   *
   *    - Dacă trece OFF:
   *        * înlocuim handler-ul cu cel de IGNORE (așa nu mai afișăm nimic)
   *        * ștergem token-ul din memorie (și de la backend, dacă era trimis anterior)
   */
  const onToggleNotifications = async (value: boolean) => {
    // Actualizez state-ul imediat (pentru interfață)
    setNotificationsEnabled(value);

    if (value) {
      // 5.a) Dacă userul a dat ON: cer permisiunea
      const { status } = await Notifications.requestPermissionsAsync();

      if (status !== "granted") {
        // dacă userul refuză, revedem starea și arătăm alert
        Alert.alert(
          "Permisiune refuzată",
          "Nu vom putea trimite notificări fără permisiune.",
        );
        setNotificationsEnabled(false);

        // Păstrăm handler‐ul pe IGNORE, ca să nu apară nimic:
        Notifications.setNotificationHandler(handlerDisableNotifications);
        return;
      }

      // Dacă ajungem aici, userul a acceptat (granted)
      // Obținem tokenul Expo și salvăm în ref sau AsyncStorage/ backend
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        expoPushTokenRef.current = tokenData.data;
        // Dacă ai un backend, aici ai putea face:
        //   await fetch("https://exemplu.backend/salveazaToken", { ... , body: JSON.stringify({ token: tokenData.data }) });
      } catch (e) {
        console.warn("Eroare la obținerea Expo Push Token:", e);
      }

      // Setez handler-ul astfel încât să AFIȘEZE notificările:
      Notifications.setNotificationHandler(handlerEnableNotifications);
    } else {
      // 5.b) Dacă userul a dat OFF:
      //   * nu mai afișăm notificări (handler Disable)
      //   * ștergem tokenul (așa nu trimite backend‐ul push uri)
      expoPushTokenRef.current = null;
      Notifications.setNotificationHandler(handlerDisableNotifications);

      // Dacă l-ași salvat anterior pe AsyncStorage sau l-ai trimis la backend,
      // aici ai șterge/notify backend-ul să nu mai trimită push:
      //   AsyncStorage.removeItem("@expo_push_token").catch(console.warn);
      //   await fetch("https://exemplu.backend/stergeToken", { method: "POST", body: JSON.stringify({ token: ... }) });
    }
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

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Modal confirmare logout */}
      <ConfirmationModal
        visible={logoutModalVisible}
        title="Ești sigur că vrei să te deloghezi?"
        confirmText="Nu"
        cancelText="Da"
        onConfirm={() => setLogoutModalVisible(false)}
        onCancel={handleLogout}
      />

      {/* Modal edit profil */}
      <EditUserModal
        visible={editVisible}
        initialName={name}
        initialEmail={email}
        onSave={handleSave}
        onCancel={closeEdit}
      />

      {/* Header (cu buton logout) */}
      <Header
        onProfilePress={() => setLogoutModalVisible(true)}
        showSearch={false}
        iconName="log-out"
        iconState={Boolean(user)}
        buttonStyle={{ backgroundColor: "transparent" }}
      />

      {/* Card profil */}
      {user && <ProfileCard name={name} email={email} onEditPress={openEdit} />}

      {/* Secțiunea de setări */}
      <View style={styles.settings}>
        <Text style={[styles.header, { color: theme.onBackground }]}>
          Setările aplicației
        </Text>

        {/* Dark Mode */}
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

        {/* Push Notifications */}
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
                thumbColor={
                  notificationsEnabled ? theme.onSurface : theme.onSurface
                }
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
                  thumbColor={
                    notificationsEnabled ? theme.onSurface : theme.onSurface
                  }
                />
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
