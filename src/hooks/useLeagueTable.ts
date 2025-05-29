// src/hooks/useCachedLeagueTable.ts
import { LeagueTableEntry } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { fetchLeagueTable } from "../services/sportsApi";

const TABLE_KEY = "@cached_league_table";
const TS_KEY = "@cached_league_table_ts";
// TTL for freshness (e.g. 30 minutes)
const TTL = 1000 * 60 * 30;

type Result = {
  table: LeagueTableEntry[];
  loading: boolean;
  error?: Error;
};

/**
 * Hook that reads a cached league table (if fresh),
 * and always triggers a background fetch to update it.
 */
export function useCachedLeagueTable(leagueId: string, season: string): Result {
  const [table, setTable] = useState<LeagueTableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 1) Load cache
        const [rawTable, rawTs] = await Promise.all([
          AsyncStorage.getItem(TABLE_KEY),
          AsyncStorage.getItem(TS_KEY),
        ]);
        const now = Date.now();
        const ts = rawTs ? parseInt(rawTs, 10) : 0;

        if (rawTable && now - ts < TTL) {
          // cache still valid
          const cached: LeagueTableEntry[] = JSON.parse(rawTable);
          if (mounted) setTable(cached);
        }

        // 2) Regardless, fetch fresh in background
        const net = await NetInfo.fetch();
        if (!net.isConnected) {
          // if offline and we had cache, we're done
          if (rawTable && now - ts < TTL) {
            setLoading(false);
            return;
          }
          // otherwise we will still try fetch and let it error
        }

        const fresh = await fetchLeagueTable(leagueId, season);
        if (mounted) {
          setTable(fresh);
          setError(undefined);
        }
        // persist fresh
        await AsyncStorage.setItem(TABLE_KEY, JSON.stringify(fresh));
        await AsyncStorage.setItem(TS_KEY, now.toString());
      } catch (e) {
        if (mounted) setError(e as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [leagueId, season]);

  return { table, loading, error };
}
