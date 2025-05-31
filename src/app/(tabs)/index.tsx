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
import React, { useCallback, useEffect, useState } from "react";
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

export default function TeamsScreen() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  // connectivity
  const [isConnected, setIsConnected] = useState(true);
  useEffect(() => {
    const sub = NetInfo.addEventListener((s) =>
      setIsConnected(!!s.isConnected),
    );
    return () => sub();
  }, []);

  useEffect(() => {
    // Dacă nu e niciun user, nu cerem token acum
    if (!user) return;

    // 1) Cerem permisiunea și token-ul Expo Push
    registerForPushNotificationsAsync()
      .then(async (token) => {
        console.log("Expo push token:", token);

        // 2) Actualizează câmpul expoPushToken în documentul user-ului din Firestore
        try {
          const userRef = doc(firestore, "users", user.id);
          await updateDoc(userRef, { expoPushToken: token });
          console.log("expoPushToken actualizat în Firestore");
        } catch (firestoreError) {
          console.warn("Nu s-a putut actualiza expoPushToken:", firestoreError);
        }
      })
      .catch((err) => {
        console.warn("Eroare la înregistrarea notificărilor push:", err);
      });
  }, [user]);

  // popular teams
  const { teams: apiTeams, loading } = useCachedTeams();

  // search + toast + login modal
  const [searchQuery, setSearchQuery] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [loginModal, setLoginModal] = useState(false);

  // favorites state + ids
  const [favorites, setFavorites] = useState<SectionTeam[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  // 1) load cached favorites on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      const cached = await getCachedFavorites();
      setFavorites(cached);
      setFavIds(new Set(cached.map((t) => t.id)));
    })();
  }, [user]);

  // 2) subscribe to Firestore favorites live
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setFavIds(new Set());
      return;
    }

    const favCol = collection(firestore, "users", user.id, "favorites");
    const unsub = onSnapshot(favCol, (snap) => {
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
    });
    return () => unsub();
  }, [user]);

  // 3) persist whenever favorites change
  useEffect(() => {
    AsyncStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(favorites),
    ).catch(console.warn);
  }, [favorites]);

  // map & filter
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

  // navigation
  const onTeamPress = useCallback(
    (team: SectionTeam) =>
      router.push({
        pathname: "/details/[teamId]",
        params: { teamId: team.id },
      }),
    [router],
  );

  // toggle favorite
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

  if (loading) {
    return (
      <View style={styles(theme).loader}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // first-run offline + no data
  if (!loading && !isConnected && filteredTeams.length === 0) {
    return (
      <View style={[styles(theme).loader, { padding: 20 }]}>
        <Text style={{ color: theme.textSecondary, textAlign: "center" }}>
          Nu ai internet și nu există date în cache.{"\n"}
          Verifică-ți conexiunea și reîncarcă aplicația.
        </Text>
      </View>
    );
  }

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
