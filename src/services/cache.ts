// src/services/cache.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { fetchTeamsByLeague } from "./sportsApi";

const LIST_KEY = "@cached_teams";
const TIMESTAMP_KEY = "@cached_teams_timestamp";
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**

Prefetch and cache full teams list on app start
*/
export async function prefetchTeam(league: string) {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return;

  const tsStr = await AsyncStorage.getItem(TIMESTAMP_KEY);
  const now = Date.now();
  if (tsStr && now - parseInt(tsStr, 10) < CACHE_TTL) {
    return;
  }

  const teams = await fetchTeamsByLeague(league);
  await AsyncStorage.setItem(LIST_KEY, JSON.stringify(teams));
  await AsyncStorage.setItem(TIMESTAMP_KEY, now.toString());
}
