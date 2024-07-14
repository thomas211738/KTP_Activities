
import { Stack } from 'expo-router/stack';
import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Layout() {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerTitle: "Alerts",
            headerBlurEffect: "regular",
            headerTransparent: true,
            headerLargeTitle: true,
            headerLargeTitleShadowVisible: false
          }}
        >
        </Stack.Screen>
      </Stack>
      
    </>
  );
}
