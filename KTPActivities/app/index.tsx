
import React from 'react';
import { ActivityIndicator, View} from 'react-native';
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
} from "firebase/auth";
import { auth } from "./firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SignInScreen from './signin';
import { Redirect, router} from 'expo-router';
import { GOOGLE_AUTH_IOS_CLIENT_ID, GOOGLE_AUTH_ANDROID_CLIENT_ID } from '@env';
import { ValidateUser } from './auth';
import Toast from 'react-native-root-toast';
import { RootSiblingParent } from 'react-native-root-siblings';


WebBrowser.maybeCompleteAuthSession();

//HOME SCREEN
const HomeScreen = ({navigation}) => {

  const [userInfo, setUserInfo] = React.useState();
  const [loading, setLoading] = React.useState(false);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: GOOGLE_AUTH_IOS_CLIENT_ID,
    androidClientId: GOOGLE_AUTH_ANDROID_CLIENT_ID,
  });


  const getLocalUser = async () => {
    try {
      setLoading(true);
      const userJSON = await AsyncStorage.getItem("@user");
      const userData = userJSON ? JSON.parse(userJSON) : null;
      setUserInfo(userData);

    } catch (e) {
      console.log(e, "Error getting local user");
    } finally {
      setLoading(false);
    }2
  };

  React.useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential);


    }
  }, [response]);

  React.useEffect(() => {
    getLocalUser();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await AsyncStorage.setItem("@user", JSON.stringify(user));
        

        const validation = await ValidateUser(user.providerData[0].email);

        if (validation.status === 1) {          
          router.replace("/(tabs)/(rush)/calender");
        } else if (validation.status === 0) {
          router.push({
            pathname: 'signup',
            params: { email: user.providerData[0].email },
          });
        } else if (validation.status === -1) {
          Toast.show('Error: Please use a BU email', {
            duration: Toast.durations.SHORT,
            position: Toast.positions.CENTER,
            shadow: true,
            animation: true,
            hideOnPress: true,
            delay: 0,
            backgroundColor: 'red',
            textColor: 'white',
            opacity: 1,
          });
        }
      } else {
      }
    });
    return () => unsub();
  }, []);



  if (loading)
    return (
      <RootSiblingParent>
      
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size={"large"} />
      </View>
      </RootSiblingParent>
    );

  return <SignInScreen promptAsync={promptAsync} />;
  
}
export default HomeScreen