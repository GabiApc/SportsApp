import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect } from "@react-navigation/native";
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
import { getCachedFavorites } from "@/src/services/cache";
import { registerForPushNotificationsAsync } from "@/src/services/notifications";
import { Colors } from "@/src/theme/colors";

// --- CONSTANTS & TYPES ---
const FAVORITES_STORAGE_KEY = "@cached_favorites";
const USER_STORAGE_KEY = "@cached_user";
type PendingOp = { id: string; action: "add" | "remove"; team?: SectionTeam };

// --- COMPONENT ---
export default function TeamsScreen() {
  // --- CONTEXT & HOOKS ---
  const { user, setUser } = useAuth();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const pushRequestedRef = useRef<Record<string, boolean>>({});

  // --- STATE ---
  const [isConnected, setIsConnected] = useState(true);
  const [favorites, setFavorites] = useState<SectionTeam[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [pendingOps, setPendingOps] = useState<PendingOp[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [loginModal, setLoginModal] = useState(false);

  // --- EFFECTS: CONNECTIVITY ---
  useEffect(() => {
    const sub = NetInfo.addEventListener((state) =>
      setIsConnected(!!state.isConnected),
    );
    return () => sub();
  }, []);

  // --- EFFECTS: PENDING OPS STORAGE ---
  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem("@pending_favorite_ops");
        if (json) setPendingOps(JSON.parse(json));
      } catch (e) {
        console.warn("Eroare la încărcarea operațiunilor în așteptare:", e);
      }
    })();
  }, []);
  useEffect(() => {
    AsyncStorage.setItem(
      "@pending_favorite_ops",
      JSON.stringify(pendingOps),
    ).catch((e) =>
      console.warn("Eroare la salvarea operațiunilor în așteptare:", e),
    );
  }, [pendingOps]);

  // --- EFFECTS: SYNC PENDING OPS ONLINE ---
  useEffect(() => {
    if (!user || !isConnected || pendingOps.length === 0) return;
    syncPendingOps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isConnected, pendingOps]);

  // --- EFFECTS: PUSH NOTIFICATIONS ---
  useEffect(() => {
    if (!user || !isConnected) return;
    if (!pushRequestedRef.current[user.id]) {
      registerForPushNotificationsAsync()
        .then(async (token) => {
          try {
            await updateDoc(doc(firestore, "users", user.id), {
              expoPushToken: token,
            });
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
  }, [user, isConnected]);

  // --- EFFECTS: LOGOUT CLEANUP ---
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setFavIds(new Set());
      setPendingOps([]);
      AsyncStorage.removeItem(FAVORITES_STORAGE_KEY).catch((e) =>
        console.warn("Eroare la ștergerea favorite din cache după logout:", e),
      );
      AsyncStorage.removeItem("@pending_favorite_ops").catch((e) =>
        console.warn("Eroare la ștergerea pending_ops după logout:", e),
      );
    }
  }, [user]);

  // --- EFFECTS: LOAD FAVORITES FROM CACHE OR USER ---
  useEffect(() => {
    (async () => {
      try {
        let effectiveUser = user;
        if (!effectiveUser) {
          const storedUserJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
          if (storedUserJson) {
            const parsedUser = JSON.parse(storedUserJson);
            if (parsedUser && parsedUser.id) {
              setUser(parsedUser);
              effectiveUser = parsedUser;
            }
          }
        }
        if (!effectiveUser) return;
        const cachedFavs = await getCachedFavorites(effectiveUser.id);
        setFavorites(cachedFavs);
        setFavIds(new Set(cachedFavs.map((t) => t.id)));
      } catch (e) {
        console.warn("Eroare la încărcarea favorite din cache:", e);
      }
    })();
  }, [user, setUser]);

  // --- EFFECTS: FIRESTORE SUBSCRIPTION ---
  const unsubscribeRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = () => {};
    }
    if (!user || !isConnected) return;
    const favCol = collection(firestore, "users", user.id, "favorites");
    const unsub = onSnapshot(
      favCol,
      async (snap) => {
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
        try {
          await AsyncStorage.setItem(
            FAVORITES_STORAGE_KEY,
            JSON.stringify(favs),
          );
        } catch (e) {
          console.warn("Eroare la salvarea favorite în cache:", e);
        }
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

  // --- EFFECTS: RELOAD FAVORITES FROM CACHE ON FOCUS (OFFLINE) ---
  useFocusEffect(
    useCallback(() => {
      if (!isConnected) {
        AsyncStorage.getItem(FAVORITES_STORAGE_KEY)
          .then((json) => {
            if (json) {
              const cached: SectionTeam[] = JSON.parse(json);
              setFavorites(cached);
              setFavIds(new Set(cached.map((t) => t.id)));
            }
          })
          .catch((e) => console.warn("Eroare la reload cache pe focus:", e));
      }
    }, [isConnected]),
  );

  // --- DATA: TEAMS FROM API ---
  const { teams: apiTeams, loading } = useCachedTeams();

  // --- DATA: FILTERED TEAMS ---
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

  // --- HANDLERS ---
  const onTeamPress = useCallback(
    (team: SectionTeam) =>
      router.push({
        pathname: "/details/[teamId]",
        params: { teamId: team.id },
      }),
    [router],
  );

  const toggleFav = useCallback(
    async (team: SectionTeam) => {
      if (!user) {
        setLoginModal(true);
        return;
      }
      const ref = doc(firestore, "users", user.id, "favorites", team.id);
      if (isConnected) {
        if (favIds.has(team.id)) {
          try {
            await deleteDoc(ref);
          } catch (e) {
            console.warn("Eroare la ștergerea favorite Firestore:", e);
          }
        } else {
          try {
            await setDoc(ref, {
              name: team.name,
              logoUri: team.logoUri,
              leagueInfo: team.leagueInfo,
            });
            setToastVisible(true);
          } catch (e) {
            console.warn("Eroare la adăugarea favorite Firestore:", e);
          }
        }
        return;
      }
      // Offline logic
      if (favIds.has(team.id)) {
        const updatedFavs = favorites.filter((t) => t.id !== team.id);
        const updatedIds = new Set(favIds);
        updatedIds.delete(team.id);
        setFavorites(updatedFavs);
        setFavIds(updatedIds);
        try {
          await AsyncStorage.setItem(
            FAVORITES_STORAGE_KEY,
            JSON.stringify(updatedFavs),
          );
        } catch (e) {
          console.warn("Eroare la salvarea favorite după ștergere offline:", e);
        }
        setPendingOps((prev) => [...prev, { id: team.id, action: "remove" }]);
      } else {
        const newTeam: SectionTeam = {
          id: team.id,
          name: team.name,
          logoUri: team.logoUri,
          leagueInfo: team.leagueInfo,
          favorited: true,
        };
        const updatedFavs = [...favorites, newTeam];
        const updatedIds = new Set(favIds);
        updatedIds.add(team.id);
        setFavorites(updatedFavs);
        setFavIds(updatedIds);
        try {
          await AsyncStorage.setItem(
            FAVORITES_STORAGE_KEY,
            JSON.stringify(updatedFavs),
          );
        } catch (e) {
          console.warn("Eroare la salvarea favorite după adăugare offline:", e);
        }
        setPendingOps((prev) => [
          ...prev,
          { id: team.id, action: "add", team: newTeam },
        ]);
        setToastVisible(true);
      }
    },
    [user, isConnected, favIds, favorites],
  );

  // --- RENDER ---
  if (loading) {
    return (
      <View style={styles(theme).loader}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
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

  // --- UTILITIES ---
  async function syncPendingOps() {
    const newPending: PendingOp[] = [];
    for (const op of pendingOps) {
      const favDocRef = doc(firestore, "users", user!.id, "favorites", op.id);
      try {
        if (op.action === "add" && op.team) {
          await setDoc(favDocRef, {
            name: op.team.name,
            logoUri: op.team.logoUri,
            leagueInfo: op.team.leagueInfo,
          });
        } else if (op.action === "remove") {
          await deleteDoc(favDocRef);
        }
      } catch (e) {
        console.warn(
          `Eroare la sincronizarea operației ${op.action} pentru ${op.id}:`,
          e,
        );
        newPending.push(op);
      }
    }
    setPendingOps(newPending);
  }
}

// --- STYLES ---
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
