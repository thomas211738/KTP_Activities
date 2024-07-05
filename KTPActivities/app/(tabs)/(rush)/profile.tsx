import { View, StyleSheet, Button} from 'react-native';
import React from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "./../../firebaseConfig";
import { signOut } from "firebase/auth";
import { router } from 'expo-router';

export default function Tab() {
  return (
    <View style={styles.container}>
       <Button
        title="Sign Out"
        onPress={async () => {
          await signOut(auth);
          await AsyncStorage.removeItem("@user");
          router.replace("/");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
