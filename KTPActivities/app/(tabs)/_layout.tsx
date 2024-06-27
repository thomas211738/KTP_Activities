
import React from 'react'
import { Stack } from 'expo-router/stack';


const _layout = () => {
  return (
    <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(rush)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(pledge)"
        //   options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(brother)"
        //   options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(eboard)"
        //   options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(super)"
        //   options={{ headerShown: false }}
        />
    </Stack>
   
  )
}

export default _layout