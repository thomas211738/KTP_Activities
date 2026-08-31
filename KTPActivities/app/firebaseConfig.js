// Firebase initialization.
//
// This file respects the same APP_ENV / build mode logic as app.config.ts.
// The authoritative value comes from the build-time config (baked into extra.isProduction).
//
// Behavior:
// - Production (EAS production, preview, APP_ENV=production, Release builds):
//     Must have real Firebase keys + real public BACKEND_URL.
//     Real initializeApp.
// - Development (normal `npx expo run:ios`, development profile):
//     Can run with missing/invalid keys using safe no-op stubs.
//     Allows localhost BACKEND_URL.

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
  BACKEND_URL,
} from '@env';

// === Determine production vs development mode ===
// This mirrors the logic in app.config.ts so that runtime behavior matches build-time config.
//
// Supported ways (local + EAS):
//   - Normal local debug:          npx expo run:ios                     → development
//   - Local Release test:          npx expo run:ios --configuration Release  → production
//   - Explicit:                    APP_ENV=production npx expo run:ios
//   - EAS profiles:                development / preview / production
//
// You can also set APP_ENV as an Environment Variable in the Expo dashboard.
const extra = Constants?.expoConfig?.extra || {};

const explicit = (process.env.APP_ENV || '').toLowerCase().trim();
const easProfile = (process.env.EAS_BUILD_PROFILE || '').toLowerCase();
const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
const configuration = (process.env.CONFIGURATION || '').toLowerCase();

let isProductionBuild = false;

if (extra.isProduction === true) {
  isProductionBuild = true;
} else if (explicit === 'production' || explicit === 'prod' || explicit === 'release') {
  isProductionBuild = true;
} else if (explicit === 'development' || explicit === 'dev') {
  isProductionBuild = false;
} else if (easProfile === 'production' || easProfile === 'preview') {
  isProductionBuild = true;
} else if (nodeEnv === 'production') {
  isProductionBuild = true;
} else if (configuration === 'release') {
  isProductionBuild = true;
} else if (!__DEV__) {
  // Last resort: treat non-dev JS runtime as production-like (matches remote behavior)
  isProductionBuild = true;
}

const hasValidFirebaseKey =
  FIREBASE_API_KEY &&
  FIREBASE_API_KEY !== 'undefined' &&
  FIREBASE_API_KEY.length > 10;

function assertProdBackendUrl() {
  const url = (BACKEND_URL || '').trim();
  if (!url) {
    throw new Error(
      '[PRODUCTION] BACKEND_URL is not set.\n' +
      'For production builds, the environment used by the EAS production profile (usually the .env ' +
      'present at build time, or EAS environment variables) must contain the real public backend URL, ' +
      'just like production builds in the remote repo.\n\n' +
      'Remote repo production deployment:\n' +
      '  Backend is deployed as Firebase Function "api".\n' +
      '  Anticipated BACKEND_URL = https://us-central1-kappa-theta.cloudfunctions.net/api\n' +
      '  Client calls become /api/users, /api/events, /api/alerts, /api/photo2, etc.'
    );
  }
  const isLocal =
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.startsWith('http://10.') ||
    url.startsWith('http://192.168.');
  if (isLocal) {
    throw new Error(
      `[PRODUCTION] BACKEND_URL is pointing at a local address ("${url}").\n` +
      'Production builds must use a publicly reachable backend URL. ' +
      'This matches the requirement for production builds in the remote repo.'
    );
  }
}

// Client-side Firebase services.
// db is used for reading calendarTokens/main (used by legacy client-side Google Calendar fetch).
let auth;
let GoogleAuthProvider;
let onAuthStateChanged;
let signInWithCredential;
let signOut;
let db = null; // Always declared so imports never break

if (hasValidFirebaseKey) {
  // Real Firebase (used for both dev-with-keys and production)
  const { initializeApp, getApps } = require('firebase/app');
  const {
    initializeAuth,
    getReactNativePersistence,
    GoogleAuthProvider: RealGoogleAuthProvider,
    onAuthStateChanged: realOnAuthStateChanged,
    signInWithCredential: realSignInWithCredential,
    signOut: realSignOut,
  } = require('firebase/auth');

  const firebaseConfig = {
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
    appId: FIREBASE_APP_ID,
    measurementId: FIREBASE_MEASUREMENT_ID,
  };

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });

  // Initialize client Firestore so legacy calendar code can read calendarTokens/main config.
  const { getFirestore } = require('firebase/firestore');
  db = getFirestore(app);

  GoogleAuthProvider = RealGoogleAuthProvider;
  onAuthStateChanged = realOnAuthStateChanged;
  signInWithCredential = realSignInWithCredential;
  signOut = realSignOut;
} else if (isProductionBuild) {
  // Production build without valid Firebase keys.
  // Remote repo production builds expected real credentials to be present
  // in the build environment (the .env checked out for the build, or EAS env vars).
  // We fail fast instead of letting initializeApp blow up later.
  throw new Error(
    '[PRODUCTION] Firebase configuration is missing or invalid.\n' +
    'Production builds in this repo (to match remote repo behavior) require the build environment ' +
    'to provide real Firebase web config (via the .env present at build time or EAS environment variables for the production profile).'
  );
} else if (__DEV__) {
  // Development / simulator builds without real keys → safe no-ops.
  console.warn('[DEV] Firebase not initialized (missing/invalid FIREBASE_API_KEY). Using no-op auth stubs for local development.');

  auth = {
    currentUser: null,
  };

  GoogleAuthProvider = {
    credential: (idToken) => ({ idToken }),
  };

  onAuthStateChanged = (_auth, listener) => {
    Promise.resolve().then(() => {
      try { listener && listener(null); } catch (_) {}
    });
    return () => {};
  };

  signInWithCredential = async (_auth, _credential) => {
    console.log('[DEV] signInWithCredential skipped (no Firebase key)');
    return null;
  };

  signOut = async (_auth) => {
    console.log('[DEV] signOut skipped (no Firebase key)');
    return null;
  };

  // No real db in this stub path. Calendar direct-fetch will fall back to env/default.
  db = null;
} else {
  // Non-dev build without keys and without being explicitly marked production.
  // Treat it as a production-like build and fail.
  throw new Error('Firebase configuration is missing. This is not allowed outside development builds.');
}

// Extra production-time safety checks.
// These run at module load (early in app startup).
if (isProductionBuild) {
  assertProdBackendUrl();

  if (!hasValidFirebaseKey) {
    // Should have been caught above, but double-check.
    throw new Error('[PRODUCTION] Real Firebase keys are required for production builds.');
  }
}

export { auth, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signOut, db };
