// src/services/sportsApi.ts
import { ApiTeam, TeamsResponse } from "../../types";

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
