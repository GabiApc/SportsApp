// src/screens/TeamsScreen.tsx
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useRouter } from "expo-router";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const FAVORITES_STORAGE_KEY = "@cached_favorites";

export default function TeamsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const [isConnected, setIsConnected] = useState<boolean>(true);

  useEffect(() => {
    // subscribe to network changes
    const sub = NetInfo.addEventListener((state) => {
      setIsConnected(!!state.isConnected);
    });
    return () => sub();
  }, []);
  // full list from cache or API
  const { teams: apiTeams, loading } = useCachedTeams();

  // search query state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toastVisible, setToastVisible] = useState(false);

  // favorites from Firestore
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  // also keep full SectionTeam[] for local cache
  const [favorites, setFavorites] = useState<SectionTeam[]>([]);

  // subscribe to Firestore favorites
  useEffect(() => {
    if (!user) {
      setFavIds(new Set());
      setFavorites([]);
      return;
    }
    const favCol = collection(firestore, "users", user.id, "favorites");
    const unsub = onSnapshot(favCol, (snap) => {
      const ids = new Set<string>();
      const favs: SectionTeam[] = [];
      snap.forEach((d) => {
        ids.add(d.id);
        const data = d.data() as {
          name: string;
          logoUri: string;
          leagueInfo?: string;
        };
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
  }, [user, favorites.length]);

  // persist favorites list to AsyncStorage whenever it changes
  useEffect(() => {
    AsyncStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(favorites),
    ).catch(console.warn);
  }, [favorites]);

  // on mount, load cached favorites if Firestore is empty or offline
  useEffect(() => {
    (async () => {
      if (!user) {
        return;
      }
      try {
        const raw = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
        if (raw && favorites.length === 0) {
          setFavorites(JSON.parse(raw));
          // also update favIds so UI toggles correctly
          setFavIds(new Set(JSON.parse(raw).map((t: SectionTeam) => t.id)));
        }
      } catch {
        // ignore
      }
    })();
  }, [user, favorites.length]);

  // map API → SectionTeam for display
  const sectionTeams: SectionTeam[] = apiTeams.map((t) => ({
    id: t.idTeam,
    name: t.strTeam,
    leagueInfo: t.strLeague ?? "",
    logoUri: t.strBadge,
    favorited: favIds.has(t.idTeam),
  }));

  // filter by search query
  const filteredTeams = sectionTeams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
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

  const [modalVisible, setModalVisible] = useState(false);
  const toggleFav = useCallback(
    async (team: SectionTeam) => {
      if (!user) {
        setModalVisible(true);
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

  const handleConfirmLogin = () => {
    setModalVisible(false);
    router.push("/login");
  };
  const handleCancelLogin = () => setModalVisible(false);
  // first‐run offline + no cache → friendly message
  if (!loading && filteredTeams.length === 0 && !isConnected) {
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
        visible={modalVisible}
        title="Trebuie să fii logat pentru a salva la favorite"
        message="Vrei să te loghezi?"
        onConfirm={handleConfirmLogin}
        onCancel={handleCancelLogin}
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
