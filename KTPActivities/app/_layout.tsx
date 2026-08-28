
import { Stack } from 'expo-router/stack';
import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, signOut } from "./firebaseConfig";
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { ErrorBoundary } from 'react-error-boundary';
import { setupGlobalErrorHandlers } from './utils/globalErrorHandlers';
import ErrorFallback from './utils/ErrorFallback';

export default function Layout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Set up universal JS error catching as early as possible:
    // - ErrorUtils for sync errors (many onPress / button click cases)
    // - Hermes promise rejection tracker for async API calls, async onPress, unhandled promises
    setupGlobalErrorHandlers((error, isFatal, context) => {
      // Hook point for future crash reporting (Sentry, etc.)
      // console.error is already done inside the handler for visibility.
    });
  }, []);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        // Render / component tree errors are caught here.
        // You can also forward to a reporting service.
        console.error('[ErrorBoundary]', error, info);
      }}
    >
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="signup"
          options={{
            title: "",
            gestureEnabled: false,
            headerStyle: {
              backgroundColor: '#5E89B2',
            },
            headerLeft: () => (
              <Pressable
                onPress={async () => {
                  await signOut(auth);
                  await AsyncStorage.removeItem("@user");
                  router.back();
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  opacity: pressed ? 0.5 : 1,
                  padding: 10,
                })}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </Pressable>
            ),
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="testing"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="profileId"
          options={{
            headerTitleStyle: {
              color: colorScheme === 'light' ? "#1a1a1a" : "white",
            },
            headerStyle: {
              backgroundColor: colorScheme === 'light' ? "white" : "#1a1a1a",
            },
            headerTitle: "",
          }}
        />
      </Stack>
    </ErrorBoundary>
  );
}
