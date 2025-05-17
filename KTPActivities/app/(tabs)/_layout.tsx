import {FontAwesome} from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Entypo } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import {NavigationContainer} from '@react-navigation/native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <NavigationContainer>
      <Tabs screenOptions={{ tabBarActiveTintColor: colorScheme === 'light' ? 'royalblue' : '#86ebba' }}>
      <Tabs.Screen
        name="Calendar"
        options={{
          tabBarStyle:{
            backgroundColor: colorScheme === 'light' ? 'white' : '#1a1a1a',
          },
          headerShown: false,
          title: 'Calendar',
          tabBarIcon: ({ color }) => <Entypo name="calendar" size={24} color={color} />,
          
        }}
      />
      <Tabs.Screen
        name="People"
        
        options={{
          tabBarStyle:{
            backgroundColor: colorScheme === 'light' ? 'white' : '#1a1a1a',
          },
          headerShown: false,
          title: 'People',
          tabBarIcon: ({ color }) => <FontAwesome name="group" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Alerts"
        options={{
          tabBarStyle:{
            backgroundColor: colorScheme === 'light' ? 'white' : '#1a1a1a',
          },
          title: 'Alerts',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="notifications" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          tabBarStyle:{
            backgroundColor: colorScheme === 'light' ? 'white' : '#1a1a1a',
          },
          headerShown: false,
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />

    </Tabs>

    </NavigationContainer>
    
  );
}
