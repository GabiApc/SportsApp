// utils/pushNotifications.ts

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";

/**
 * Gestionează erorile de registrare la notificări push.
 * Dacă apare o eroare, afișează un alert și aruncă o excepție.
 */
function handleRegistrationError(errorMessage: string): void {
  Alert.alert("Notification Error", errorMessage);
  throw new Error(errorMessage);
}

/**
 * Înregistrează dispozitivul pentru notificări push Expo.
 *
 * - Pentru Android: setează canalul de notificări.
 * - Cere permisiunea utilizatorului. Dacă nu e acordată, trimite un error.
 * - Obține token-ul Expo Push Token și îl returnează.
 * - Dacă nu găsește `projectId` în configurație, raportează eroare.
 *
 * @returns Promise<string> — Expo push token
 */
export async function registerForPushNotificationsAsync(): Promise<string> {
  // Pentru Android, trebuie să definim un canal (notification channel):
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  // Asigură-te că codul e rulat pe un dispozitiv fizic (nu emulator/simulator):
  if (!Device.isDevice) {
    handleRegistrationError(
      "Trebuie să folosești un dispozitiv fizic pentru notificări push.",
    );
  }

  // Verifică permisiunile curente:
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Dacă nu s-a acordat încă permisiunea, o cerem acum:
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // Dacă permisiunea nu e acordată, raportăm eroarea:
  if (finalStatus !== "granted") {
    handleRegistrationError(
      "Permisiunea pentru notificări nu a fost acordată!",
    );
  }

  // Extragem projectId din configurația Expo (easConfig sau expoConfig.extra)
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;
  if (!projectId) {
    handleRegistrationError("Project ID nu a fost găsit în configurația Expo.");
  }

  // Obținem token-ul Expo Push Token și îl returnăm:
  try {
    const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId }))
      .data;
    return pushToken;
  } catch (e: unknown) {
    handleRegistrationError(`Eroare la obținerea push token: ${e}`);
  }

  // Dacă, dintr-un motiv neașteptat, codul ajunge aici:
  throw new Error("Nu a reușit obținerea push token-ului.");
}

/**
 * Trimite un push notification către un anumit Expo push token.
 *
 * @param expoPushToken – token-ul Expo al dispozitivului țintă
 * @param title – titlul notificării (opțional, default: 'No Title')
 * @param body – textul corpului notificării (opțional, default: 'No Body')
 * @param data – payload-ul suplimentar care se transmite odată cu notificarea
 */
export async function sendPushNotification(
  expoPushToken: string,
  title: string = "No Title",
  body: string = "No Body",
  data: Record<string, any> = {},
): Promise<void> {
  // Construim obiectul mesaj:
  const message = {
    to: expoPushToken,
    sound: "default",
    title,
    body,
    data,
  };

  // Facem request-ul către endpoint-ul Expo de push:
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}

/**
 * Setăm handler-ul global pentru modul în care afișăm notificările
 * (sunet, badge, banner, etc.) când aplicația e în foreground.
 * Acesta nu e neapărat o funcție exportată, ci e apelat o singură dată la inițializare.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
