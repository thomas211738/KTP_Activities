
import { Stack } from 'expo-router/stack';
import React from 'react';
import { Platform } from 'react-native';
import { useColorScheme } from 'react-native';

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
            headerTitle: "People",
            headerBlurEffect: "regular",
            ...(Platform.OS === "ios" && { headerTransparent: true }),
            headerLargeTitle: true,
            headerLargeTitleShadowVisible: false,
          }}
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
        <Stack.Screen
          name="indivisualNotification"
          options={{
            headerTitleStyle: {
              color: colorScheme === 'light' ? "#1a1a1a" : "white",
            },
  
            headerStyle: {
              backgroundColor: colorScheme === 'light' ? "white" : "#1a1a1a",
            },
            headerTitle: "Message",
          }}

        />
    </Stack>
   
  );


}
