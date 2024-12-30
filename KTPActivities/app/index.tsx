
import React from 'react';
import { ActivityIndicator, Platform, View} from 'react-native';
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut
} from "firebase/auth";
import { auth } from "./firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SignInScreen from './signin';
import { Redirect, router} from 'expo-router';
import { GOOGLE_AUTH_IOS_CLIENT_ID, GOOGLE_AUTH_ANDROID_CLIENT_ID, BACKEND_URL } from '@env';
import { ValidateUser } from './components/auth';
import Toast from 'react-native-root-toast';
import { RootSiblingParent } from 'react-native-root-siblings';
import { setUserInfo } from './components/userInfoManager'; 
import { setAllUsersInfo } from './components/allUsersManager';
import NotificationManager from './components/notificationsManager';

WebBrowser.maybeCompleteAuthSession();

//HOME SCREEN
const HomeScreen = ({navigation}) => {
  const [loading, setLoading] = React.useState(true);
  const [validation, setValidation] = React.useState(0);
  
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: GOOGLE_AUTH_IOS_CLIENT_ID,
    androidClientId: GOOGLE_AUTH_ANDROID_CLIENT_ID,
  });

  if (Platform.OS === "ios"){
    
  
    React.useEffect(() => {
  
      if (response?.type === "success") {
        const {id_token} = response.params;
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential);
      }
  
    }, [response]);
  
    React.useEffect(() => {
      const unsub = onAuthStateChanged(auth, async (user) => {
        if (user) {
          await AsyncStorage.setItem("@user", JSON.stringify(user));
  
          const validation = await ValidateUser(user.providerData[0].email);
          setLoading(false);
  
          if (validation.status === 1) {   
            setUserInfo(validation.user); 
            setAllUsersInfo(validation.allUsers);
            setValidation(1);
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
          setLoading(false);
        }
      });
      return () => unsub();
    }, []);
  

  }

  return loading ? 
  <>
    <RootSiblingParent>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size={"large"} />
      </View>
    </RootSiblingParent>
  </> :
  // <NotificationManager/>;
  validation === 1 ? <Redirect href={'(tabs)/Calendar'} /> : <SignInScreen promptAsync={promptAsync} />;
  
}
export default HomeScreen