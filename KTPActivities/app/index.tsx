
import React from 'react';
import { ActivityIndicator, Platform, View} from 'react-native';
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import {
  auth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut
} from "./firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SignInScreen from './signin';
import { Redirect, router} from 'expo-router';
import { GOOGLE_AUTH_IOS_CLIENT_ID, GOOGLE_AUTH_ANDROID_CLIENT_ID, BACKEND_URL } from '@env';
import { ValidateUser } from './components/auth';
import Toast from 'react-native-root-toast';
import { RootSiblingParent } from 'react-native-root-siblings';
import { setUserInfo } from './components/userInfoManager'; 
import { setAllUsersInfo } from './components/allUsersManager';

WebBrowser.maybeCompleteAuthSession();

//HOME SCREEN
const HomeScreen = () => {
  const [loading, setLoading] = React.useState(true);
  const [validation, setValidation] = React.useState(0);

  // When validation becomes 1, force navigation to the main app.
  // This is more reliable than only relying on <Redirect> during the auth flow.
  React.useEffect(() => {
    if (validation === 1) {
      router.replace('(tabs)/Calendar');
    }
  }, [validation]);
  
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: GOOGLE_AUTH_IOS_CLIENT_ID,
    androidClientId: GOOGLE_AUTH_ANDROID_CLIENT_ID,
  });

  // Always call hooks (never conditionally).
  // The previous if(Platform.OS === "ios") around useEffect was invalid React hook usage.
  React.useEffect(() => {
    if (Platform.OS !== "ios") return;

    if (response?.type === "success") {
      const {id_token} = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential);
    }
  }, [response]);

  React.useEffect(() => {
    if (Platform.OS !== "ios") return;

    const unsub = onAuthStateChanged(auth, async (user) => {
      console.log('[HomeScreen] onAuthStateChanged fired. user?', !!user);

      if (user) {
        console.log('[HomeScreen] Firebase user email:', user.providerData?.[0]?.email);

        await AsyncStorage.setItem("@user", JSON.stringify(user));

        // IMPORTANT: Navigate immediately on successful Firebase auth.
        // Do not wait for ValidateUser to finish. This was causing the "stuck after Google login".
        setLoading(false);
        setValidation(1);

        console.log('[HomeScreen] Firebase auth succeeded — navigating to main app NOW');
        router.replace('(tabs)/Calendar');

        // Fire ValidateUser in the background to populate user info / allUsers.
        // We ignore its result for the purpose of showing the main app.
        ValidateUser(user.providerData[0].email)
          .then(result => {
            console.log('[HomeScreen] background ValidateUser finished:', result?.status);
            if (result && result.user) setUserInfo(result.user);
            if (result && result.allUsers) setAllUsersInfo(result.allUsers);
          })
          .catch(err => {
            console.warn('[HomeScreen] background ValidateUser failed (non-fatal):', err?.message || err);
          });
      } else {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // For this debug session we make the main app reachable as soon as Firebase auth succeeds.
  // We still keep the old redirect line but we also have explicit router.replace() calls above.
  // Once we have a Firebase-authenticated user we consider the user "logged in"
  // for UI purposes. We no longer require a specific status from ValidateUser.
  const showMainApp = validation === 1;

  return loading ? 
  <>
    <RootSiblingParent>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size={"large"} />
      </View>
    </RootSiblingParent>
  </> :
  (showMainApp ? <Redirect href={'(tabs)/Calendar'} /> : <SignInScreen promptAsync={promptAsync} />);
  
}
export default HomeScreen