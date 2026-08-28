/**
 * Temporary polling-based sync for Google Calendars.
 *
 * Use this as a workaround when you cannot deploy the Cloud Function
 * because of IAM restrictions (cloudfunctions.functions.setIamPolicy).
 *
 * It does the same job as the webhook but on a schedule:
 * - Reads calendar list + defaults from Firestore calendarTokens/main
 * - Uses the service account to call Google Calendar API
 * - Upserts events into the same `events` collection using the existing schema
 *
 * Run manually or on a cron / GitHub Action / serverless schedule.
 *
 * Usage:
 *   cd backend
 *   node pollGoogleCalendars.js
 *
 * You can also target a single key:
 *   node pollGoogleCalendars.js personal
 *
 * This is a TEMPORARY workaround while you cannot deploy the Cloud Function
 * due to IAM restrictions (cloudfunctions.functions.setIamPolicy).
 * Once you can deploy, switch back to the real webhook for near-real-time sync.
 */

import { config } from 'dotenv';
config();

import admin from 'firebase-admin';
import { google } from 'googleapis';
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
  console.log('[pollGoogleCalendars] Firebase Project ID:', effectiveProjectId);
}

const db = admin.firestore();

// Reuse the same conversion logic from the webhook (best effort copy for the workaround)
function toKtpEventSchema(googleEvent, position = 3) {
  let day = '';
  if (googleEvent.start?.date) {
    day = googleEvent.start.date;
  } else if (googleEvent.start?.dateTime) {
    day = googleEvent.start.dateTime.split('T')[0];
  }

  let time = '';
  const start = googleEvent.start?.dateTime || googleEvent.start?.date;
  const end = googleEvent.end?.dateTime || googleEvent.end?.date;

  if (start && end) {
    const startStr = start.includes('T') ? start.split('T')[1]?.substring(0, 5) : 'All day';
    const endStr = end.includes('T') ? end.split('T')[1]?.substring(0, 5) : '';
    time = endStr ? `${startStr} - ${endStr}` : startStr;
  }

  const name = googleEvent.summary || 'Untitled Event';
  const location = googleEvent.location || '';
  const description = googleEvent.description || '';

  const ktpEvent = {
    Name: name,
    Day: day,
    Time: time,
    Location: location,
    Description: description,
    Position: Number.isFinite(Number(position)) ? Number(position) : 3,
    source: 'google',
    googleEventId: googleEvent.id || '',
    lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
    calendarId: '', // will be filled by caller
  };

  return ktpEvent;
}

function extractPosition(googleEvent, defaultPosition = 3) {
  const ext = googleEvent.extendedProperties?.private?.position;
  if (ext !== undefined && ext !== null && ext !== '') {
    const n = parseFloat(ext);
    if (!isNaN(n)) return n;
  }
  const desc = googleEvent.description || '';
  const match = desc.match(/(?:POSITION|POS)[:=\s]*([0-9.]+)/i);
  if (match) {
    const n = parseFloat(match[1]);
    if (!isNaN(n)) return n;
  }
  return defaultPosition;
}

async function loadCalendarConfig() {
  const doc = await db.collection('calendarTokens').doc('main').get();
  if (!doc.exists) {
    throw new Error('No calendarTokens/main document found in Firestore');
  }
  const data = doc.data() || {};
  // Accept direct map or wrapped under config
  if (data.personal || data.eboard) return data;
  if (data.config) return data.config;
  return data;
}

async function pollOneCalendar(calendarId, defaultPosition, auth) {
  const calendar = google.calendar({ version: 'v3', auth });

  // Use the same per-calendar sync token storage as the webhook (calendarSync collection).
  // This makes repeated polling much lighter — it only asks Google for *changes*.
  const syncDocId = calendarId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const syncDocRef = db.collection('calendarSync').doc(syncDocId);
  const syncSnap = await syncDocRef.get();
  let syncToken = syncSnap.exists ? syncSnap.data().syncToken : null;

  const listParams = {
    calendarId,
    singleEvents: true,
    maxResults: 250,
  };

  if (syncToken) {
    listParams.syncToken = syncToken;
  } else {
    // First time (or token expired) — fall back to a 90-day window
    const now = new Date();
    const past = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    listParams.timeMin = past.toISOString();
  }

  let items = [];
  try {
    const res = await calendar.events.list(listParams);
    items = res.data.items || [];

    // Save the new sync token for the next run (same pattern as the webhook)
    if (res.data.nextSyncToken) {
      await syncDocRef.set({
        syncToken: res.data.nextSyncToken,
        lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
        calendarId,
      }, { merge: true });
    }
  } catch (err) {
    // If the sync token is invalid/expired (410), Google requires a full sync next time
    if (err.code === 410 || (err.response && err.response.status === 410)) {
      console.warn(`  Sync token expired for ${calendarId}. Doing a full 90-day pull this time.`);
      await syncDocRef.delete().catch(() => {});

      const now = new Date();
      const past = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const res = await calendar.events.list({
        calendarId,
        singleEvents: true,
        maxResults: 250,
        timeMin: past.toISOString(),
      });
      items = res.data.items || [];

      if (res.data.nextSyncToken) {
        await syncDocRef.set({
          syncToken: res.data.nextSyncToken,
          lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
          calendarId,
        }, { merge: true });
      }
    } else {
      throw err;
    }
  }

  let created = 0;
  let updated = 0;

  for (const ev of items) {
    if (ev.status === 'cancelled') {
      if (ev.id) {
        const existing = await db.collection('events')
          .where('googleEventId', '==', ev.id)
          .limit(1)
          .get();
        for (const d of existing.docs) {
          await d.ref.delete();
        }
      }
      continue;
    }

    const pos = extractPosition(ev, defaultPosition);
    const doc = toKtpEventSchema(ev, pos);
    doc.calendarId = calendarId;

    const existingSnap = await db.collection('events')
      .where('googleEventId', '==', ev.id)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      await existingSnap.docs[0].ref.set(doc, { merge: true });
      updated++;
    } else {
      await db.collection('events').add(doc);
      created++;
    }
  }

  return { created, updated, total: items.length };
}

async function main() {
  const targetKey = process.argv[2]; // optional: "personal" or "eboard"

  console.log('Loading calendar config from Firestore...');
  const configMap = await loadCalendarConfig();

  const keys = Object.keys(configMap);
  const toProcess = targetKey ? [targetKey] : keys;

  console.log('Calendars that will be polled:', toProcess.join(', '));

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(fs.readFileSync(keyPath, 'utf8')),
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });

  for (const key of toProcess) {
    const entry = configMap[key];
    if (!entry || !entry.calendarId) {
      console.warn(`Skipping ${key} — no calendarId configured`);
      continue;
    }

    const calId = entry.calendarId;
    const defPos = Number.isFinite(Number(entry.defaultPosition)) ? Number(entry.defaultPosition) : 3;

    console.log(`\nPolling "${key}" → ${calId} ...`);
    try {
      const result = await pollOneCalendar(calId, defPos, auth);
      console.log(`  ${result.total} events processed | created: ${result.created} | updated: ${result.updated}`);
    } catch (err) {
      console.error(`  Error polling ${key}:`, err.message || err);
    }
  }

  console.log('\nDone. Check Firestore events collection.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
