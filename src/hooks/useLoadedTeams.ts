// src/hooks/useTeamsWithDetails.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { ApiTeam, CachedTeamDetail } from "../../types";
import { fetchTeamDetails, fetchTeamsByLeague } from "../services/sportsApi";

const LIST_KEY = "@cached_teams";
const DETAILS_KEY = "@cached_team_details";
const LIST_TS_KEY = "@cached_teams_list_ts";
const DETAILS_TS_KEY = "@cached_team_details_ts";

// TTL values
const LIST_TTL = 1000 * 60 * 30; // 30 minutes
const DETAILS_TTL = 1000 * 60; // 12 hours

/**
 * Hook pentru lista de echipe și detalii cu caching și invalidare condiționată
 */
export function useTeamsWithDetails(league: string) {
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [detailsMap, setDetailsMap] = useState<
    Record<string, CachedTeamDetail>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[useTeamsWithDetails] Mounting hook for league:", league);
    (async () => {
      try {
        // Check network status
        const netState = await NetInfo.fetch();
        const isConnected = !!netState.isConnected;
        console.log("[useTeamsWithDetails] Network connected:", isConnected);

        // Load cached data and timestamps
        const [cachedList, cachedDetails, listTsStr, detailsTsStr] =
          await Promise.all([
            AsyncStorage.getItem(LIST_KEY),
            AsyncStorage.getItem(DETAILS_KEY),
            AsyncStorage.getItem(LIST_TS_KEY),
            AsyncStorage.getItem(DETAILS_TS_KEY),
          ]);
        const now = Date.now();
        const listTs = listTsStr ? parseInt(listTsStr, 10) : 0;
        const detailsTs = detailsTsStr ? parseInt(detailsTsStr, 10) : 0;
        console.log(
          "[useTeamsWithDetails] Cached list timestamp:",
          listTs,
          "details timestamp:",
          detailsTs,
        );

        const isListStale = now - listTs >= LIST_TTL;
        const isDetailsStale = now - detailsTs >= DETAILS_TTL;
        console.log(
          "[useTeamsWithDetails] isListStale:",
          isListStale,
          "isDetailsStale:",
          isDetailsStale,
        );

        // If online and stale, clear cached entries to force refresh
        if (isConnected) {
          if (isListStale) {
            console.log("[useTeamsWithDetails] Clearing stale list cache");
            await AsyncStorage.removeItem(LIST_KEY);
          }
          if (isDetailsStale) {
            console.log("[useTeamsWithDetails] Clearing stale details cache");
            await AsyncStorage.removeItem(DETAILS_KEY);
          }
        }

        // 1) Load or fetch the teams list
        let freshTeams: ApiTeam[];
        if (!isListStale && cachedList) {
          freshTeams = JSON.parse(cachedList);
          console.log(
            "[useTeamsWithDetails] Loaded teams from cache:",
            freshTeams.length,
            "teams",
          );
        } else {
          console.log(
            "[useTeamsWithDetails] Fetching fresh teams for league:",
            league,
          );
          freshTeams = await fetchTeamsByLeague(league);
          console.log(
            "[useTeamsWithDetails] Fetched teams count:",
            freshTeams.length,
          );
          await AsyncStorage.setItem(LIST_KEY, JSON.stringify(freshTeams));
          await AsyncStorage.setItem(LIST_TS_KEY, now.toString());
          console.log("[useTeamsWithDetails] Saved fresh teams and timestamp");
        }
        setTeams(freshTeams);

        // 2) Load or fetch the detailed info
        if (!isDetailsStale && cachedDetails) {
          const details = JSON.parse(cachedDetails);
          console.log(
            "[useTeamsWithDetails] Loaded details from cache for IDs:",
            Object.keys(details),
          );
          setDetailsMap(details);
        } else {
          console.log("[useTeamsWithDetails] Fetching detailed info for teams");
          const rawDetails = await Promise.all(
            freshTeams.map((team) => fetchTeamDetails(team.idTeam)),
          );
          console.log(
            "[useTeamsWithDetails] Fetched details count:",
            rawDetails.filter((d) => !!d).length,
          );
          const minimal: Record<string, CachedTeamDetail> = {};
          rawDetails.forEach((detail) => {
            if (detail) minimal[detail.id] = detail;
          });
          console.log(
            "[useTeamsWithDetails] Parsed minimal details keys:",
            Object.keys(minimal),
          );
          setDetailsMap(minimal);
          await AsyncStorage.setItem(DETAILS_KEY, JSON.stringify(minimal));
          await AsyncStorage.setItem(DETAILS_TS_KEY, now.toString());
          console.log(
            "[useTeamsWithDetails] Saved fresh details and timestamp",
          );
        }
      } catch (error) {
        console.error("[useTeamsWithDetails] error", error);
      } finally {
        setLoading(false);
        console.log("[useTeamsWithDetails] Finished loading");
      }
    })();
  }, [league]);

  return { teams, detailsMap, loading };
}
