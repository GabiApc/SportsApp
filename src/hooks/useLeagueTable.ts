// src/hooks/useLeagueTable.ts
import { LeagueTableEntry } from "@/types";
import { useEffect, useState } from "react";
import { fetchLeagueTable } from "../services/sportsApi";

export function useLeagueTable(
  leagueId: string,
  season: string,
): {
  table: LeagueTableEntry[];
  loading: boolean;
  error?: Error;
} {
  const [table, setTable] = useState<LeagueTableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchLeagueTable(leagueId, season);
        if (mounted) setTable(data);
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
