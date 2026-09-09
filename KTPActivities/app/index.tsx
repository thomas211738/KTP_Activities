import React from 'react';
import { ActivityIndicator, Platform, Text, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { auth, GoogleAuthProvider, onAuthStateChanged, signInWithCredential } from './firebaseConfig';
import { router } from 'expo-router';
import { GOOGLE_AUTH_IOS_CLIENT_ID, GOOGLE_AUTH_ANDROID_CLIENT_ID } from '@env';
import SignInScreen from './signin';
import { clearAccountState, loadAccount, refreshPeople, signOutAccount } from './components/auth';
import { setUserInfo } from './components/userInfoManager';

WebBrowser.maybeCompleteAuthSession();

export default function HomeScreen() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [retry, setRetry] = React.useState(0);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    selectAccount: true,
    iosClientId: GOOGLE_AUTH_IOS_CLIENT_ID,
    androidClientId: GOOGLE_AUTH_ANDROID_CLIENT_ID,
  });

  // One account/navigation coordinator for both platforms, including restored sessions.
  React.useEffect(() => {
    let disposed = false;
    let attempt = 0;
    const unsubscribe = onAuthStateChanged(auth, async user => {
      const currentAttempt = ++attempt;
      clearAccountState();
      setError('');
      if (!user) { setLoading(false); return; }
      setLoading(true);
      try {
        const result = await loadAccount(user);
        if (disposed || currentAttempt !== attempt || auth.currentUser !== user) return;
        setUserInfo(result.user);
        void refreshPeople(user);
        router.replace('/(tabs)/Calendar');
      } catch (err: any) {
        if (!disposed && currentAttempt === attempt) {
          setError(err?.response?.data?.message || err?.message || 'Unable to sign in. Please try again.');
        }
      } finally {
        if (!disposed && currentAttempt === attempt) setLoading(false);
      }
    });
    return () => { disposed = true; attempt++; unsubscribe(); };
  }, [retry]);

  React.useEffect(() => {
    if (Platform.OS !== 'ios') return;
    if (response?.type === 'success') {
      const token = response.params.id_token;
      if (!token) { setError('Google did not return a sign-in token. Please try again.'); return; }
      setLoading(true);
      signInWithCredential(auth, GoogleAuthProvider.credential(token)).catch(() => {
        setError('Google sign-in could not be completed. Please try again.');
        setLoading(false);
      });
    } else if (response?.type === 'error') {
      setError('Google sign-in could not be completed. Please try again.');
    }
  }, [response]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', gap: 16 }}>
    <ActivityIndicator size="large" color="#134b91" />
    <Text style={{ color: '#333' }}>Getting your account ready…</Text>
  </View>;

  if (error) return <View style={{ flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#fff', gap: 20 }}>
    <Text accessibilityRole="alert" style={{ color: '#222', fontSize: 17, textAlign: 'center' }}>{error}</Text>
    <TouchableOpacity onPress={() => { setError(''); setRetry(value => value + 1); }} style={{ padding: 16, backgroundColor: '#134b91', borderRadius: 12 }}>
      <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>Try Again</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={async () => {
      try { await signOutAccount(); setError(''); setRetry(value => value + 1); }
      catch { setError('Unable to sign out. Please try again.'); }
    }} style={{ padding: 16 }}><Text style={{ color: '#134b91', textAlign: 'center' }}>Use Another Account</Text></TouchableOpacity>
  </View>;

  return <SignInScreen promptAsync={async () => {
    if (!request) { setError('Google sign-in is still loading. Please try again.'); return; }
    try { await promptAsync(); }
    catch { setError('Unable to open Google sign-in. Please try again.'); }
  }} />;
}
