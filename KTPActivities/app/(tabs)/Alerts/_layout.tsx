
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
            headerLargeTitleShadowVisible: false,
            headerRight: () => (
              <Pressable
                onPress={async () => {
                    // Show modal
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  opacity: pressed ? 0.5 : 1,
                })}
              >
                <Ionicons name="add" size={35} color="#134b91" />
              </Pressable>
            ),
          }}
        >
        </Stack.Screen>
      </Stack>
      
    </>
  );
}
