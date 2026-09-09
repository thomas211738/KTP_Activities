import React from 'react';
import { Alert } from 'react-native';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { auth, GoogleAuthProvider, signInWithCredential } from '../firebaseConfig';
import { WEB_CLIENT_ID } from '@env';

export default function AndroidAuth() {
  const [busy, setBusy] = React.useState(false);
  const inFlight = React.useRef(false);
  React.useEffect(() => { GoogleSignin.configure({ webClientId: WEB_CLIENT_ID }); }, []);
  const signIn = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      await GoogleSignin.hasPlayServices();
      const user = await GoogleSignin.signIn();
      if (!user.idToken) throw new Error('Google did not return a sign-in token.');
      await signInWithCredential(auth, GoogleAuthProvider.credential(user.idToken));
      // The shared HomeScreen listener loads the profile and navigates.
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED && error.code !== statusCodes.IN_PROGRESS) {
        Alert.alert('Unable to sign in', 'Please try Google sign-in again.');
      }
    } finally { inFlight.current = false; setBusy(false); }
  };
  return <GoogleSigninButton size={GoogleSigninButton.Size.Wide} color={GoogleSigninButton.Color.Dark} disabled={busy} onPress={signIn} />;
}
  
