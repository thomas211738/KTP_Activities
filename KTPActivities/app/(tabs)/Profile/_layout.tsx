
import { Stack } from 'expo-router/stack';
import React from 'react';
import { Platform } from 'react-native';

export default function Layout() {
   
  return (
    <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerTitle: "Profile",
            headerBlurEffect: "regular",
            ...(Platform.OS === "ios" && { headerTransparent: true }),
            headerLargeTitle: true,
            headerLargeTitleShadowVisible: false,
          }}
        />
    </Stack>
   
  );


}
