// src/services/cache.ts
import { firestore } from "@/config/firebase";
import { Team as SectionTeam } from "@/src/components/TeamSection";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { collection, getDocs } from "firebase/firestore";
import { fetchLeagueTable, fetchTeamsByLeague } from "./sportsApi";

const LIST_KEY = "@cached_teams";
const TIMESTAMP_KEY = "@cached_teams_timestamp";
const CACHE_TTL = 1000 * 60 * 60 * 24; // 1 hour

const FAVORITES_KEY = "@cached_favorites";
const FAVORITES_TS_KEY = "@cached_favorites_ts";
const FAV_TTL = 1000 * 60 * 60 * 24; // 30 minutes

/**
 * Prefetch and cache full teams list on app start
 */
export async function prefetchTeam(league: string) {
  const net = await NetInfo.fetch();
  if (!net.isConnected) return;

  const tsStr = await AsyncStorage.getItem(TIMESTAMP_KEY);
  const now = Date.now();
  if (tsStr && now - parseInt(tsStr, 10) < CACHE_TTL) return;

  const teams = await fetchTeamsByLeague(league);
  await AsyncStorage.setItem(LIST_KEY, JSON.stringify(teams));
  await AsyncStorage.setItem(TIMESTAMP_KEY, now.toString());
}

/**
 * Prefetch and cache league table on app start
 */
export async function prefetchLeagueTable(leagueId: string, season: string) {
  const net = await NetInfo.fetch();
  if (!net.isConnected) return;

  const tsStr = await AsyncStorage.getItem("@cached_league_table_timestamp");
  const now = Date.now();
  if (tsStr && now - parseInt(tsStr, 10) < 1000 * 60 * 30) return;

  const table = await fetchLeagueTable(leagueId, season);
  await AsyncStorage.setItem("@cached_league_table", JSON.stringify(table));
  await AsyncStorage.setItem("@cached_league_table_timestamp", now.toString());
}
/**
 * Prefetch and cache current user's favorites on app start
 */
// în loc de constantă FIXĂ, punem prefix și apoi userId
const FAVORITES_KEY_PREFIX = "@cached_favorites_";
const FAVORITES_TS_KEY_PREFIX = "@cached_favorites_ts_";

export async function prefetchFavorites(userId: string) {
  const net = await NetInfo.fetch();
  if (!net.isConnected) return;

  const FAVORITES_KEY = FAVORITES_KEY_PREFIX + userId; // ex: "@cached_favorites_ABC"
  const FAVORITES_TS_KEY = FAVORITES_TS_KEY_PREFIX + userId; // ex: "@cached_favorites_ts_ABC"

  const tsStr = await AsyncStorage.getItem(FAVORITES_TS_KEY);
  const now = Date.now();
  if (tsStr && now - parseInt(tsStr, 10) < FAV_TTL) {
    return; // încă mai sunt fresh în cache
  }

  try {
    const snap = await getDocs(
      collection(firestore, "users", userId, "favorites"),
    );
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

    // Salvăm favoritele în cache sub cheia specifică userului
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    await AsyncStorage.setItem(FAVORITES_TS_KEY, now.toString());
  } catch (e) {
    console.warn("prefetchFavorites failed", e);
  }
}

export async function getCachedFavorites(
  userId: string,
): Promise<SectionTeam[]> {
  const FAVORITES_KEY = FAVORITES_KEY_PREFIX + userId;
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
