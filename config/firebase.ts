// firebase.ts sau firebase.js

// 1. Importuri de bază (valabile pentru ambele platforme)
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 2. Importuri pentru autentificare (diferite pe Web vs. Mobil)
import { Platform } from "react-native";

// - Pe Web folosim aceste două exporturi din "firebase/auth":
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";

// - Pe Mobil (React Native) folosim aceste două exporturi din "firebase/auth/react-native":

// 3. AsyncStorage pentru React Native Persistence
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// --------------------------------------------------
// 4. Configurația ta Firebase (cheile tale, identice)
// --------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBV87qTjm65oADc8n3R4E8luTNAEqGV9fA",
  authDomain: "sports-explorer-698cd.firebaseapp.com",
  projectId: "sports-explorer-698cd",
  storageBucket: "sports-explorer-698cd.appspot.com",
  messagingSenderId: "997288060693",
  appId: "1:997288060693:web:553fe08e16520f21b22b1c",
  measurementId: "G-1G5PLXYSV9",
};

// 5. Inițializezi aplicația Firebase o singură dată
const app = initializeApp(firebaseConfig);

// 6. Variabila care va conține instanța Auth, inițial goală
let authInstance;

// 7. Condiție pe baza platformei
if (Platform.OS === "web") {
  // --- Pentru Web: ---
  // Folosești getAuth și localStorage pentru persistarea sesiunii
  authInstance = getAuth(app);
  // Dacă vrei ca utilizatorul să rămână logat chiar și după închiderea tab-ului,
  // folosești browserLocalPersistence. Dacă vrei doar pentru sesiunea curentă, folosești browserSessionPersistence.
  // authInstance.setPersistence(browserSessionPersistence);
} else {
  // --- Pentru iOS/Android (React Native): ---
  // Folosești initializeAuth și AsyncStorage pentru persistarea locală
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
}

// 8. Exportă instanțele de Auth, Firestore, Storage
export const auth = authInstance;
export const firestore = getFirestore(app);
export const storage = getStorage(app);
