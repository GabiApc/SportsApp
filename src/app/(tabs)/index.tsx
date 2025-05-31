// src/screens/TeamsScreen.tsx

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
import { Colors } from "@/src/theme/colors";

import { getCachedFavorites } from "@/src/services/cache";
import { registerForPushNotificationsAsync } from "@/src/services/notifications";

// Folosim același key în AsyncStorage pentru favorite și user
const FAVORITES_STORAGE_KEY = "@cached_favorites";
const USER_STORAGE_KEY = "@cached_user";

// Tipul unei operațiuni în așteptare (offline)
type PendingOp = {
  id: string;
  action: "add" | "remove";
  team?: SectionTeam;
};

export default function TeamsScreen() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const pushRequestedRef = useRef<Record<string, boolean>>({});

  // 1) Starea de conectivitate la internet
  const [isConnected, setIsConnected] = useState(true);
  useEffect(() => {
    const sub = NetInfo.addEventListener((state) =>
      setIsConnected(!!state.isConnected),
    );
    return () => sub();
  }, []);

  // 2) Starea pentru lista de favorite + set favorit IDs
  const [favorites, setFavorites] = useState<SectionTeam[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  // 3) Coada de operațiuni „în așteptare” (pentru sincronizare la revenirea online)
  const [pendingOps, setPendingOps] = useState<PendingOp[]>([]);

  // --- 3.1) La montare: încărcăm coada de operațiuni din AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem("@pending_favorite_ops");
        if (json) {
          const ops: PendingOp[] = JSON.parse(json);
          setPendingOps(ops);
        }
      } catch (e) {
        console.warn("Eroare la încărcarea operațiunilor în așteptare:", e);
      }
    })();
  }, []);

  // --- 3.2) Salvăm coada de operațiuni de fiecare dată când se schimbă
  useEffect(() => {
    AsyncStorage.setItem(
      "@pending_favorite_ops",
      JSON.stringify(pendingOps),
    ).catch((e) =>
      console.warn("Eroare la salvarea operațiunilor în așteptare:", e),
    );
  }, [pendingOps]);

  // --- 4) Sincronizare pendingOps în Firestore la revenirea online ---
  useEffect(() => {
    if (!user || !isConnected || pendingOps.length === 0) return;

    const syncPending = async () => {
      const newPending: PendingOp[] = [];
      for (const op of pendingOps) {
        const favDocRef = doc(firestore, "users", user.id, "favorites", op.id);
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
    };

    syncPending();
  }, [user, isConnected, pendingOps]);

  // --- 5) Cerem token push-notifications la primul user/logare online ---
  useEffect(() => {
    if (!user || !isConnected) return;
    if (!pushRequestedRef.current[user.id]) {
      registerForPushNotificationsAsync()
        .then(async (token) => {
          try {
            const userRef = doc(firestore, "users", user.id);
            await updateDoc(userRef, { expoPushToken: token });
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

  // --- 6) Dacă user devine null (delogare), golim favorite și pendingOps ---
  useEffect(() => {
    if (!user) {
      // Atunci când utilizatorul face logout sau nu este logat:
      setFavorites([]);
      setFavIds(new Set());
      setPendingOps([]);
      // Ștergem lista din AsyncStorage, ca să nu mai reapară după logout:
      AsyncStorage.removeItem(FAVORITES_STORAGE_KEY).catch((e) =>
        console.warn("Eroare la ștergerea favorite din cache după logout:", e),
      );
      AsyncStorage.removeItem("@pending_favorite_ops").catch((e) =>
        console.warn("Eroare la ștergerea pending_ops după logout:", e),
      );
    }
  }, [user]);

  // --- 7) Gestionarea listei de favorite (verificăm și cache-ul de user, altfel nu încărcăm) ---
  useEffect(() => {
    (async () => {
      try {
        let effectiveUser = user;

        // 7.1) Dacă nu avem user în context, încercăm să-l citim din AsyncStorage
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

        // 7.2) Dacă nu există un user valid (nici în context, nici în cache), nu încărcăm favoritele
        if (!effectiveUser) {
          return;
        }

        // 7.3) Dacă avem user (din context sau din cache), încărcăm lista de favorite din cache
        const cachedFavs = await getCachedFavorites();
        setFavorites(cachedFavs);
        setFavIds(new Set(cachedFavs.map((t) => t.id)));
      } catch (e) {
        console.warn("Eroare la încărcarea favorite din cache:", e);
      }
    })();
  }, [user, setUser]);

  // --- 8) Abonare Firestore la favorites (numai dacă avem user și suntem online) ---
  const unsubscribeRef = useRef<() => void>(() => {});
  useEffect(() => {
    // Dezabonăm orice abonament anterior
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

        // Salvăm noua listă în cache
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

  // --- 9) Când ecranul primește focus și suntem offline, reîncărcăm lista din cache ---
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
      // Dacă suntem online, Firestore onSnapshot o să fi actualizat deja.
    }, [isConnected]),
  );

  // --- 10) Obținem lista de echipe din API („popular teams”) ---
  const { teams: apiTeams, loading } = useCachedTeams();

  // --- 11) Search + toast + login modal ---
  const [searchQuery, setSearchQuery] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [loginModal, setLoginModal] = useState(false);

  // --- 12) Pregătim lista de echipe cu flag-ul „favorited” pe baza lui favIds ---
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

  // --- 13) Navigare către pagina de detalii a echipei ---
  const onTeamPress = useCallback(
    (team: SectionTeam) =>
      router.push({
        pathname: "/details/[teamId]",
        params: { teamId: team.id },
      }),
    [router],
  );

  // --- 14) Toggle favorite (acum cu suport offline global) ---
  const toggleFav = useCallback(
    async (team: SectionTeam) => {
      if (!user) {
        setLoginModal(true);
        return;
      }

      const ref = doc(firestore, "users", user.id, "favorites", team.id);

      // Dacă suntem online, comportamentul e ca înainte: direct în Firestore
      if (isConnected) {
        if (favIds.has(team.id)) {
          // Ștergere online
          try {
            await deleteDoc(ref);
          } catch (e) {
            console.warn("Eroare la ștergerea favorite Firestore:", e);
          }
        } else {
          // Adăugare online
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

      // Dacă suntem offline, actualizăm imediat local + AsyncStorage + coada de pendingOps
      if (favIds.has(team.id)) {
        // Ștergere locală
        const updatedFavs = favorites.filter((t) => t.id !== team.id);
        const updatedIds = new Set(favIds);
        updatedIds.delete(team.id);
        setFavorites(updatedFavs);
        setFavIds(updatedIds);

        // Salvăm noua listă în AsyncStorage
        try {
          await AsyncStorage.setItem(
            FAVORITES_STORAGE_KEY,
            JSON.stringify(updatedFavs),
          );
        } catch (e) {
          console.warn("Eroare la salvarea favorite după ștergere offline:", e);
        }

        // Adăugăm operațiunea de tip "remove" în coadă
        setPendingOps((prev) => [...prev, { id: team.id, action: "remove" }]);
      } else {
        // Adăugare locală
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

        // Salvăm noua listă în AsyncStorage
        try {
          await AsyncStorage.setItem(
            FAVORITES_STORAGE_KEY,
            JSON.stringify(updatedFavs),
          );
        } catch (e) {
          console.warn("Eroare la salvarea favorite după adăugare offline:", e);
        }

        // Adăugăm operațiunea de tip "add" în coadă
        setPendingOps((prev) => [
          ...prev,
          { id: team.id, action: "add", team: newTeam },
        ]);
        setToastVisible(true);
      }
    },
    [user, isConnected, favIds, favorites],
  );

  // --- 15) Afișare loading dacă încărcăm datele din API ---
  if (loading) {
    return (
      <View style={styles(theme).loader}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // --- 16) Dacă suntem offline și nu există date API, afișăm mesaj ---
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

  // --- 17) UI-ul paginii propriu-zise ---
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
