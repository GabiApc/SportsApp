// src/hooks/useCachedTeamDetail.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { CachedTeamDetail } from "../../types";

const DETAILS_KEY = "@cached_team_details";

/**

Hook pentru a citi detaliile unei echipe cache-uite
*/
export function useCachedTeamDetail(teamId: string) {
  const [detail, setDetail] = useState<CachedTeamDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(DETAILS_KEY);
        const map = json
          ? (JSON.parse(json) as Record<string, CachedTeamDetail>)
          : {};
        setDetail(map[teamId] || null);
        console.log(map[teamId]);
      } catch (e) {
        console.warn("useCachedTeamDetail: failed to load", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [teamId]);

  return { detail, loading };
}
