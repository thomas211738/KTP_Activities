import { Stack } from 'expo-router/stack';
import { Pressable } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getUserInfo } from '../../components/userInfoManager';

export default function Layout() {
  const userInfo = getUserInfo();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Calendar",
          headerBlurEffect: "regular",
          headerTransparent: true,
          headerLargeTitle: true,
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
              <Ionicons name="add" size={35} color="#134b91" />
            </Pressable>
          ) : undefined
        }}
      />
      <Stack.Screen
        name="createEvent"
        options={{
          headerTitle: "Create Event",

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
