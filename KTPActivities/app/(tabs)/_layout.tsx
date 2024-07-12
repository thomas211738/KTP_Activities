import {FontAwesome} from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Entypo } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'royalblue' }}>
      <Tabs.Screen
        name="Calendar"
        options={{
          headerShown: false,
          title: 'Calender',
          tabBarIcon: ({ color }) => <Entypo name="calendar" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="People/index"
        options={{
          title: 'People',
          tabBarIcon: ({ color }) => <FontAwesome name="group" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Alerts/index"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <Ionicons name="notifications" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />

    </Tabs>
  );
}
