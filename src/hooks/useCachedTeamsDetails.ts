// src/hooks/useCachedTeamDetail.ts
import { ApiTeam } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const DETAILS_KEY = "@cached_team_details";

/**

Hook pentru a citi detaliile unei echipe cache-uite
*/
export function useCachedTeamDetail(teamId: string) {
  const [detail, setDetail] = useState<ApiTeam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(DETAILS_KEY);
        const map = json ? (JSON.parse(json) as Record<string, ApiTeam>) : {};
        setDetail(map[teamId] || null);
      } catch (e) {
        console.warn("useCachedTeamDetail: failed to load", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [teamId]);

  return { detail, loading };
}
