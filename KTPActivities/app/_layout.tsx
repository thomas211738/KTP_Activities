
import { Stack } from 'expo-router/stack';
import React from 'react';

export default function Layout() {
   
  return (
    <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="signup"
        />
        <Stack.Screen
          name="(tabs)"
        //   options={{ headerShown: false }}
        />
    </Stack>
   
  );
}
