// src/screens/TeamsScreen.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { firestore } from "@/config/firebase";
import { useAuth } from "@/context/authContext";
import { useTheme } from "@/context/ThemeContext";
import { ConfirmationModal } from "@/src/components/ConfirmationModal";
import Toast from "@/src/components/FloatingToast";
import Header from "@/src/components/Header";
import {
  Team as SectionTeam,
  TeamsSection,
} from "@/src/components/TeamSection";
import { useCachedTeams } from "@/src/hooks/useCachedTeams";
import { Colors } from "@/src/theme/colors";

import { getCachedFavorites } from "@/src/services/cache";
import { registerForPushNotificationsAsync } from "@/src/services/notifications";

const FAVORITES_STORAGE_KEY = "@cached_favorites";
const USER_STORAGE_KEY = "@cached_user"; // cheia sub care păstrăm user-ul în AsyncStorage

export default function TeamsScreen() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const pushRequestedRef = useRef<Record<string, boolean>>({});

  // --- 1) Starea de conectivitate la internet ---
  const [isConnected, setIsConnected] = useState(true);
  useEffect(() => {
    const sub = NetInfo.addEventListener((state) =>
      setIsConnected(!!state.isConnected),
    );
    return () => sub();
  }, []);

  useEffect(() => {
    // Dacă nu există user sau nu suntem conectați, nu facem nimic.
    if (!user || !isConnected) return;

    // Dacă pentru acest user.id nu există încă un flag, înseamnă că nu am cerut tokenul:
    if (!pushRequestedRef.current[user.id]) {
      // 1) Cerem token-ul doar acum, pentru prima dată pentru acest user.
      registerForPushNotificationsAsync()
        .then(async (token) => {
          try {
            const userRef = doc(firestore, "users", user.id);
            await updateDoc(userRef, { expoPushToken: token });
            // După ce am actualizat cu succes, marchez flag-ul ca „true”
            pushRequestedRef.current[user.id] = true;
          } catch (firestoreError) {
            console.warn(
              "Nu s-a putut actualiza expoPushToken:",
              firestoreError,
            );
          }
        })
        .catch((err) => {
          console.warn("Eroare la înregistrarea notificărilor push:", err);
        });
    }
    // Dacă `pushRequestedRef.current[user.id]` este deja true, nu mai cer tokenul.
  }, [user, isConnected]);

  const [favorites, setFavorites] = useState<SectionTeam[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const cachedFavs = await getCachedFavorites();
        setFavorites(cachedFavs);
        setFavIds(new Set(cachedFavs.map((t) => t.id)));
      } catch (e) {
        console.warn("Eroare la încărcarea favorite din cache:", e);
      }
    })();
  }, []);

  // --- 5) Abonare la Firestore favorites, doar dacă avem user și internet ---
  const unsubscribeRef = useRef<() => void>(() => {});

  useEffect(() => {
    // Dacă există un abonament anterior, îl dezabonăm
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = () => {};
    }

    if (!user || !isConnected) {
      // Dacă nu avem user sau suntem offline, nu ne abonăm.
      return;
    }

    const favCol = collection(firestore, "users", user.id, "favorites");
    const unsub = onSnapshot(
      favCol,
      (snap) => {
        const ids = new Set<string>();
        const favs: SectionTeam[] = [];
        snap.forEach((d) => {
          ids.add(d.id);
          const data = d.data() as any;
          favs.push({
            id: d.id,
            name: data.name,
            logoUri: data.logoUri,
            leagueInfo: data.leagueInfo ?? "",
            favorited: true,
          });
        });
        setFavIds(ids);
        setFavorites(favs);
      },
      (error) => {
        console.warn("Eroare la sincronizarea favorite Firestore:", error);
      },
    );

    unsubscribeRef.current = () => unsub();

    return () => {
      unsub();
      unsubscribeRef.current = () => {};
    };
  }, [user, isConnected]);

  // --- 6) Persistăm favorites în cache de fiecare dată când se schimbă favorites ---
  useEffect(() => {
    AsyncStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(favorites),
    ).catch((e) => console.warn("Eroare la salvarea favorite în cache:", e));
  }, [favorites]);

  // --- 7) Persistăm user în cache (dacă apare sau se schimbă), ca să-l putem folosi offline ---
  useEffect(() => {
    if (user) {
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)).catch((e) =>
        console.warn("Eroare la salvarea user-ului în cache:", e),
      );
    }
  }, [user]);

  // --- 8) Obținem lista de echipe din API („popular teams”) ---
  const { teams: apiTeams, loading } = useCachedTeams();

  // --- 9) Search + toast + login modal ---
  const [searchQuery, setSearchQuery] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [loginModal, setLoginModal] = useState(false);

  // --- 10) Pregătim lista de echipe cu flag-ul „favorited” bazat pe favIds ---
  const sectionTeams: SectionTeam[] = apiTeams.map((t) => ({
    id: t.idTeam,
    name: t.strTeam,
    leagueInfo: t.strLeague ?? "",
    logoUri: t.strBadge,
    favorited: favIds.has(t.idTeam),
  }));
  const filteredTeams = sectionTeams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  // --- 11) Navigare către pagina de detalii a echipei ---
  const onTeamPress = useCallback(
    (team: SectionTeam) =>
      router.push({
        pathname: "/details/[teamId]",
        params: { teamId: team.id },
      }),
    [router],
  );

  // --- 12) Toggle favorită (online, dacă avem user) ---
  const toggleFav = useCallback(
    async (team: SectionTeam) => {
      if (!user) {
        setLoginModal(true);
        return;
      }
      const ref = doc(firestore, "users", user.id, "favorites", team.id);
      if (favIds.has(team.id)) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, {
          name: team.name,
          logoUri: team.logoUri,
          leagueInfo: team.leagueInfo,
        });
        setToastVisible(true);
      }
    },
    [favIds, user],
  );

  // --- 13) Afișare loading dacă încărcăm datele din API ---
  if (loading) {
    return (
      <View style={styles(theme).loader}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // --- 14) Dacă suntem offline și nu există date în cache de echipe/filter, afișăm un mesaj de eroare ---
  if (!loading && !isConnected && filteredTeams.length === 0) {
    return (
      <View style={[styles(theme).loader, { padding: 20 }]}>
        <Text style={{ color: theme.textSecondary, textAlign: "center" }}>
          Nu ai internet și nu există date în cache.{"\n"}Verifică-ți conexiunea
          și reîncarcă aplicația.
        </Text>
      </View>
    );
  }

  // --- 15) UI-ul paginii propriu-zise ---
  return (
    <View style={styles(theme).container}>
      <Toast
        message="Echipa a fost adăugată la favorite!"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
      <ConfirmationModal
        visible={loginModal}
        title="Trebuie să fii logat pentru a salva la favorite"
        message="Vrei să te loghezi?"
        onConfirm={() => {
          setLoginModal(false);
          router.push("/login");
        }}
        onCancel={() => setLoginModal(false)}
      />
      <Header
        onProfilePress={() => {}}
        onSearchChange={setSearchQuery}
        iconName="user"
        iconState={Boolean(user)}
      />
      <View style={styles(theme).section}>
        <TeamsSection
          title="Echipe populare"
          teams={filteredTeams}
          onPressTeam={onTeamPress}
          onToggleFavorite={toggleFav}
        />
      </View>
    </View>
  );
}

const styles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    section: {
      flex: 1,
      width: "100%",
      paddingHorizontal: 16,
      marginBottom: 150,
    },
    loader: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });
