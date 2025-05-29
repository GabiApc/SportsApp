import { auth, firestore } from "@/config/firebase";
import { AuthContextType, UserType } from "@/types";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
        });
        updateUserData(firebaseUser.uid);

        router.replace("/(tabs)");
      } else {
        setUser(null);
        // router.replace("/(auth)/login");
      }
    });
    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes("(auth/invalid-credential"))
        msg = "Email sau parolă incorecte";
      if (msg.includes("(auth/invalid-email")) msg = "Email invalid";
      return { success: false, msg };
    }
    // Implement your login logic here
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    surname: string,
  ) => {
    try {
      let response = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await setDoc(doc(firestore, "users", response?.user?.uid), {
        name,
        surname,
        email,
        id: response?.user?.uid,
      });
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes("(auth/email-already-in-use"))
        msg = "Există deja un cont cu acest email";
      return { success: false, msg };
    }
    // Implement your login logic here
  };

  const updateUserData = async (userId: string) => {
    // Implement your user data update logic here
    try {
      const docRef = doc(firestore, "users", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const userData: UserType = {
          id: data?.id,
          name: data.name || null,
          surname: data.surname || null,
          email: data.email || null,
        };
        setUser({ ...userData });
      } else {
        console.log("No such document!");
      }

      console.log("User data updated successfully");
    } catch (error: any) {
      let msg = error.message;
      // return { success: false, msg };
      console.log("error", msg);
    }
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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
