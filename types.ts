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
