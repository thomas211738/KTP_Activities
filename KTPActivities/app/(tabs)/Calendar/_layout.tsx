import { Stack } from 'expo-router/stack';
import { Pressable, Platform, useColorScheme, Appearance } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getUserInfo } from '../../components/userInfoManager';

export default function Layout() {
  const userInfo = getUserInfo();

  const colorScheme =  useColorScheme();

  console.log(colorScheme);

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTitleStyle: {
            color: colorScheme === 'light' ? "black" : "white",
          },

          headerStyle: {
            backgroundColor: colorScheme === 'light' ? "white" : "#1a1a1a",
          },
          headerTitle: "Calendar",
          headerBlurEffect: "regular",
          headerLargeTitle: true,
          ...(Platform.OS === "ios" && colorScheme === 'light' && { headerTransparent: true }),
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
              <Ionicons name="add" size={35} color={colorScheme === 'light' ? "#134b91" : "#86ebba"} />
            </Pressable>
          ) : undefined
        }}
      />
      <Stack.Screen
        name="createEvent"
        options={{
          headerTitle: "Create Event",
          headerTitleStyle: {
            color: colorScheme === 'light' ? "#1a1a1a" : "white",
          },

          headerStyle: {
            backgroundColor: colorScheme === 'light' ? "white" : "#1a1a1a",
          },

        }}
      />
      <Stack.Screen
        name="editEvent"
        options={{
          headerTitle: "Edit Event",
          headerTitleStyle: {
            color: colorScheme === 'light' ? "#1a1a1a" : "white",
          },

          headerStyle: {
            backgroundColor: colorScheme === 'light' ? "white" : "#1a1a1a",
          },
        }}
      />
    </Stack>
  );
}
