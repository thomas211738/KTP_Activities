import axios from "axios"
import { BACKEND_URL } from "@env"
import Constants from 'expo-constants';

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

export async function ValidateUser(userEmail) {
    try {
        console.log('[ValidateUser] Calling backend at', `${BACKEND_URL}/users`);
        const response = await axios.get(`${BACKEND_URL}/users`, { timeout: 15000 });
        const users = response.data.data;

        const user = users.find(u => u.BUEmail && u.BUEmail.toLowerCase() === userEmail.toLowerCase());

        if (userEmail.toLowerCase() === "testktpapp@gmail.com") {
            return { status: 1, user: user || null, allUsers: users };
        }

        if (user) {
            return { status: 1, user, allUsers: users };
        } else {
            const domain = (userEmail.split('@')[1] || '').toLowerCase();
            if (domain !== 'bu.edu') {
                return { status: -1, user: null, allUsers: users };
            }
            return { status: 0, user: null, allUsers: users };
        }
    } catch (error) {
        // Axios "Network Error" usually means connection refused / timeout / unreachable backend
        console.error('[ValidateUser] Network / Axios error:', error?.message || error);
        if (error?.code) console.error('  code:', error.code);
        if (error?.config?.url) console.error('  url:', error.config.url);
        // Return a clear shape so the caller can show a useful message instead of crashing the flow
        return { status: 'error', message: 'Network error reaching backend', error };
    }
}

