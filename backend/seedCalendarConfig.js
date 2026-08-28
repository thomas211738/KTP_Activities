/**
 * One-time seed script for Google Calendar webhook configuration.
 *
 * Writes the initial multi-calendar config to:
 *   Firestore → calendarTokens → main
 *
 * This is the primary source of truth used by:
 *   backend/cloudFunctions/calendarWebhook/main.js
 *
 * Run with:
 *   cd backend && node seedCalendarConfig.js
 *
 * You can safely re-run this script; it will overwrite with the exact boilerplate.
 */

import { config } from 'dotenv';
config();

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const keyPath = path.join(__dirname, 'serviceAccountKey.json');

let credential;
let effectiveProjectId = process.env.GOOGLE_FIREBASE_PROJECT_ID;

if (fs.existsSync(keyPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  credential = admin.credential.cert(serviceAccount);
  if (serviceAccount.project_id) {
    effectiveProjectId = serviceAccount.project_id;
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  credential = admin.credential.applicationDefault();
} else {
  credential = admin.credential.applicationDefault();
}

if (!admin.apps.length) {
  const initConfig = { credential, projectId: effectiveProjectId };
  admin.initializeApp(initConfig);
}

if (effectiveProjectId) {
  console.log('[seedCalendarConfig] Firebase Project ID:', effectiveProjectId);
}

const db = admin.firestore();

// Calendar config for Firestore document: calendarTokens/main
//
// "personal" is the DEFAULT PROFILE (as explicitly requested).
// The mobile app's direct Google Calendar fetch (publicCalendar.ts) now
// always prefers the "personal" key when loading this document.
//
// For the unauthenticated client fetch (using GOOGLE_CALENDAR_API_KEY + ?key=)
// the calendar MUST be public:
//   - "Make available to public" checked
//   - "See event details" selected
//
// You have done this for the calendar below (from the embed link you shared).
//
// The ID comes from the ?src= parameter in your embed URL (decoded).
const calendarConfig = {
  // Default profile (preferred by the app)
  personal: {
    calendarId: "16ecd22691fb3acae84743f9484a65e405ef525c85763ea23316f565b217b06b@group.calendar.google.com",
    defaultPosition: 3
  },
  // Optional secondary profile
  eboard: {
    calendarId: "eboard-ktp@group.calendar.google.com",
    defaultPosition: 3
  }
};

async function seed() {
  try {
    const docRef = db.collection('calendarTokens').doc('main');
    await docRef.set(calendarConfig);   // full overwrite with clean map

    console.log('✅ Successfully seeded Firestore document: calendarTokens/main');
    console.log('Document contents:');
    console.log(JSON.stringify(calendarConfig, null, 2));

    // Read it back to confirm
    const snap = await docRef.get();
    if (snap.exists) {
      console.log('\n✅ Verified read-back from Firestore:');
      console.log(JSON.stringify(snap.data(), null, 2));
    }
  } catch (err) {
    console.error('❌ Failed to seed calendarTokens/main:', err);
    process.exit(1);
  }
}

seed();
