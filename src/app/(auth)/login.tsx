// src/screens/LoginScreen.tsx
import { useAuth } from "@/context/authContext";
import { useTheme } from "@/context/ThemeContext";
import LoadingButton from "@/src/components/LoadingButton";
import { Colors } from "@/src/theme/colors";
import { typography } from "@/src/theme/typography";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Login() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const router = useRouter();

  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [loading, setLoading] = useState(false);
  const [secure, setSecure] = useState(true);
  const { login: loginUser } = useAuth();

  const handlePasswordVisibility = () => setSecure((prev) => !prev);

  const handleSubmit = async () => {
    if (!emailRef.current || !passwordRef.current) {
      Alert.alert("Login", "Te rugăm să completezi toate câmpurile.");
      return;
    }
    setLoading(true);
    const res = await loginUser(emailRef.current, passwordRef.current);
    setLoading(false);
    if (!res.success) {
      Alert.alert("Login", res.msg);
    }
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
      paddingTop: 70,
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
      color: theme.onSurface,
    },
    subhead: {
      fontSize: typography.fontSizes.caption,
      fontFamily: typography.fonts.medium,
      textAlign: "center",
      marginBottom: 24,
      color: theme.onSurface,
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
      width: "100%",
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
      color: theme.textSecondary,
      fontFamily: typography.fonts.regular,
      fontSize: typography.fontSizes.caption,
    },
    signUpRow: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 10,
      bottom: -5,
    },
    signUpText: {
      fontSize: typography.fontSizes.caption,
      color: theme.textSecondary,
      fontFamily: typography.fonts.regular,
    },
    signUpLink: {
      fontSize: typography.fontSizes.caption,
      marginLeft: 4,
      color: theme.primary,
      fontFamily: typography.fonts.medium,
    },
    skipText: {
      textAlign: "center",
      marginTop: 10,
      fontSize: typography.fontSizes.caption,
      color: theme.primary,
      fontFamily: typography.fonts.regular,
      alignSelf: "center",
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Feather
          name="zap"
          size={48}
          W
          color={theme.onSurface}
          style={styles.logo}
        />
        <Text style={styles.headline}>Intră în contul{"\n"}SportsApp</Text>
        <Text style={styles.subhead}>
          Introdu emailul și parola pentru a intra în cont
        </Text>
      </View>
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          onChangeText={(value) => (emailRef.current = value)}
          placeholder="email@exemplu.com"
          placeholderTextColor={theme.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={{ position: "relative" }}>
          <TextInput
            style={[styles.input, { paddingRight: 40 }]}
            onChangeText={(value) => (passwordRef.current = value)}
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
              size={17}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <LoadingButton
          title="Log In"
          loading={loading}
          onPress={handleSubmit}
        />

        <View style={styles.signUpRow}>
          <Text style={styles.signUpText}>Nu ai cont?</Text>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={styles.signUpLink}>Înregistrează-te</Text>
          </TouchableOpacity>
        </View>
        <Text
          style={{
            alignSelf: "center",
            color: theme.textSecondary,
            fontSize: typography.fontSizes.body,
            marginTop: 10,
          }}
        >
          sau
        </Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)")}>
          <Text style={styles.skipText}>Intră în aplicație fără logare</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
