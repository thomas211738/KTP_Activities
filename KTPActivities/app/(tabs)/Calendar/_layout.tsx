import { Stack } from 'expo-router/stack';
import { Pressable, Platform, useColorScheme } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getUserInfo } from '../../components/userInfoManager';

export default function Layout() {
  const userInfo = getUserInfo();
  const colorScheme = useColorScheme();

  

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTitleStyle: {
            color: colorScheme === "dark" ? "#1a1a1a" : "white",
          },

          headerStyle: {
            backgroundColor: colorScheme === "dark" ? "white" : "#1a1a1a",
          },
          headerTitle: "Calendar",
          headerBlurEffect: "regular",
          headerLargeTitle: true,
          ...(Platform.OS === "ios" && colorScheme === 'dark' && { headerTransparent: true }),
          headerLargeTitleShadowVisible: false,
          headerRight: userInfo.Position === 3 || userInfo.Position === 5 ? () => (
            <Pressable
              onPress={async () => {
                router.push("(tabs)/Calendar/createEvent");
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Ionicons name="add" size={35} color={colorScheme==='dark' ?"#134b91" : "#86ebba"} />
            </Pressable>
          ) : undefined
        }}
      />
      <Stack.Screen
        name="createEvent"
        options={{
          headerTitle: "Create Event",
          headerTitleStyle: {
            color: colorScheme === "dark" ? "#1a1a1a" : "white",
          },

          headerStyle: {
            backgroundColor: colorScheme === "dark" ? "white" : "#1a1a1a",
          },

        }}
      />
      <Stack.Screen
        name="editEvent"
        options={{
          headerTitle: "Edit Event",

        }}
      />
    </Stack>
  );
}
