import { View, Button, Text } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "./../firebaseConfig";
import { signOut } from "firebase/auth";
import { useRouter, useLocalSearchParams } from 'expo-router';




const index = () => {
    const mynavigation = useNavigation();
    const router = useRouter();
    const { position } = useLocalSearchParams<{ position: string }>();
    
  return (
    <View>
    <Button title="Rush" onPress={() => mynavigation.navigate('(rush)')} />
    <Button title="Pledge" onPress={() => mynavigation.navigate('(pledge)')} />
    <Button title="Brother" onPress={() => mynavigation.navigate('(brother)')} />
    <Button title="Eboard" onPress={() => mynavigation.navigate('(eboard)')} />
    <Button title="Super" onPress={() => mynavigation.navigate('(super)')} />
    <Button
        title="Sign Out"
        onPress={async () => {
          await signOut(auth);
          await AsyncStorage.removeItem("@user");
          router.replace("/");
        }}
      />
      <Text>Current position is {position}</Text>
    </View>
    
  )
}

export default index