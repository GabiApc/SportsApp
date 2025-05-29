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
import { useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function TeamsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  // full list from cache
  const { teams: apiTeams, loading } = useCachedTeams();

  // search query state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toastVisible, setToastVisible] = useState(false);

  // favorites from Firestore
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setFavIds(new Set());
      return;
    }
    const favCol = collection(firestore, "users", user.id, "favorites");
    const unsub = onSnapshot(favCol, (snap) => {
      const ids = new Set<string>();
      snap.forEach((d) => ids.add(d.id));
      setFavIds(ids);
    });
    return () => unsub();
  }, [user]);

  // map API → SectionTeam
  const sectionTeams: SectionTeam[] = apiTeams.map((t) => ({
    id: t.idTeam,
    name: t.strTeam,
    leagueInfo: t.strLeague ?? "",
    logoUri: t.strBadge,
    favorited: favIds.has(t.idTeam),
  }));

  // filter by search query (case-insensitive substring)
  const filteredTeams = sectionTeams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  // navigation to details
  const onTeamPress = useCallback(
    (team: SectionTeam) => {
      router.push({
        pathname: "/details/[teamId]",
        params: { teamId: team.id },
      });
    },
    [router],
  );

  // toggle favorite
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

      {/* Pass `setSearchQuery` into Header so typing there updates our state */}
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
