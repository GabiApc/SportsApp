// src/screens/LoginScreen.tsx
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

export default function RegisterScreen() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const router = useRouter(); // Adaugă hook-ul router

  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);

  const [email, setEmail] = useState("");

  useEffect(() => {
    setEmail(email);
    setPassword(password);
  }, [email, password]);

  const handlePasswordVisibility = () => {
    setSecure(!secure);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      height: "50%",
      backgroundColor: theme.primary,
      width: "100%",
      paddingTop: 100,
      paddingHorizontal: 40,
    },
    logo: {
      alignSelf: "center",
      marginBottom: 16,
    },
    headline: {
      fontSize: typography.fontSizes.h2,
      fontFamily: typography.fonts.bold,
      textAlign: "center",
      marginBottom: 8,
      marginTop: 45,
    },
    subhead: {
      fontSize: typography.fontSizes.caption,
      fontFamily: typography.fonts.medium,
      textAlign: "center",
      marginBottom: 24,
    },
    card: {
      position: "absolute",
      top: "35%",
      width: "80%",
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 10,
      alignSelf: "center",
      elevation: 10,
      padding: 30,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
    },
    button: {
      marginTop: 10,
      height: 50,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    buttonText: {
      fontSize: typography.fontSizes.body,
    },
    signUpRow: {
      flexDirection: "row",
      justifyContent: "center",
    },
    signUpText: {
      fontSize: typography.fontSizes.caption,
    },
    signUpLink: {
      fontSize: typography.fontSizes.caption,
      marginLeft: 4,
    },
  });

  return (
    <SafeAreaView style={[styles.container]}>
      <View style={styles.header}>
        {/* Logo */}
        <TouchableOpacity
          onPress={() => router.replace("/login")}
          style={{
            position: "absolute",
            left: 30,
            top: 60,
            zIndex: 2,
          }}
          accessibilityLabel="Înapoi la login"
        >
          <Feather name="arrow-left" size={25} color={theme.onSurface} />
        </TouchableOpacity>
        {/* Headline */}
        <Text style={[styles.headline, { color: theme.onSurface }]}>
          Înregistrează-te
        </Text>
        <View style={styles.signUpRow}>
          <Text
            style={[
              styles.signUpText,
              {
                color: theme.textPrimary,
                fontFamily: typography.fonts.regular,
              },
            ]}
          >
            Ai deja cont?
          </Text>
          <TouchableOpacity
            onPress={() => {
              router.replace("/login"); // Navighează către login
            }}
          >
            <Text
              style={[
                styles.signUpLink,
                {
                  color: theme.textPrimary,
                  fontFamily: typography.fonts.bold,
                  textDecorationLine: "underline",
                },
              ]}
            >
              Log in
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.card}>
        <View
          style={{
            flexDirection: "row",
            flex: 1,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <TextInput
            style={[
              styles.input,
              {
                color: theme.textSecondary,
                fontFamily: typography.fonts.regular,
                fontSize: typography.fontSizes.caption,
                width: "48%",
              },
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="Nume"
            placeholderTextColor={theme.textSecondary}
          />
          <TextInput
            style={[
              styles.input,
              {
                color: theme.textSecondary,
                fontFamily: typography.fonts.regular,
                fontSize: typography.fontSizes.caption,
                width: "48%",
              },
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="Prenume"
            placeholderTextColor={theme.textSecondary}
          />
        </View>
        <TextInput
          style={[
            styles.input,
            {
              color: theme.textSecondary,
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
        <View style={{ position: "relative" }}>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.textSecondary,
                fontFamily: typography.fonts.regular,
                fontSize: typography.fontSizes.caption,
                paddingRight: 40, // spațiu pentru iconiță
              },
            ]}
            value={password}
            onChangeText={setPassword}
            placeholder="Parola"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry={secure}
          />
          <TouchableOpacity
            onPress={handlePasswordVisibility}
            style={{
              position: "absolute",
              right: 10,
              top: 12,
              height: 24,
              width: 24,
              justifyContent: "center",
              alignItems: "center",
            }}
            accessibilityLabel={secure ? "Afișează parola" : "Ascunde parola"}
          >
            <Feather
              name={secure ? "eye-off" : "eye"}
              size={20}
              color={theme.textPrimary}
            />
          </TouchableOpacity>
          {/* Log In */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            activeOpacity={0.8}
            onPress={() => {
              router.replace("/"); // Navighează către index
            }}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: theme.onSurface,
                  fontFamily: typography.fonts.medium,
                },
              ]}
            >
              Crează cont
            </Text>
          </TouchableOpacity>

          {/* Sign up link */}
        </View>
      </View>
    </SafeAreaView>
  );
}
