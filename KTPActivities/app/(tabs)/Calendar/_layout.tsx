
import { Stack } from 'expo-router/stack';
import React from 'react';
import { router } from 'expo-router';
import { Pressable} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { Ionicons } from '@expo/vector-icons';

export default function Layout() {
   
  return (
    <Stack>
        <Stack.Screen
          name="index"
        />
        <Stack.Screen
          name="createEvent"
        />
        <Stack.Screen
          name="editEvent"
        />
    </Stack>
   
  );


}
