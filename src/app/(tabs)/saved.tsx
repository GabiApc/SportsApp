// src/screens/Saved.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect } from "@react-navigation/native";
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

  // 1) Starea de conectivitate
  const [isConnected, setIsConnected] = useState(true);
  useEffect(() => {
    const sub = NetInfo.addEventListener((state) =>
      setIsConnected(!!state.isConnected),
    );
    return () => sub();
  }, []);

  // 2) Starea favorite + încărcare
  const [favorites, setFavorites] = useState<SectionTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Ref pentru unsubscribe Firestore
  const unsubscribeRef = useRef<() => void>(() => {});

  /**
   * 3) La montare (sau la schimbarea lui `user`):
   *    - Dacă nu există `user` în context, încercăm să-l citim din AsyncStorage.
   *    - Încărcăm lista de favorite din CACHE_KEY.
   */
  useEffect(() => {
    (async () => {
      try {
        let effectiveUser = user;

        // 3.1) Dacă nu există user în context, încercăm să-l luăm din AsyncStorage
        if (!effectiveUser) {
          const storedUserJson = await AsyncStorage.getItem(USER_KEY);
          if (storedUserJson) {
            const parsedUser = JSON.parse(storedUserJson);
            if (parsedUser && parsedUser.id) {
              setUser(parsedUser);
              effectiveUser = parsedUser;
            }
          }
        }

        // 3.2) Încarcăm lista de favorite din cache (CACHE_KEY)
        const cachedFavsJson = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedFavsJson) {
          const cachedFavs = JSON.parse(cachedFavsJson) as SectionTeam[];
          setFavorites(cachedFavs);
        } else {
          setFavorites([]);
        }
      } catch (e) {
        console.warn("Error loading cached user/favorites:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, setUser]);

  /**
   * 4) Când există user și suntem online, ne abonăm la Firestore pentru a actualiza lista de favorite.
   *    Salvăm întotdeauna snapshot-ul în CACHE_KEY, pentru a păstra sincronizare
   *    chiar și după închiderea aplicației.
   */
  useEffect(() => {
    // Dezabonăm orice abonament anterior
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = () => {};
    }

    if (!user || !isConnected) {
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

  /**
   * 5) Când ecranul primește focus și suntem offline, reîncărcăm lista de favorite din cache
   *    (pentru a reflecta modificări făcute în alt ecran în modul offline).
   */
  useFocusEffect(
    useCallback(() => {
      if (!isConnected) {
        AsyncStorage.getItem(CACHE_KEY)
          .then((json) => {
            if (json) {
              const cached: SectionTeam[] = JSON.parse(json);
              setFavorites(cached);
            }
          })
          .catch((e) => console.warn("Eroare la reload cache pe focus:", e));
      }
    }, [isConnected]),
  );

  // 6) Filtrare favorite după searchQuery
  const filtered = favorites.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  // 7) Navigare la detaliile unei echipe
  const onTeamPress = useCallback(
    (team: SectionTeam) => {
      router.push({
        pathname: "/details/[teamId]",
        params: { teamId: team.id },
      });
    },
    [router],
  );

  /**
   * 8) Toggle favorite:
   *    - Dacă suntem online, ștergem din Firestore (și Firestore onSnapshot va actualiza cache-ul).
   *    - Dacă suntem offline, ștergem doar din cache și actualizăm starea locală.
   */
  const toggleFav = useCallback(
    async (team: SectionTeam) => {
      if (!user) {
        Alert.alert("Autentificare necesară", "Te rugăm să te loghezi.");
        return;
      }

      // Dacă suntem online, ștergem direct din Firestore
      if (isConnected) {
        try {
          await deleteDoc(
            doc(firestore, "users", user.id, "favorites", team.id),
          );
          // onSnapshot Firestore va actualiza automat cache-ul
        } catch (e) {
          console.warn("Error deleting favorite from Firestore:", e);
          Alert.alert(
            "Eroare",
            "Nu s-a putut șterge din server. Încearcă din nou.",
          );
        }
        return;
      }

      // Dacă suntem offline, ștergem doar local
      const newFavorites = favorites.filter((t) => t.id !== team.id);
      setFavorites(newFavorites);

      // Rescriem în AsyncStorage
      try {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(newFavorites));
      } catch (e) {
        console.warn("Error saving updated favorites to cache:", e);
      }
    },
    [user, isConnected, favorites],
  );

  // 9) Afișare loading
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // 10) UI final
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
          // Dacă nu există user (nici în context, nici în cache), mesaj
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              Trebuie să fii logat ca să vezi favoritele.
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          // Dacă există user, dar nicio echipă în favorite
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
