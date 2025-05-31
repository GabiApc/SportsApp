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

// --- Constants ---
const CACHE_KEY_PREFIX = "@cached_favorites_";
const USER_KEY = "@cached_user";

// --- Styles ---
const getStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
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

// --- Main Component ---
export default function Saved() {
  // --- Contexts & Hooks ---
  const { user, setUser } = useAuth();
  const { colorScheme } = useTheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const styles = getStyles(theme);
  const router = useRouter();

  // --- State ---
  const [isConnected, setIsConnected] = useState(true);
  const [favorites, setFavorites] = useState<SectionTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const unsubscribeRef = useRef<() => void>(() => {});

  // --- Connectivity Listener ---
  useEffect(() => {
    const sub = NetInfo.addEventListener((state) =>
      setIsConnected(!!state.isConnected),
    );
    return () => sub();
  }, []);

  // --- Load user & favorites from cache on mount/user change ---
  useEffect(() => {
    (async () => {
      try {
        let effectiveUser = user;
        if (!effectiveUser) {
          // dacă nu există user în context, încercăm din cache
          const storedUserJson = await AsyncStorage.getItem(USER_KEY);
          if (storedUserJson) {
            const parsedUser = JSON.parse(storedUserJson);
            if (parsedUser && parsedUser.id) {
              setUser(parsedUser);
              effectiveUser = parsedUser;
            }
          }
        }

        if (!effectiveUser) {
          // fără user, nu încărcăm favorite → ridicăm loading
          setFavorites([]);
          setLoading(false);
          return;
        }

        // Aici citim favoritele în funcție de userId
        const CACHE_KEY = CACHE_KEY_PREFIX + effectiveUser.id;
        const cachedFavs = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedFavs) {
          setFavorites(JSON.parse(cachedFavs));
        } else {
          setFavorites([]);
        }
      } catch (e) {
        console.warn("Eroare la încărcarea favorite din cache:", e);
      } finally {
        // Indiferent de rezultat, ridicăm loading
        setLoading(false);
      }
    })();
  }, [user, setUser]);

  // --- Firestore subscription for favorites ---
  useEffect(() => {
    // mai întâi, anulăm orice abonament anterior
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = () => {};
    }

    // dacă nu există user sau nu avem internet, nu ne abonăm
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

        // Salvăm în cache pe user
        try {
          const CACHE_KEY = CACHE_KEY_PREFIX + user.id;
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

  // --- Reload cache on focus when offline ---
  useFocusEffect(
    useCallback(() => {
      if (!isConnected) {
        // dacă suntem offline, reluăm direct din cache
        (async () => {
          try {
            if (!user) return;
            const CACHE_KEY = CACHE_KEY_PREFIX + user.id;
            const raw = await AsyncStorage.getItem(CACHE_KEY);
            if (raw) {
              setFavorites(JSON.parse(raw));
            }
          } catch (e) {
            console.warn("Eroare la reload cache pe focus:", e);
          }
        })();
      }
    }, [isConnected, user]),
  );

  // --- Filtered favorites ---
  const filtered = favorites.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  // --- Handlers ---
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
      if (isConnected) {
        try {
          await deleteDoc(
            doc(firestore, "users", user.id, "favorites", team.id),
          );
        } catch (e) {
          console.warn("Error deleting favorite from Firestore:", e);
          Alert.alert(
            "Eroare",
            "Nu s-a putut șterge din server. Încearcă din nou.",
          );
        }
        return;
      }
      const newFavorites = favorites.filter((t) => t.id !== team.id);
      setFavorites(newFavorites);
      try {
        const CACHE_KEY = CACHE_KEY_PREFIX + user.id;
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(newFavorites));
      } catch (e) {
        console.warn("Error saving updated favorites to cache:", e);
      }
    },
    [user, isConnected, favorites],
  );

  // --- Render ---
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
