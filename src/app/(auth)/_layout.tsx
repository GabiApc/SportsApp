// File: app/(auth)/_layout.tsx
import { Stack } from "expo-router";
import React from "react";

/**
 * Layout for all authentication screens (login, register, forgot-password).
 * Placed under app/(auth)/_layout.tsx, this Stack groups auth-related routes
 * and hides the header since screens will provide their own or be full-screen.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // hide default header
        gestureEnabled: false, // disable swipe-back on auth screens
      }}
    >
      {/* Order here determines back navigation */}
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      {/* <Stack.Screen name="forgot-password" />  */}
    </Stack>
  );
}
