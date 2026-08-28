# Local Simulator Run + Production Builds (Environment-aware)

This project uses environment-specific configuration so local development and production releases use different values safely.

## How environment selection works

- `APP_ENV=production` (or `NODE_ENV=production`) → loads `.env.production`
- Default / `APP_ENV=development` → loads `.env.development` (or fallback `.env`)
- The selection happens in `babel.config.js` at build time.
- `app.config.ts` (Expo dynamic config) + `app/config.ts` + early guards in `firebaseConfig.js` and `auth.tsx` enforce production rules.

**Never** let a production build use `localhost` or dev Firebase stubs. The code will throw early if this is detected.

## Local development (simulator)

```bash
cd KTPActivities

# Use the development env (this is the default)
# .env.development should have BACKEND_URL=http://localhost:5000

npx expo prebuild --clean
xcrun simctl shutdown all
xcrun simctl boot B8788F08-5B4F-4D79-891B-71ED919C61A3
npx expo run:ios -d B8788F08-5B4F-4D79-891B-71ED919C61A3
```

## Production / Release builds

### 1. Prepare `.env.production` (or use Expo dashboard env vars)

Create / edit `KTPActivities/.env.production` with **real production values** matching the remote repo's production deployment.

**Anticipated production BACKEND_URL (remote repo setup):**

The remote repo deploys the backend Express app as a Firebase Cloud Function named `api`:

```bash
firebase deploy --only functions:api
```

(See: backend/index.js → `export const api = onRequest(..., app)`, and backend/package.json → `"deploy": "firebase deploy --only functions:api"`)

Therefore the correct production base URL is:

```
https://us-central1-kappa-theta.cloudfunctions.net/api
```

All client calls use:
```
${BACKEND_URL}/users
${BACKEND_URL}/events
${BACKEND_URL}/alerts
${BACKEND_URL}/photo2
${BACKEND_URL}/notifications
...
```
With the URL above they resolve to `/api/users`, `/api/events`, etc.

```env
BACKEND_URL=https://us-central1-kappa-theta.cloudfunctions.net/api
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
# ... all other FIREBASE_* values (real keys required for prod)
GOOGLE_AUTH_IOS_CLIENT_ID=...
# etc.
```

Localhost / 10.x / 192.168 addresses are **rejected** at build/start time when `APP_ENV=production`.

If you deploy the backend to a different host (Render, custom domain, etc.), set BACKEND_URL to the public base URL where the Express routes are mounted at the root.

### 2. Build with the production environment

Using Expo CLI directly:
```bash
cd KTPActivities
APP_ENV=production npx expo prebuild --clean
APP_ENV=production npx expo run:ios --configuration Release
```

Using EAS Build (recommended for real releases):
```bash
cd KTPActivities
eas build --profile production --platform ios
# The eas.json production profile already sets APP_ENV=production
```

The `eas.json` profiles are set up as:
- `development` → APP_ENV=development
- `preview` → APP_ENV=production
- `production` → APP_ENV=production (auto-increments version)

### 3. What gets enforced in production builds

- `firebaseConfig.js`: Throws if Firebase keys are missing or only dev stubs exist.
- `auth.tsx` + `firebaseConfig.js`: Throws if `BACKEND_URL` is localhost/LAN.
- `app.config.ts`: Validates backend URL and Firebase config when `isProduction`.
- `app/config.ts`: Central place future code should import from for env-aware values.

## Files that matter for environment switching

- `babel.config.js` — chooses which `.env.*` file react-native-dotenv loads
- `app.config.ts` — Expo config + extra values exposed via `expo-constants`
- `app/config.ts` — recommended import point for `BACKEND_URL`, `isProduction`, etc.
- `app/firebaseConfig.js` — conditional Firebase + hard production guards
- `app/components/auth.tsx` — ValidateUser + production backend guard
- `eas.json` — build profiles that inject `APP_ENV`
- `.env.development`, `.env.production`, `.env.example`

## Updating after changing environment files

Always run a clean prebuild when you switch environments or change values that affect native config:

```bash
npx expo prebuild --clean
```

Then rebuild (`expo run:ios`, EAS build, etc.).

## Backend

The mobile app only cares about `BACKEND_URL`. The Express backend (in `/backend`) is usually deployed separately and should be reachable at the production `BACKEND_URL`.

## Summary of the safety model

- Local dev can be convenient (localhost, optional Firebase keys).
- Production builds are strict: real public backend URL + real Firebase config required.
- The mechanism is driven by `APP_ENV` at build time + runtime assertions.
