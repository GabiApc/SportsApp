// src/services/sportsApi.ts
import {
  ApiEvent,
  ApiTeam,
  EventsResponse,
  LeagueTableEntry,
  TeamsResponse,
} from "../../types";

const API_KEY = 3;
const BASE_URL = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

/**
 * Fetch all teams in a league, including details
 */
export async function fetchTeamsByLeague(league: string): Promise<ApiTeam[]> {
  const url = `${BASE_URL}/search_all_teams.php?l=${encodeURIComponent(
    league,
  )}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data: TeamsResponse = await res.json();
  return data.teams ?? [];
}

export async function fetchLastEventsByTeam(
  teamId: string,
): Promise<ApiEvent[]> {
  const url = `${BASE_URL}/eventslast.php?id=${encodeURIComponent(teamId)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Error fetching last events for team ${teamId}: ${res.status}`,
    );
  }
  const data: EventsResponse = await res.json();
  // The API returns { results: ApiEvent[] }
  return data.results ?? [];
}

export async function fetchLastEventsByTeams(
  teamIds: string[],
): Promise<Record<string, ApiEvent[]>> {
  // pentru fiecare teamId rulăm fetchLastEventsByTeam
  const entries = await Promise.all(
    teamIds.map(async (id) => {
      const events = await fetchLastEventsByTeam(id);
      return [id, events] as [string, ApiEvent[]];
    }),
  );
  // transformăm array-ul de tuple în obiect
  return Object.fromEntries(entries);
}

export async function fetchLeagueTable(
  leagueId: string,
  season: string,
): Promise<LeagueTableEntry[]> {
  const url = `${BASE_URL}/lookuptable.php?l=${leagueId}&s=${encodeURIComponent(
    season,
  )}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error fetching table: ${res.status}`);
  const json = await res.json();
  // API returns { table: LeagueTableEntry[] }
  return (json.table as LeagueTableEntry[]) ?? [];
}
