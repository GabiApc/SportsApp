// src/screens/Saved.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

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

const CACHE_KEY = "@cached_favorites";
const USER_KEY = "@cached_user";

export default function Saved() {
  const { user, setUser } = useAuth();
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

  // Starea de conectivitate la internet
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const sub = NetInfo.addEventListener((state) =>
      setIsConnected(!!state.isConnected),
    );
    return () => sub();
  }, []);

  // Starea pentru favorite și încărcare
  const [favorites, setFavorites] = useState<SectionTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Ref pentru unsubscribe Firestore
  const unsubscribeRef = useRef<() => void>(() => {});

  // 1) La montare: încarcă user-ul din cache (dacă nu există în context) și favoritele din cache
  useEffect(() => {
    (async () => {
      try {
        // Dacă nu exista un user în context, încercăm să-l citim din AsyncStorage
        if (!user) {
          const storedUser = await AsyncStorage.getItem(USER_KEY);
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && parsedUser.id) {
              setUser(parsedUser.id);
            }
          }
        }
        // Încărcăm favoritele din cache
        const cachedFavsJson = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedFavsJson) {
          const cachedFavs = JSON.parse(cachedFavsJson) as SectionTeam[];
          setFavorites(cachedFavs);
        }
      } catch (e) {
        console.warn("Error loading cached user/favorites:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, setUser]);

  // 2) Când există user și suntem online, abonăm la Firestore pentru a actualiza favoritele
  useEffect(() => {
    // Dezabonăm orice abonament anterior
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = () => {};
    }

    if (!user || !isConnected) {
      // Dacă nu avem user în context sau suntem offline, nu ne abonăm
      return;
    }

    setLoading(true);
    const favCol = collection(firestore, "users", user.id, "favorites");
    const unsub = onSnapshot(
      favCol,
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
        // Salvăm în cache
        try {
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(favs));
        } catch (e) {
          console.warn("Error saving favorites to cache", e);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setLoading(false);
        Alert.alert("Eroare", "Nu s-au putut încărca favoritele din server.");
      },
    );

    unsubscribeRef.current = () => unsub();

    return () => {
      unsub();
      unsubscribeRef.current = () => {};
    };
  }, [user, isConnected]);

  // 3) Filtrare favorite după searchQuery
  const filtered = favorites.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  // 4) Navigare la detaliile unei echipe
  const onTeamPress = useCallback(
    (team: SectionTeam) => {
      router.push({
        pathname: "/details/[teamId]",
        params: { teamId: team.id },
      });
    },
    [router],
  );

  // 5) Toggle favorite (șterge din Firestore când suntem online și user există)
  const toggleFav = useCallback(
    async (team: SectionTeam) => {
      if (!user) {
        Alert.alert("Autentificare necesară", "Te rugăm să te loghezi.");
        return;
      }
      if (!isConnected) {
        Alert.alert("Offline", "Nu poți modifica favoritele în modul offline.");
        return;
      }
      try {
        await deleteDoc(doc(firestore, "users", user.id, "favorites", team.id));
      } catch (e) {
        console.warn("Error deleting favorite:", e);
      }
    },
    [user, isConnected],
  );

  // 6) Afișare loading
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // 7) UI final
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
          // Dacă nu există user în context și nu am reușit să citim din cache
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              Trebuie să fii logat ca să vezi favoritele.
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          // Dacă există user, dar lista filtrată e goală
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              Nu ai echipe în lista de favorite.
            </Text>
          </View>
        ) : (
          // Lista de favorite
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
