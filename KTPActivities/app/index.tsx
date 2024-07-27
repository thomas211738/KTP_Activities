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
import { router} from 'expo-router';
import { GOOGLE_AUTH_IOS_CLIENT_ID, GOOGLE_AUTH_ANDROID_CLIENT_ID, BACKEND_URL } from '@env';
import { ValidateUser } from './components/auth';
import Toast from 'react-native-root-toast';
import { RootSiblingParent } from 'react-native-root-siblings';
import { signOut } from "firebase/auth";
import { setUserInfo } from './components/userInfoManager'; 
import { setAllUsersInfo } from './components/allUsersManager';


WebBrowser.maybeCompleteAuthSession();

//HOME SCREEN
const HomeScreen = ({navigation}) => {

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
      // const userPositionJSON = await axios.get(`${BACKEND_URL}/users/email/${userData.email}`);
      // setPos(userPositionJSON.data[0].Position);
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
        // setPos(userPositionJSON.data[0].Position);
        

        const validation = await ValidateUser(user.providerData[0].email);

        if (validation.status === 1) {   
          setUserInfo(validation.user); 
          setAllUsersInfo(validation.allUsers);
          router.replace("/(tabs)/Calendar");
        } else if (validation.status === 0) {
          setAllUsersInfo(validation.allUsers);
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
          await signOut(auth);
          await AsyncStorage.removeItem("@user");

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