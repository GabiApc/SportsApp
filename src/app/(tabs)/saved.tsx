// src/screens/Saved.tsx
import { firestore } from "@/config/firebase";
import { useAuth } from "@/context/authContext";
import { useTheme } from "@/context/ThemeContext";
import Header from "@/src/components/Header";
import {
  Team as SectionTeam,
  TeamsSection,
} from "@/src/components/TeamSection";
import { Colors } from "@/src/theme/colors";
import { typography } from "@/src/theme/typography";
import { useRouter } from "expo-router";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Saved() {
  const { user } = useAuth();
  const { colorScheme } = useTheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loader: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    section: {
      flex: 1,
      width: "100%",
      paddingHorizontal: 16,
      marginBottom: 140,
    },
    messageContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    messageText: {
      color: theme.textSecondary,
      fontSize: typography.fontSizes.body,
      fontFamily: typography.fonts.regular,
      textAlign: "center",
    },
  });

  const [favorites, setFavorites] = useState<SectionTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // filter by search query
  const filteredFavorites = favorites.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    const favCol = collection(firestore, "users", user.id, "favorites");
    const unsubscribe = onSnapshot(
      favCol,
      (snapshot) => {
        const favs: SectionTeam[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as {
            name: string;
            logoUri: string;
            leagueInfo?: string;
          };
          return {
            id: docSnap.id,
            name: data.name,
            logoUri: data.logoUri,
            leagueInfo: data.leagueInfo ?? "",
            favorited: true,
          };
        });
        setFavorites(favs);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading favorites:", error);
        Alert.alert("Eroare", "Nu s-au putut încărca favoritele.");
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [user]);

  const onTeamPress = useCallback(
    (team: SectionTeam) => {
      router.push({
        pathname: "/details/[teamId]",
        params: { teamId: team.id },
      });
    },
    [router],
  );

  const toggleFav = useCallback(
    async (team: SectionTeam) => {
      if (!user) {
        Alert.alert(
          "Autentificare necesară",
          "Trebuie să fii logat pentru a modifica favoritele.",
        );
        return;
      }
      const favDoc = doc(firestore, "users", user.id, "favorites", team.id);
      await deleteDoc(favDoc);
    },
    [user],
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        onProfilePress={() => {}}
        onSearchChange={setSearchQuery}
        showSearch={user && filteredFavorites.length > 0 ? true : false}
        iconName="user"
        iconState={Boolean(user)}
      />

      <View style={styles.section}>
        {!user ? (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              Trebuie să fii logat ca să vezi echipele preferate.
            </Text>
          </View>
        ) : filteredFavorites.length === 0 ? (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              Nu ai încă echipe salvate la favorite.
            </Text>
          </View>
        ) : (
          <TeamsSection
            title="Echipe preferate"
            teams={filteredFavorites}
            onPressTeam={onTeamPress}
            onToggleFavorite={toggleFav}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
