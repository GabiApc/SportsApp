// src/hooks/useCachedTeams.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ApiTeam } from "../../types";

const LIST_KEY = "@cached_teams";

/**

Hook pentru a citi lista de echipe cache-uite
*/
export function useCachedTeams() {
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(LIST_KEY);
        if (json) setTeams(JSON.parse(json));
      } catch (e) {
        console.warn("useCachedTeams: failed to load", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { teams, loading };
}
