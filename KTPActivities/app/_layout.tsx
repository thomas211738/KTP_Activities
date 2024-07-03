
import { Stack } from 'expo-router/stack';
import React from 'react';
import { router } from 'expo-router';
import { Button,View, TouchableOpacity, Pressable, Text} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { Ionicons } from '@expo/vector-icons';

export default function Layout() {
   
  return (
    <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="signup"
          
          options={{ 
            title: "",
            gestureEnabled: false,
            headerStyle: {
              backgroundColor: '#5E89B2', // Set the background color of the header
            },
            headerLeft: () => (
              <Pressable
                onPress={async () => {
                  await signOut(auth);
                  await AsyncStorage.removeItem("@user");
                  router.back();
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  opacity: pressed ? 0.5 : 1,
                  padding: 10,
                })}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </Pressable>
            ),
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
    </Stack>
   
  );


}
