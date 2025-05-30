// src/screens/Saved.tsx
import { firestore } from "@/config/firebase";
import { useAuth } from "@/context/authContext";
import { useTheme } from "@/context/ThemeContext";
import Header from "@/src/components/Header";
import {
  Team as SectionTeam,
  TeamsSection,
} from "@/src/components/TeamSection";
import { getCachedFavorites } from "@/src/services/cache";
import { Colors } from "@/src/theme/colors";
import { typography } from "@/src/theme/typography";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

const CACHE_KEY = "@cached_favorites";

export default function Saved() {
  const { user } = useAuth();
  const { colorScheme } = useTheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const router = useRouter();

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    loader: { flex: 1, justifyContent: "center", alignItems: "center" },
    section: { flex: 1, paddingHorizontal: 16, marginBottom: 140 },
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
  const [searchQuery, setSearchQuery] = useState("");

  // 1) load cached favorites on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      const cached = await getCachedFavorites();
      setFavorites(cached);
    })();
  }, [user]);

  // 2) Then subscribe to Firestore
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    const col = collection(firestore, "users", user.id, "favorites");
    const unsub = onSnapshot(
      col,
      async (snap) => {
        const favs: SectionTeam[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name,
            logoUri: data.logoUri,
            leagueInfo: data.leagueInfo ?? "",
            favorited: true,
          };
        });
        setFavorites(favs);
        // overwrite cache
        try {
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(favs));
        } catch (e) {
          console.warn("Error saving favorites to cache", e);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error", err);
        setLoading(false);
        Alert.alert("Eroare", "Nu s-au putut încărca favoritele.");
      },
    );
    return () => unsub();
  }, [user]);

  const filtered = favorites.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

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
        Alert.alert("Autentificare necesară", "Te rugăm să te loghezi.");
        return;
      }
      await deleteDoc(doc(firestore, "users", user.id, "favorites", team.id));
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
    <View style={styles.container}>
      <Header
        onProfilePress={() => {}}
        onSearchChange={setSearchQuery}
        showSearch={Boolean(user && favorites.length)}
        iconName="user"
        iconState={Boolean(user)}
      />

      <View style={styles.section}>
        {!user ? (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              Trebuie să fii logat ca să vezi favoritele.
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              Nu ai echipe în lista de favorite.
            </Text>
          </View>
        ) : (
          <TeamsSection
            title="Echipe preferate"
            teams={filtered}
            onPressTeam={onTeamPress}
            onToggleFavorite={toggleFav}
          />
        )}
      </View>
    </View>
  );
}
