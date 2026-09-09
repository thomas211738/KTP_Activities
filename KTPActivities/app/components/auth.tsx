import axios from "axios"
import { BACKEND_URL } from "@env"
import Constants from 'expo-constants';
import { auth, signOut } from '../firebaseConfig';
import { setUserInfo } from './userInfoManager';
import { setAllUsersInfo } from './allUsersManager';
import { setUserToken } from './userTokenManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

const extra = Constants?.expoConfig?.extra || {};
const isProduction = extra.isProduction === true || process.env.APP_ENV === 'production' || !__DEV__;

function assertSafeBackendUrlForProduction() {
  const url = (BACKEND_URL || '').trim();
  if (isProduction) {
    if (!url) {
      throw new Error(
        '[PRODUCTION] BACKEND_URL is not configured.\n' +
        'Production builds in this repo (matching the remote repo behavior) expect the build environment ' +
        'to provide a real public backend URL via the .env (or EAS environment variables) used by the production profile.\n\n' +
        'Remote repo production deployment:\n' +
        '  firebase deploy --only functions:api\n' +
        '  → BACKEND_URL should be https://us-central1-kappa-theta.cloudfunctions.net/api'
      );
    }
    const looksLocal =
      url.includes('localhost') ||
      url.includes('127.0.0.1') ||
      url.startsWith('http://10.') ||
      url.startsWith('http://192.168.');
    if (looksLocal) {
      throw new Error(
        `[PRODUCTION] BACKEND_URL is still set to a local/development address ("${url}").\n` +
        'Production builds must use a publicly reachable backend URL. ' +
        'This is the same requirement as production builds in the remote repo.'
      );
    }
    // For the remote repo's production deployment, the Express app is exported
    // as the Firebase Function named "api". The correct production BACKEND_URL
    // must therefore end with /api so that calls like ${BACKEND_URL}/users resolve
    // to https://.../api/users etc.
    if (url.includes('cloudfunctions.net') && !/\/api(\/|$)/.test(url)) {
      throw new Error(
        `[PRODUCTION] BACKEND_URL is set to a Firebase Functions host but is missing the required "/api" suffix.\n` +
        `Got: "${url}"\n` +
        `Remote repo production deploys the backend with: firebase deploy --only functions:api\n` +
        `Correct value: https://us-central1-kappa-theta.cloudfunctions.net/api\n` +
        `Without /api, paths like /users, /events, /alerts, /photo2 will 404.`
      );
    }
  }
}

// Run the production safety check as soon as this module is loaded.
// This ensures we fail fast on app start if someone ships a production build with dev config.
assertSafeBackendUrlForProduction();

export function clearAccountState() {
  setUserInfo(null);
  setAllUsersInfo([]);
  setUserToken(null);
}

export async function signOutAccount() {
  await signOut(auth);
  clearAccountState();
  await AsyncStorage.removeItem('@user').catch(() => undefined);
  if (Platform.OS === 'android') await GoogleSignin.signOut().catch(() => undefined);
}

export async function accountHeaders() {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error('Please sign in again.');
  return { Authorization: `Bearer ${token}` };
}

// Never determine account existence from the filtered People directory.
export async function loadAccount(firebaseUser) {
  const token = await firebaseUser.getIdToken();
  const response = await axios.post(`${BACKEND_URL}/account/session`, {}, {
    timeout: 15000, headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.data?.user?.id) throw new Error('Your account could not be loaded. Please try again.');
  return response.data;
}

export async function refreshPeople(firebaseUser) {
  try {
    const response = await axios.get(`${BACKEND_URL}/users`, { timeout: 15000 });
    if (auth.currentUser === firebaseUser) setAllUsersInfo(response.data?.data || []);
  } catch {
    console.warn('[account] People could not be refreshed.');
  }
}
