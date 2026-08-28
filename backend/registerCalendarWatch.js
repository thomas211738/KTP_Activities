/**
 * Helper script to register a Google Calendar push watch.
 *
 * This tells Google Calendar to POST notifications to your deployed Cloud Function
 * whenever events change on the target calendar.
 *
 * Usage (no need to pass the URL — it comes from the static config):
 *   cd backend
 *   node registerCalendarWatch.js personal
 *   node registerCalendarWatch.js eboard
 *
 * Override (optional):
 *   CALENDAR_WEBHOOK_URL=https://... node registerCalendarWatch.js personal
 *
 * It reads the calendar config from Firestore (calendarTokens/main)
 * so it knows the calendarId for the chosen key ("personal" or "eboard").
 *
 * It will print the channel details + resourceId. Save the resourceId somewhere
 * if you ever need to stop the watch manually.
 */

import { config } from 'dotenv';
config();

import admin from 'firebase-admin';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Static config (same value for local scripts + production).
// The webhook URL is STATIC — it does not change when you switch calendars.
import { CALENDAR_WEBHOOK_URL } from './config.js';

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
  console.log('[registerCalendarWatch] Firebase Project ID:', effectiveProjectId);
}

const db = admin.firestore();

const key = process.argv[2]; // "personal" or "eboard"

if (!key) {
  console.error('Usage: node registerCalendarWatch.js <key>');
  console.error('Example: node registerCalendarWatch.js personal');
  process.exit(1);
}

async function main() {
  // Load the current config from Firestore
  const configSnap = await db.collection('calendarTokens').doc('main').get();
  if (!configSnap.exists) {
    console.error('No calendarTokens/main document found. Seed it first.');
    process.exit(1);
  }

  const configData = configSnap.data();
  const calEntry = configData[key];

  if (!calEntry || !calEntry.calendarId) {
    console.error(`No entry found for key "${key}" in calendarTokens/main`);
    console.error('Current config:', JSON.stringify(configData, null, 2));
    process.exit(1);
  }

  const calendarId = calEntry.calendarId;
  console.log(`Registering watch for key="${key}" → calendarId="${calendarId}"`);

  // Auth with the service account (must have Calendar API access)
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(fs.readFileSync(keyPath, 'utf8')),
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });

  const calendar = google.calendar({ version: 'v3', auth });

  // STATIC webhook URL from central config.
  // This is the same value for local scripts and production.
  // It never changes just because you switch Google Calendars.
  //
  // You can still override it at runtime with:
  //   CALENDAR_WEBHOOK_URL=... node registerCalendarWatch.js personal
  let webhookUrl = process.env.CALENDAR_WEBHOOK_URL || process.env.WEBHOOK_URL || CALENDAR_WEBHOOK_URL;

  if (!webhookUrl || webhookUrl.includes('YOUR-REGION') || webhookUrl.includes('YOUR-PROJECT')) {
    console.error('\nERROR: Could not determine a valid static webhook URL.');
    console.error('Check backend/config.js or set CALENDAR_WEBHOOK_URL in your environment.');
    process.exit(1);
  }

  // Create a unique channel ID (Google requires it to be unique per watch)
  const channelId = `ktp-${key}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  const watchBody = {
    id: channelId,
    type: 'web_hook',
    address: webhookUrl,
    token: key,                    // Important: this becomes x-goog-channel-token
    // You can add params if needed
  };

  console.log('\nSending events.watch request...');
  console.log('Channel ID:', channelId);
  console.log('Address (STATIC from backend/config.js):', webhookUrl);
  console.log('Token (this identifies which calendar config to use):', key);

  try {
    const res = await calendar.events.watch({
      calendarId,
      requestBody: watchBody,
    });

    console.log('\n✅ Watch registered successfully!');
    console.log('Response:');
    console.dir(res.data, { depth: null });

    // Save useful info to Firestore for later management
    const watchInfo = {
      key,
      calendarId,
      channelId,
      resourceId: res.data.resourceId,
      expiration: res.data.expiration, // timestamp in ms
      webhookUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('calendarWatches').doc(channelId).set(watchInfo);

    console.log('\n📌 Saved watch info to Firestore: calendarWatches/' + channelId);
    console.log('Save the resourceId if you ever need to stop this watch manually:');
    console.log('resourceId =', res.data.resourceId);
    console.log('It expires around:', new Date(Number(res.data.expiration)).toISOString());

  } catch (err) {
    console.error('\n❌ Failed to register watch:');
    if (err.response && err.response.data) {
      console.error(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
