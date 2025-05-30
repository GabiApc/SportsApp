import { auth, firestore } from "@/config/firebase";
import { AuthContextType, UserType } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const USER_KEY = "@cached_user";
const PENDING_KEY = "@pending_user_update";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [pendingUpdate, setPendingUpdate] = useState<Partial<
    Pick<UserType, "name" | "email">
  > | null>(null);
  const router = useRouter();

  // 1) Load cached user on startup
  useEffect(() => {
    (async () => {
      const json = await AsyncStorage.getItem(USER_KEY);
      if (json) {
        try {
          setUser(JSON.parse(json));
        } catch {
          await AsyncStorage.removeItem(USER_KEY);
        }
      }
      const pend = await AsyncStorage.getItem(PENDING_KEY);
      if (pend) {
        setPendingUpdate(JSON.parse(pend));
      }
    })();
  }, []);

  // 2) Listen to Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // fetch profile from Firestore
        const ref = doc(firestore, "users", firebaseUser.uid);
        const snap = await getDoc(ref);
        const data = snap.exists() ? snap.data() : {};
        const u: UserType = {
          id: firebaseUser.uid,
          name: data.name || firebaseUser.displayName || "",
          surname: data.surname || "",
          email: data.email || firebaseUser.email || "",
        };
        setUser(u);

        await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
        router.replace("/(tabs)");
      } else {
        setUser(null);
        await AsyncStorage.removeItem(USER_KEY);
      }
    });
    return () => unsub();
  }, [router]);

  // 3) When connectivity returns, apply any pending update
  useEffect(() => {
    const sub = NetInfo.addEventListener(async (state) => {
      if (state.isConnected && pendingUpdate && user) {
        try {
          const ref = doc(firestore, "users", user.id);
          await updateDoc(ref, pendingUpdate);
          setPendingUpdate(null);
          await AsyncStorage.removeItem(PENDING_KEY);
        } catch {
          // still offline or failed—keep pending
        }
      }
    });
    return () => sub();
  }, [pendingUpdate, user]);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err: any) {
      let msg = err.message;
      if (msg.includes("auth/invalid-credential"))
        msg = "Email sau parolă incorecte";
      if (msg.includes("auth/invalid-email")) msg = "Email invalid";
      return { success: false, msg };
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    surname: string,
  ) => {
    try {
      const resp = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(firestore, "users", resp.user.uid), {
        id: resp.user.uid,
        name,
        surname,
        email,
      });
      return { success: true };
    } catch (err: any) {
      let msg = err.message;
      if (msg.includes("auth/email-already-in-use"))
        msg = "Există deja un cont cu acest email";
      return { success: false, msg };
    }
  };

  const updateUserData = async (userId: string) => {
    try {
      const snap = await getDoc(doc(firestore, "users", userId));
      if (snap.exists()) {
        const data = snap.data();
        const u: UserType = {
          id: data.id,
          name: data.name,
          surname: data.surname,
          email: data.email,
        };
        setUser(u);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
      }
    } catch (e) {
      console.error("Failed to update user data:", e);
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    // onAuthStateChanged will clear cache & redirect
  };

  const contextValue: AuthContextType = {
    user,
    setUser,
    login,
    register,
    updateUserData,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
