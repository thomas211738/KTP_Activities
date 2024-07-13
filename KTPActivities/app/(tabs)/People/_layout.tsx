
import { Stack } from 'expo-router/stack';
import React from 'react';

export default function Layout() {
   
  return (
    <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerTitle: "People",
            headerBlurEffect: "regular",
            headerTransparent: true,
            headerLargeTitle: true,
            headerLargeTitleShadowVisible: false,
            headerSearchBarOptions: {
                placeholder: "Search People",
            }
            
          }}
        />
    </Stack>
   
  );


}
