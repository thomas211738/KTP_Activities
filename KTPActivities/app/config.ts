/**
 * Centralized application configuration (runtime values).
 *
 * Values are baked at build time by app.config.ts based on the resolved APP_ENV.
 *
 * Recommended usage:
 *   import { BACKEND_URL, isProduction, appEnv } from './config';
 *
 * How APP_ENV / production mode is decided (see app.config.ts for full logic):
 *   - Normal local:                     npx expo run:ios                    → development
 *   - Local production test:            APP_ENV=production npx expo run:ios --configuration Release
 *   - EAS development profile:          → development
 *   - EAS preview / production profile: → production
 *   - You can also set APP_ENV as an Environment Variable in the Expo dashboard.
 */

import { BACKEND_URL as ENV_BACKEND_URL } from '@env';
import Constants from 'expo-constants';
import { TEST_MODE_ENABLED, ALLOWED_TEST_EMAILS } from './testConfig';

const extra = Constants?.expoConfig?.extra || {};

// Prefer the value that was authoritatively resolved at build time in app.config.ts
export const isProduction: boolean =
  extra.isProduction === true ||
  extra.appEnv === 'production';

// The resolved APP_ENV string ("development" | "production")
export const appEnv: 'development' | 'production' =
  (extra.appEnv === 'production' ? 'production' : 'development');

// Runtime values (from the selected .env at build time, or EAS env vars)
export const BACKEND_URL: string = (extra.backendUrl || ENV_BACKEND_URL || '').trim();

export const firebaseConfig = extra.firebase || {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Test mode for Apple TestFlight review (controlled by Firebase Remote Config)
// This is TEMPORARY and must be turned off after review is complete.
export { TEST_MODE_ENABLED, ALLOWED_TEST_EMAILS } from './testConfig';

// Production safety check — only enforced for actual production builds
if (isProduction) {
  const url = BACKEND_URL;
  const isLocalHost =
    !url ||
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.startsWith('http://10.') ||
    url.startsWith('http://192.168.');

  if (isLocalHost) {
    throw new Error(
      `[PRODUCTION] BACKEND_URL is invalid for production: "${url}".\n` +
      'For production builds (EAS production profile or APP_ENV=production), you must provide a real public backend URL.\n' +
      'Set it via the Expo project dashboard Environment Variables for the production profile, ' +
      'or in your local .env.production when doing local Release builds for testing.\n\n' +
      'Remote repo production setup deploys the backend as Firebase Function "api":\n' +
      '  https://us-central1-kappa-theta.cloudfunctions.net/api\n' +
      'Client calls use ${BACKEND_URL}/users, /events, /alerts, /photo2, etc.'
    );
  }

  // Additional guard for the remote repo's Firebase Functions deployment shape.
  // The Express app is exported as the function named "api".
  // BACKEND_URL must therefore include the /api suffix so that paths resolve correctly.
  if (url.includes('cloudfunctions.net') && !/\/api(\/|$)/.test(url)) {
    throw new Error(
      `[PRODUCTION] BACKEND_URL points at a Firebase Functions host but is missing the required "/api" suffix.\n` +
      `Got: "${url}"\n` +
      `Remote repo deploys with: firebase deploy --only functions:api\n` +
      `Correct production value: https://us-central1-kappa-theta.cloudfunctions.net/api\n` +
      `Without /api, calls like ${url}/users will 404.`
    );
  }
}
