import {
    GoogleSignin,
    GoogleSigninButton,
    statusCodes,
  } from '@react-native-google-signin/google-signin';
  import { setUserToken } from './userTokenManager';
  import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    signOut,
  } from "firebase/auth";
  import { auth } from "./../firebaseConfig";
  import AsyncStorage from "@react-native-async-storage/async-storage";
  import React from 'react';
  import { setUserInfo } from './userInfoManager';
  import { setAllUsersInfo } from './allUsersManager';
  import { router } from 'expo-router';
  import { ValidateUser } from './auth';
  import { WEB_CLIENT_ID } from "@env";
  import Toast from 'react-native-root-toast';
  
  export default function SignInScreen() {
    React.useEffect(() => {
      GoogleSignin.configure({
        scopes: ['https://www.googleapis.com/auth/drive.readonly'], // what API you want to access on behalf of the user, default is email and profile
        webClientId: WEB_CLIENT_ID, // client ID of type WEB for your server (needed to verify user ID and offline access)
      });
  
      const getLocalUser = async () => {
        try {
          const userJSON = await AsyncStorage.getItem("@user");
          const userData = userJSON ? JSON.parse(userJSON) : null;
          // Set userData to state or do something with it
        } catch (e) {
          console.log(e, "Error getting local user");
        }
      };
  
      getLocalUser();
  
      const unsub = onAuthStateChanged(auth, async (user) => {
        if (user) {
          await AsyncStorage.setItem("@user", JSON.stringify(user));
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
            await GoogleSignin.signOut();
            await signOut(auth);
            await AsyncStorage.removeItem("@user");
          }
        }
      });
  
      return () => unsub();
    }, []);
  
    const handleSignIn = async () => {
      try {
        await GoogleSignin.hasPlayServices();
        const hasPreviousSignIn = await GoogleSignin.hasPreviousSignIn();
        let userInfo;
        if (hasPreviousSignIn) {
          userInfo = await GoogleSignin.getCurrentUser();
          if (!userInfo) {
            userInfo = await GoogleSignin.signInSilently();
          }
        } else {
          userInfo = await GoogleSignin.signIn();
        }
        const credential = GoogleAuthProvider.credential(userInfo.idToken);
        await signInWithCredential(auth, credential);
      } catch (error) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          console.log("Canceled");
        } else if (error.code === statusCodes.IN_PROGRESS) {
          console.log("Operation is in progress already");
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          console.log("Play services not available or outdated");
        } else {
          console.log("Some other error occurred", error);
  
          // Retry sign-in if the token is stale
          if (error.code === 'auth/invalid-credential') {
            try {
              const userInfo = await GoogleSignin.signIn();
              const credential = GoogleAuthProvider.credential(userInfo.idToken);
              await signInWithCredential(auth, credential);
            } catch (retryError) {
              console.log("Retry sign-in failed", retryError);
            }
          }
        }
      }
    };
  
    return (
      <GoogleSigninButton
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={handleSignIn}
      />
    );
  }
  