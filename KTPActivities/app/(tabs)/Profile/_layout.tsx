
import { Stack } from 'expo-router/stack';
import React from 'react';
import { Platform, useColorScheme } from 'react-native';

export default function Layout() {
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
            headerTitle: "Profile",
            headerBlurEffect: "regular",
            ...(Platform.OS === "ios" && { headerTransparent: true }),
            headerLargeTitle: true,
            headerLargeTitleShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="resources"
          options={{
            headerTitleStyle: {
              color: colorScheme === 'light' ? "#1a1a1a" : "white",
            },
  
            headerStyle: {
              backgroundColor: colorScheme === 'light' ? "white" : "#1a1a1a",
            },
            headerTitle: "Resources",
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
    </Stack>
   
  );


}
