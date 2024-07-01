import axios from 'axios';
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
import _layout from './(tabs)/_layout';
import { Stack } from 'expo-router/stack';
import { Redirect } from 'expo-router';
import { GOOGLE_AUTH_IOS_CLIENT_ID, GOOGLE_AUTH_ANDROID_CLIENT_ID, BACKEND_URL } from '@env';


WebBrowser.maybeCompleteAuthSession();

//HOME SCREEN
const HomeScreen = ({navigation}) => {

  const [userInfo, setUserInfo] = React.useState();
  const [loading, setLoading] = React.useState(false);
  const [pos, setPos] = React.useState(0);
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
      const userPositionJSON = await axios.get(`${BACKEND_URL}/users/email/${userData.email}`);
      setPos(userPositionJSON.data[0].Position);
    } catch (e) {
      console.log(e, "Error getting local user");
    } finally {
      setLoading(false);
    }
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
        const userPositionJSON = await axios.get(`${BACKEND_URL}/users/email/${user.email}`);
        setPos(userPositionJSON.data[0].Position);
        console.log(JSON.stringify(user, null, 2));
        setUserInfo(user);
      } else {
        console.log("user not authenticated");
      }
    });
    return () => unsub();
  }, []);


  if (loading)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size={"large"} />
      </View>
    );

  return userInfo ? <Redirect href={`/(tabs)?position=${pos}`} /> : <SignInScreen promptAsync={promptAsync} />;
  
}
export default HomeScreen