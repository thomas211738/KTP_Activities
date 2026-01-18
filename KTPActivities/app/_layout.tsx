
import { Stack } from 'expo-router/stack';
import React from 'react';
import { router } from 'expo-router';
import { Pressable} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

export default function Layout() {
  const colorScheme =  useColorScheme();
  
   
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
         <Stack.Screen
          name="testing"
          options={{ headerShown: false }}
        />
        <Stack.Screen
            name="profileId"
            options={{
              headerTitleStyle: {
                color: colorScheme === 'light' ? "#1a1a1a" : "white",
              },
    
              headerStyle: {
                backgroundColor: colorScheme === 'light' ? "white" : "#1a1a1a",
              },
              headerTitle: "",
            }}
  
          />

    </Stack>
    
   
  );


}
