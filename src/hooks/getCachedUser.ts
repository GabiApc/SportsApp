// src/utils/getCachedUser.ts
import { UserType } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_KEY = "@cached_user";

export async function getCachedUser(): Promise<UserType | null> {
  try {
    const json = await AsyncStorage.getItem(USER_KEY);
    if (!json) return null;
    const parsed: UserType = JSON.parse(json);
    // Aici poți valida rapid câmpurile esențiale, de ex: parsed.id && parsed.email etc.
    return parsed;
  } catch {
    return null;
  }
}
