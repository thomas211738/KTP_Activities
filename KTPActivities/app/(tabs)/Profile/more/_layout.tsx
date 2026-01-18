import { Stack } from 'expo-router/stack';
import React from 'react';
import { Platform, useColorScheme } from 'react-native';

export default function FunctionsLayout() {
  const colorScheme = useColorScheme();
   
  return (
    <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerTitleStyle: {
              color: colorScheme === 'light' ? "#1a1a1a" : "white",
            },
  
            headerStyle: {
              backgroundColor: colorScheme === 'light' ? "white" : "#1a1a1a",
            },
            headerTitle: "More",
            headerBlurEffect: "regular",
            ...(Platform.OS === "ios" && { headerTransparent: true }),
            headerLargeTitle: true,
            headerLargeTitleShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            headerTitleStyle: {
              color: colorScheme === 'light' ? "#1a1a1a" : "white",
            },
  
            headerStyle: {
              backgroundColor: colorScheme === 'light' ? "white" : "#1a1a1a",
            },
            headerTitle: "Notifications",
            headerBlurEffect: "regular",
            ...(Platform.OS === "ios" && { headerTransparent: true }),
            headerLargeTitle: true,
            headerLargeTitleShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="pledgeToBrother"
          options={{
            headerTitleStyle: {
              color: colorScheme === 'light' ? "#1a1a1a" : "white",
            },
  
            headerStyle: {
              backgroundColor: colorScheme === 'light' ? "white" : "#1a1a1a",
            },
            headerTitle: "Pledge to Brother",
            headerBlurEffect: "regular",
            ...(Platform.OS === "ios" && { headerTransparent: true }),
            headerLargeTitle: true,
            headerLargeTitleShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="deleteRushees"
          options={{
            headerTitleStyle: {
              color: colorScheme === 'light' ? "#1a1a1a" : "white",
            },
  
            headerStyle: {
              backgroundColor: colorScheme === 'light' ? "white" : "#1a1a1a",
            },
            headerTitle: "Delete Rushees",
            headerBlurEffect: "regular",
            ...(Platform.OS === "ios" && { headerTransparent: true }),
            headerLargeTitle: true,
            headerLargeTitleShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="leaderboard"
          options={{
            headerTitleStyle: {
              color: colorScheme === 'light' ? "#1a1a1a" : "white",
            },
  
            headerStyle: {
              backgroundColor: colorScheme === 'light' ? "white" : "#1a1a1a",
            },
            headerTitle: "Clout Leaderboard",
            headerBlurEffect: "regular",
            ...(Platform.OS === "ios" && { headerTransparent: true }),
            headerLargeTitle: true,
            headerLargeTitleShadowVisible: false,
          }}
        />
    </Stack>
   
  );
}
