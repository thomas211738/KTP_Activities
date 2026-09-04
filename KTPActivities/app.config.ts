import fs from 'fs';
import path from 'path';

/**
 * Resolve APP_ENV for the current build.
 *
 * Central logic for dev vs production mode.
 * Works for:
 *   - Plain local debug builds
 *   - Local Release builds for testing production credentials (without EAS upload)
 *   - EAS builds via profiles + dashboard env vars
 *
 * How to force modes locally (no EAS upload needed):
 *
 *   Development (default, safe for simulator + stubs + localhost):
 *     npx expo run:ios
 *
 *   Production-like (strict guards + real prod values from .env.production or dashboard):
 *     npx expo run:ios --configuration Release
 *     APP_ENV=production npx expo run:ios --configuration Release
 *
 *   Force development explicitly:
 *     APP_ENV=development npx expo run:ios
 *
 * Note on the "expo command check" (as requested):
 *
 *   There is no `--development` flag on `expo run:ios`.
 *
 *   The way you control dev vs production from the command line is:
 *
 *     npx expo run:ios
 *       → Debug configuration → APP_ENV = "development"   (default local flow)
 *
 *     npx expo run:ios --configuration Release
 *       → Release configuration → APP_ENV = "production"
 *         (uses production values + strict guards, runnable locally)
 *
 *   You can also force it explicitly on top of the command:
 *     APP_ENV=production   npx expo run:ios --configuration Release
 *     APP_ENV=development  npx expo run:ios
 *
 *   This CONFIGURATION (plus explicit APP_ENV / EAS profile) is what drives
 *   the value of APP_ENV used everywhere in the codebase.
 *
 * For real App Store builds:
 *     eas build --profile production
 *     (APP_ENV=production is forced by eas.json)
 */
function resolveAppEnv(): 'development' | 'production' {
  // === The central "expo command check" + conditional for APP_ENV ===
  //
  // Priority (highest first):
  // 1. Explicit APP_ENV (you or dashboard)
  // 2. EAS_BUILD_PROFILE (from eas.json or dashboard)
  // 3. Native build configuration (the main signal from `expo run:ios`)
  // 4. Other build signals
  // 5. Default = development

  const explicit = (process.env.APP_ENV || '').toLowerCase().trim();
  if (explicit === 'production' || explicit === 'prod' || explicit === 'release') return 'production';
  if (explicit === 'development' || explicit === 'dev') return 'development';

  const easProfile = (process.env.EAS_BUILD_PROFILE || '').toLowerCase();
  if (easProfile === 'production' || easProfile === 'preview') return 'production';
  if (easProfile === 'development' || easProfile.includes('dev')) return 'development';

  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  if (nodeEnv === 'production') return 'production';

  // === The "expo command check" conditional (as requested) ===
  //
  // The value of APP_ENV used throughout the app is decided here.
  //
  // Primary local signal:
  //   npx expo run:ios
  //     → CONFIGURATION=Debug (or empty) → APP_ENV = "development"
  //
  // Production-like local test (recommended when you have no EAS uploads):
  //   npx expo run:ios --configuration Release
  //     → CONFIGURATION=Release → APP_ENV = "production"
  //       (strict production guards + values from .env.production or dashboard)
  //
  // You can always override explicitly:
  //   APP_ENV=production   npx expo run:ios --configuration Release
  //   APP_ENV=development  npx expo run:ios
  const configuration = (process.env.CONFIGURATION || '').toLowerCase();
  if (configuration === 'release') return 'production';
  if (configuration === 'debug') return 'development';

  // Final fallback for normal local development
  return 'development';
}

const appEnv = resolveAppEnv();
const isProduction = appEnv === 'production';

// Helpful log so you can see what mode was chosen during `expo prebuild` or builds
console.log(`[app.config] Resolved APP_ENV="${appEnv}" (isProduction=${isProduction}) via APP_ENV="${process.env.APP_ENV || ''}", CONFIGURATION="${process.env.CONFIGURATION || ''}", EAS_PROFILE="${process.env.EAS_BUILD_PROFILE || ''}"`);

/**
 * Choose which .env file to load (for build-time replacement via react-native-dotenv).
 * Shell environment variables (set via export or EAS dashboard) take precedence
 * over values in the file (dotenv does not overwrite existing process.env by default).
 */
function selectEnvFile(): string {
  if (isProduction) {
    if (fs.existsSync(path.resolve(__dirname, '.env.production'))) return '.env.production';
    if (fs.existsSync(path.resolve(__dirname, '.env'))) return '.env';
    return '.env';
  }

  // Development / local debug builds
  if (fs.existsSync(path.resolve(__dirname, '.env.development'))) return '.env.development';
  if (fs.existsSync(path.resolve(__dirname, '.env'))) return '.env';
  return '.env';
}

const selectedEnv = selectEnvFile();
// Load the chosen file into process.env for this config evaluation (build time only)
require('dotenv').config({ path: path.resolve(__dirname, selectedEnv) });

// This file is the single source of truth for build-time configuration.
// Production builds are intended to match remote repo expectations:
// real production values come from the build environment (.env* at build time or EAS env vars).

// Note: We intentionally do NOT force .env.production here.
// For production builds we want to match the remote repo:
// the plain .env (or whatever the build environment provides) is expected
// to contain the real production values when APP_ENV=production / EAS production runs.

function getBackendUrl(): string {
  const raw = process.env.BACKEND_URL || '';
  const cleaned = raw.trim();

  // We only want to enforce "must be public URL" for *actual* production builds.
  // Normal local `npx expo run:ios` must always be allowed to use localhost from .env.development / .env.
  //
  // A "real production build context" is:
  // - EAS production or preview profile, OR
  // - Explicit APP_ENV=production together with a Release configuration (local prod test)
  const configuration = (process.env.CONFIGURATION || '').toLowerCase();
  const explicit = (process.env.APP_ENV || '').toLowerCase().trim();
  const easProfile = (process.env.EAS_BUILD_PROFILE || '').toLowerCase();

  const isRealProdContext =
    easProfile === 'production' ||
    easProfile === 'preview' ||
    (explicit === 'production' && configuration === 'release');

  if (isRealProdContext) {
    if (!cleaned || cleaned.includes('localhost') || cleaned.includes('127.0.0.1') || cleaned.includes('10.0.0.') || cleaned.includes('192.168.')) {
      throw new Error(
        `[PROD CONFIG] BACKEND_URL must be a publicly reachable URL. Got: "${cleaned}".\n` +
        `For real production (EAS production/preview or APP_ENV=production + --configuration Release), ` +
        `provide a real public URL via the Expo dashboard Environment Variables or your active .env file.\n` +
        `Remote repo production deployment uses the Firebase Function "api":\n` +
        `  https://us-central1-kappa-theta.cloudfunctions.net/api\n` +
        `All calls are made as \${BACKEND_URL}/users, /events, /alerts, /photo2, etc.`
      );
    }
  }

  return cleaned;
}

const backendUrl = getBackendUrl();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

if (isProduction) {
  // Production builds should behave like the remote repo:
  // The build environment (usually a .env checked out for the EAS production profile,
  // or env vars provided to EAS) supplies the real values.
  // We do a light validation here, but the real enforcement + real initializeApp
  // happens in firebaseConfig.js (matching the original unconditional remote code).
  const hasAnyFirebase = Object.values(firebaseConfig).some(v => v && String(v).trim() !== '' && !String(v).includes('REPLACE'));
  if (!hasAnyFirebase) {
    console.warn('[PROD CONFIG] Production build has no Firebase config. Ensure the .env (or environment) used for the production profile has real values, as required by the original repo.');
  }
}

const config = {
  expo: {
    // Match remote repo: owner is set so EAS knows the account.
    owner: 'boston-ktp',

    name: 'KTPActivities',
    slug: 'KTPActivities',
    version: '1.0.13',
    // runtimeVersion only matters if you enable OTA updates later.
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'cover',
      backgroundColor: '#192e52',
    },
    plugins: [
      'expo-router',
      'expo-image-picker',
      'expo-camera',
      '@react-native-google-signin/google-signin',
      '@react-native-community/datetimepicker',
    ],
    assetBundlePatterns: ['**/*'],
    ios: {
      // aps-environment is set based on build type:
      // - "development" for normal local debug + EAS dev/preview
      // - "production" for real App Store / production profiles
      entitlements: {
        'aps-environment': isProduction ? 'production' : 'development',
      },
      supportsTablet: true,
      bundleIdentifier: 'com.anonymous.KTPActivities',
      infoPlist: {
        LSApplicationQueriesSchemes: ['instagram', 'linkedin'],
        ITSAppUsesNonExemptEncryption: false,
      },
      buildNumber: '40',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.KTPActivities',
      googleServicesFile: './google-services.json',
      versionCode: 9,
      permissions: ['android.permission.RECORD_AUDIO'],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      // Available at runtime:
      //   import Constants from 'expo-constants';
      //   const { backendUrl, isProduction, appEnv } = Constants.expoConfig?.extra || {};
      backendUrl,
      firebase: firebaseConfig,
      appEnv,
      isProduction,

      // EAS project ID — matches remote HEAD + your Expo dashboard project.
      // Override by setting EXPO_PUBLIC_EAS_PROJECT_ID in the dashboard if needed.
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || '78d7b599-c910-4187-ba8e-3aa9aba9eec9',
      },
    },
    scheme: ['ktpactivities'],

    // expo-updates is only enabled for true production builds.
    // This avoids the "runtime version" warning on local debug builds.
    updates: {
      enabled: isProduction,
      // When you are ready for OTA updates, set this in the dashboard + here:
      // url: "https://u.expo.dev/78d7b599-c910-4187-ba8e-3aa9aba9eec9",
      // fallbackToCacheTimeout: 0,
    },
  },
};

export default config;
