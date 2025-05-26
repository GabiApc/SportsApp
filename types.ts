export type AuthContextType = {
  user: UserType;
  setUser: Function;
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
  id?: string;
  name: string;
  surname: string;
  email: string;
} | null;
