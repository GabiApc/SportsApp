// src/screens/TeamsScreen.tsx (sau Index.tsx)
import { firestore } from "@/config/firebase";
import { useAuth } from "@/context/authContext";
import { ConfirmationModal } from "@/src/components/ConfirmationModal";
import Header from "@/src/components/Header";
import {
  Team as SectionTeam,
  TeamsSection,
} from "@/src/components/TeamSection";
import { useCachedTeams } from "@/src/hooks/useCachedTeams";
import { useTheme } from "@/src/hooks/useTheme";
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

// **Înlocuieşte** useLoadedTeams cu useTeamsWithDetails:

export default function TeamsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDarkMode = colorScheme === "dark";
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const [Visible, setVisible] = useState(false);

  // apelăm noul hook
  const { teams: apiTeams, loading } = useCachedTeams();

  // favorites din Firestore
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

  // mapăm ApiTeam → SectionTeam
  const sectionTeams: SectionTeam[] = apiTeams.map((t) => ({
    id: t.idTeam,
    name: t.strTeam,
    // poţi lua league-ul direct din detailsMap dacă vrei mai multe niveluri
    leagueInfo: t.strLeague ?? "",
    logoUri: t.strBadge,
    favorited: favIds.has(t.idTeam),
  }));

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
        return setVisible(true);
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

  function handleConfirmLogin(): void {
    setVisible(false);
    router.push("/login");
  }
  function handleCancelLogin(): void {
    setVisible(false);
  }

  return (
    <View style={styles(theme).container}>
      <ConfirmationModal
        visible={Visible}
        title="Trebuie să fii logat pentru a salva la favorite"
        message="Vrei să te loghezi?"
        onConfirm={handleConfirmLogin}
        onCancel={handleCancelLogin}
      />
      <Header
        onProfilePress={() => {}}
        onSearchChange={(q) => console.log("Căutare:", q)}
        iconName="user"
        iconState={Boolean(user)}
      />
      <View style={styles(theme).section}>
        <TeamsSection
          title="Echipe populare"
          teams={sectionTeams}
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
    },
    loader: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });
