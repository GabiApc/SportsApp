// src/screens/LoginScreen.tsx
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PremierLeagueLogo from "../../assets/images/pl_logo.png";
import HorizontalTabBar from "../components/horizontalTabBar";
import TeamCard from "../components/TeamCard";
import { useTheme } from "../hooks/useTheme";
import { Colors } from "../theme/colors";
import { typography } from "../theme/typography";

export default function DetailsScreen() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const router = useRouter(); // Adaugă hook-ul router

  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);

  const [email, setEmail] = useState("");
  const [active, setActive] = useState("Descriere");

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
      height: "30%",
      backgroundColor: theme.primary,
      width: "100%",
      paddingTop: 10,
      paddingHorizontal: 40,
      borderBottomLeftRadius: 50,
      borderBottomRightRadius: 50,
    },
    logo: {
      alignSelf: "center",
      marginBottom: 16,
    },
    headline: {
      fontSize: typography.fontSizes.title,
      fontFamily: typography.fonts.medium,
      textAlign: "center",
      marginBottom: 8,
      marginTop: 49,
    },
  });

  return (
    <SafeAreaView style={[styles.container]}>
      <View style={styles.header}>
        {/* Logo */}
        <TouchableOpacity
          onPress={() => router.replace("/")}
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
          Detalii echipă
        </Text>

        <TeamCard
          logoUri="https://crests.football-data.org/61.svg"
          name="Chelsea F.C."
          subtitle="Stamford Bridge"
          watermark={PremierLeagueLogo}
        />
      </View>
      <View
        style={{
          top: "10%",
          width: "80%",
          alignSelf: "center",
          justifyContent: "flex-start",
        }}
      >
        <HorizontalTabBar
          tabs={["Descriere", "Lot jucători", "Rezultate"]}
          activeTab={active}
          onTabPress={setActive}
        />
      </View>
    </SafeAreaView>
  );
}
