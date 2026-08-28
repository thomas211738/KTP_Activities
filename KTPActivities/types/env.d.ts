declare module '@env' {
  export const BACKEND_URL: string;
  export const GOOGLE_AUTH_IOS_CLIENT_ID: string;
  export const GOOGLE_AUTH_ANDROID_CLIENT_ID: string;
  export const WEB_CLIENT_ID: string;

  // Firebase (client config)
  export const FIREBASE_API_KEY: string;
  export const FIREBASE_AUTH_DOMAIN: string;
  export const FIREBASE_PROJECT_ID: string;
  export const FIREBASE_STORAGE_BUCKET: string;
  export const FIREBASE_MESSAGING_SENDER_ID: string;
  export const FIREBASE_APP_ID: string;
  export const FIREBASE_MEASUREMENT_ID: string;

  // Direct Google Calendar fetch (client-side, Firestore-driven)
  // Primary config source is Firestore calendarTokens/main.
  // These env vars are only fallbacks.
  export const GOOGLE_CALENDAR_ID: string;
  export const DEFAULT_POSITION: string;
  export const GOOGLE_CALENDAR_API_KEY: string; // Optional restricted browser key
}
