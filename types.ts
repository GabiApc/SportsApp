// types.ts
export type AuthContextType = {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; msg?: string }>;
  register: (
    email: string,
    password: string,
    name: string,
    surname: string,
  ) => Promise<{ success: boolean; msg?: string }>;
  updateUserData: (userId: string) => Promise<void>;
};

export type UserType = {
  id: string;
  name: string;
  surname: string;
  email: string;
};
export interface ApiTeam {
  idTeam: string;
  strTeam: string;
  strBadge: string;
  strLeague?: string;
  intFormedYear?: string;
  strStadium?: string;
  strManager?: string;
  strStadiumLocation?: string;
  strCountry?: string;
  strDescriptionEN?: string;
  strMascots?: string;
}

export interface TeamsResponse {
  teams: ApiTeam[] | null;
}

export interface ApiEvent {
  idEvent: string;
  strEvent: string;
  dateEvent: string;
  intHomeScore: string;
  intAwayScore: string;
}

export interface EventsResponse {
  results?: ApiEvent[];
}
export interface LeagueTableEntry {
  name: string;
  intRank: string;
  idTeam: string;
  idLeague: string;
  idSeason: string;
  strSeason: string;
  strForm: string;
  intPlayed: string;
  intWin: string;
  intDraw: string;
  intLoss: string;
  intGoalsFor: string;
  intGoalsAgainst: string;
  intGoalDifference: string;
  intPoints: string;
  intBadge: string;
}
