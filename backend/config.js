/**
 * Central static configuration for the KTP backend.
 *
 * These values are the same for local scripts and production.
 *
 * === IMPORTANT: Calendar Webhook URL ===
 * The CALENDAR_WEBHOOK_URL below is STATIC.
 * It does NOT change when you:
 *   - Switch Google Calendars (personal → eboard → president, etc.)
 *   - Re-share the service account with a different calendar
 *   - Update calendarTokens/main in Firestore
 *
 * You only need to change this value if you:
 *   - Move the function to a different region
 *   - Rename the exported function
 *   - Deploy to a completely different Firebase project
 *
 * You can still override it at runtime with the env var:
 *   CALENDAR_WEBHOOK_URL=... node registerCalendarWatch.js personal
 */

// Load .env automatically when this module is imported.
// This way any script that does `import { CALENDAR_WEBHOOK_URL } from './config.js'`
// gets the static value without having to call dotenv itself.
import { config } from 'dotenv';
config();

// Firebase project
export const FIREBASE_PROJECT_ID =
  process.env.GOOGLE_FIREBASE_PROJECT_ID || 'kappa-theta';

export const REGION = 'us-central1';

// The single static HTTPS URL for the Google Calendar push webhook.
// This is what you pass as the "address" when calling events.watch.
//
// === KEY POINT ===
// This URL is STATIC. It does not change when you switch which Google Calendar
// (personal, eboard, president, etc.) you are listening to.
// You only change this if you move the Cloud Function to a different region,
// rename it, or deploy to a different Firebase project.
export const CALENDAR_WEBHOOK_URL =
  process.env.CALENDAR_WEBHOOK_URL ||
  `https://${REGION}-${FIREBASE_PROJECT_ID}.cloudfunctions.net/calendarWebhook`;

// Backwards-compatible alias (some older scripts/docs used WEBHOOK_URL)
export const WEBHOOK_URL = process.env.WEBHOOK_URL || CALENDAR_WEBHOOK_URL;

// --- CommonJS compatibility ---
// So that CommonJS files (like cloudFunctions/calendarWebhook/main.js) can do:
//   const { CALENDAR_WEBHOOK_URL } = require('../config');
const __commonjsExports = {
  FIREBASE_PROJECT_ID,
  REGION,
  CALENDAR_WEBHOOK_URL,
  WEBHOOK_URL,
};

export default __commonjsExports;

// Support `require('./config')` from CommonJS consumers
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  module.exports = __commonjsExports;
}
