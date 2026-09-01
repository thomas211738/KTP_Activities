/**
 * Google Calendar Webhook Cloud Function
 *
 * Purpose:
 *   - Receives push notifications from the Google Calendar API (events.watch).
 *   - Supports **multiple calendars** via channel token or calendar ID (personal test calendar ↔ Eboard/president calendar, etc.).
 *   - Syncs events into the Firestore `events` collection using the existing schema.
 *
 * Schema compatibility (matches backend/routes/eventsRoutes.js and the mobile app):
 *   Core fields we always write:
 *     - Name: string
 *     - Day: string (YYYY-MM-DD)
 *     - Time: string (human readable)
 *     - Location: string
 *     - Description: string
 *
 *   Position (visibility):
 *     - NOT a strict/required typed value from the Google Calendar side.
 *     - Reason: Only Eboard will be editing the source calendar(s).
 *     - We attempt best-effort extraction (see extractPosition).
 *     - Per-calendar defaultPosition is supported.
 *     - Final hard fallback = 3 (E-board level).
 *
 * Multi-calendar support:
 *   - Identify the source calendar using the `x-goog-channel-token` you set when registering the watch.
 *   - Primary config source: Firestore document `calendarTokens/main` (stores the full map as an object or under a `config` / `configJson` field).
 *   - Fallback: CALENDAR_CONFIGS (JSON) or GOOGLE_CALENDAR_ID + DEFAULT_POSITION environment variables (useful for local dev).
 *   - Register separate watches for different calendars (different tokens or IDs).
 *   - Switch from your personal Gmail calendar (testing) to an official Eboard/president calendar later by registering a new watch — no code change required. Just edit the Firestore doc.
 *
 * Additional sync metadata written (safe for the app to ignore):
 *   - source: "google"
 *   - googleEventId
 *   - lastSyncedAt
 *   - (optional) calendarId
 *
 * Deployment:
 *   - HTTP-triggered Cloud Function (Firebase Functions v2 recommended).
 *   - The service account must have Calendar read access on every calendar you watch (share each calendar with the service account email, "See all event details").
 *
 * The public webhook URL is defined as a static default in:
 *   backend/config.js → CALENDAR_WEBHOOK_URL
 *
 * This URL is STATIC. It does not change when you switch calendars
 * (personal → eboard → etc.). You only change it if you move the function
 * to a different region/project or rename it.
 */

const { google } = require('googleapis');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Send push notifications via the Expo Push API.
// Only sends to users whose Position >= the event's Position (same visibility
// rule the Calendar tab uses: eventPos <= userPos).
// Reads tokens + positions from Firestore, fans out in batches of 100.
// ---------------------------------------------------------------------------
async function notifyEventChange(eventData, action = 'created') {
  try {
    const eventPos = Number.isFinite(Number(eventData.Position)) ? Number(eventData.Position) : 0;

    // 1. Load all users to get their Position
    const usersSnap = await db.collection('users').get();
    const userPositionMap = {};
    usersSnap.docs.forEach(d => {
      userPositionMap[d.id] = Number.isFinite(Number(d.data().Position)) ? Number(d.data().Position) : 0;
    });

    // 2. Load all push tokens
    const tokensSnap = await db.collection('notifications').get();
    if (tokensSnap.empty) {
      console.log('[calendarWebhook] No push tokens found, skipping notifications.');
      return;
    }

    // 3. Filter tokens to users who can see this event (userPos >= eventPos)
    const eligibleTokens = tokensSnap.docs
      .filter(d => {
        const { userID, token } = d.data();
        if (typeof token !== 'string' || !token.startsWith('ExponentPushToken')) return false;
        const userPos = userPositionMap[userID];
        if (userPos === undefined) return false; // orphan token — no matching user
        return userPos >= eventPos;
      })
      .map(d => d.data().token);

    if (eligibleTokens.length === 0) {
      console.log(`[calendarWebhook] No eligible tokens for eventPos=${eventPos}. Skipping.`);
      return;
    }

    console.log(`[calendarWebhook] Sending to ${eligibleTokens.length} device(s) with position >= ${eventPos}`);

    const title = action === 'created' ? '🗓 New Event Added' : '🗓 Event Updated';
    const body = [
      eventData.Name || 'Calendar Event',
      eventData.Day  || '',
      eventData.Time || '',
    ].filter(Boolean).join(' • ');

    // 4. Build Expo push messages
    const messages = eligibleTokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: {
        type: 'calendar_event',
        action,
        eventId:  eventData.googleEventId || '',
        name:     eventData.Name          || '',
        day:      eventData.Day           || '',
        time:     eventData.Time          || '',
        location: eventData.Location      || '',
      },
      badge: 1,
    }));

    // 5. Fan out in batches of 100 (Expo's per-request limit)
    const BATCH_SIZE = 100;
    const https = require('https');

    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const batch = messages.slice(i, i + BATCH_SIZE);
      const payload = JSON.stringify(batch);

      await new Promise((resolve, reject) => {
        const options = {
          hostname: 'exp.host',
          path:     '/--/api/v2/push/send',
          method:   'POST',
          headers:  {
            'Content-Type':    'application/json',
            'Accept':          'application/json',
            'Accept-Encoding': 'gzip, deflate',
          },
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            console.log(`[calendarWebhook] Expo push batch ${Math.floor(i / BATCH_SIZE) + 1}: HTTP ${res.statusCode}`);
            resolve();
          });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
      });
    }

    console.log(`[calendarWebhook] ✅ Sent push notifications to ${eligibleTokens.length} device(s): "${title}"`);
  } catch (error) {
    console.error('[calendarWebhook] Failed to send push notifications:', error.message || error);
    // Do not fail the webhook if notifications fail — calendar sync is more important
  }
}

// Robust Firebase Admin initialization for the Cloud Function module.
// This file can be required by index.js (local dev) or deployed as a v2 function.
// We replicate the same defensive logic used in backend/index.js so that
// a bare require() never creates an Admin app without a detectable projectId.
let effectiveProjectId = process.env.GOOGLE_FIREBASE_PROJECT_ID;
let storageBucket = process.env.GOOGLE_FIREBASE_STORAGE_BUCKET;

const keyPath = path.join(__dirname, '..', '..', 'serviceAccountKey.json');
let credential;
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

if (!storageBucket && effectiveProjectId) {
  storageBucket = `${effectiveProjectId}.appspot.com`;
}

if (!admin.apps.length) {
  const initConfig = {
    credential,
    projectId: effectiveProjectId,
  };
  if (storageBucket) {
    initConfig.storageBucket = storageBucket;
  }
  admin.initializeApp(initConfig);
}

if (effectiveProjectId) {
  console.log('[calendarWebhook] Firebase Project ID:', effectiveProjectId);
}

const db = admin.firestore();

/**
 * Build calendar configuration map from environment variables (fallback only).
 *
 * Preferred/primary source is Firestore at: calendarTokens/main
 *
 * These env vars are only used if the Firestore document is missing or empty.
 * Once calendarTokens/main exists with your config, you do NOT need to keep
 * CALENDAR_CONFIGS (or GOOGLE_CALENDAR_ID / DEFAULT_POSITION) in any .env file.
 */
function getCalendarConfigsFromEnv() {
  if (process.env.CALENDAR_CONFIGS) {
    try {
      const parsed = JSON.parse(process.env.CALENDAR_CONFIGS);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch (e) {
      console.warn('[calendarWebhook] Invalid CALENDAR_CONFIGS JSON in env');
    }
  }

  const singleId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  const singlePos = Number.isFinite(Number(process.env.DEFAULT_POSITION)) ? Number(process.env.DEFAULT_POSITION) : 3;

  return {
    default: {
      calendarId: singleId,
      defaultPosition: singlePos,
    },
  };
}

/**
 * Load calendar configuration (multi-calendar map) from Firestore.
 * Primary location:  calendarTokens / main
 *
 * You said you want to store this "as a string or json variable".
 * We therefore accept several common shapes:
 *
 *   1. Direct map (best):
 *        { "personal": { calendarId: "...", defaultPosition: 3 }, "eboard": { ... } }
 *
 *   2. Wrapped:
 *        { config: { ...map... } }
 *        { data:   { ...map... } }
 *        { value:  { ...map... } }
 *
 *   3. As a JSON string in one of these fields:
 *        { configJson: "{ ... }" }
 *        { config:     "{ ... }" }     // string inside config
 *        { json:       "{ ... }" }
 *        { value:      "{ ... }" }
 *
 *   4. The entire document data is a string (rare, but supported).
 *
 * Falls back to environment variables when the document is missing/empty/invalid.
 */
async function loadCalendarConfig() {
  try {
    const docRef = db.collection('calendarTokens').doc('main');
    const snap = await docRef.get();

    if (snap.exists) {
      let data = snap.data();

      // If the document itself is literally a string (uncommon in Firestore but possible via set with string)
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (parsed && typeof parsed === 'object') {
            console.log('[calendarWebhook] Loaded calendar config from Firestore calendarTokens/main (root string)');
            return parsed;
          }
        } catch (_) {}
      }

      if (!data || typeof data !== 'object') {
        data = {};
      }

      // 1. Direct map on the document (most common case you will use)
      // Heuristic: looks like our calendar map if first value has calendarId or defaultPosition
      const keys = Object.keys(data);
      if (keys.length > 0 && !data.config && !data.configJson && !data.data && !data.value && !data.json) {
        const firstVal = data[keys[0]];
        if (firstVal && typeof firstVal === 'object' && (firstVal.calendarId || firstVal.defaultPosition !== undefined)) {
          console.log('[calendarWebhook] Loaded calendar config from Firestore calendarTokens/main (direct map)');
          return data;
        }
      }

      // 2. Common wrapper fields that contain an object map
      const wrapperKeys = ['config', 'data', 'value'];
      for (const k of wrapperKeys) {
        if (data[k] && typeof data[k] === 'object' && !Array.isArray(data[k])) {
          // If it's already a map of calendars, use it
          const innerKeys = Object.keys(data[k]);
          if (innerKeys.length > 0) {
            const firstInner = data[k][innerKeys[0]];
            if (firstInner && typeof firstInner === 'object' && (firstInner.calendarId || firstInner.defaultPosition !== undefined)) {
              console.log(`[calendarWebhook] Loaded calendar config from Firestore calendarTokens/main (${k} field)`);
              return data[k];
            }
          }
        }
      }

      // 3. JSON string stored under common field names
      const stringCandidates = [
        data.configJson,
        data.config,     // sometimes people put a string under "config"
        data.json,
        data.value,
        data.data,
      ].filter(v => typeof v === 'string' && v.trim().length > 0);

      for (const str of stringCandidates) {
        try {
          const parsed = JSON.parse(str);
          if (parsed && typeof parsed === 'object') {
            console.log('[calendarWebhook] Loaded calendar config from Firestore calendarTokens/main (JSON string field)');
            return parsed;
          }
        } catch (_) {
          // try next candidate
        }
      }

      // 4. Last resort: scan for any string field that parses as our map
      for (const k of Object.keys(data)) {
        if (typeof data[k] === 'string') {
          try {
            const parsed = JSON.parse(data[k]);
            if (parsed && typeof parsed === 'object') {
              const pkeys = Object.keys(parsed);
              if (pkeys.length > 0) {
                const fv = parsed[pkeys[0]];
                if (fv && typeof fv === 'object' && (fv.calendarId || fv.defaultPosition !== undefined)) {
                  console.log('[calendarWebhook] Loaded calendar config from Firestore calendarTokens/main (parsed string field)');
                  return parsed;
                }
              }
            }
          } catch (_) {}
        }
      }

      // If we got here, the document existed but didn't contain usable calendar data
      console.warn('[calendarWebhook] calendarTokens/main exists but did not contain a recognizable calendar map. Using env fallback.');
    }
  } catch (err) {
    console.warn('[calendarWebhook] Failed to read calendarTokens/main from Firestore, will use env fallback:', err.message);
  }

  // Fallback to env
  console.log('[calendarWebhook] Using calendar config from environment variables (fallback)');
  return getCalendarConfigsFromEnv();
}

/**
 * Resolve which calendar + defaultPosition to use for this notification.
 * Priority inside the resolved map:
 *   1. Exact match on x-goog-channel-token against config keys (recommended when registering watches).
 *   2. If the token itself looks like a calendar ID, use it directly.
 *   3. Fall back to the first (or "default") config entry.
 */
function resolveConfig(token, configs) {
  const keys = Object.keys(configs || {});

  if (token && configs[token]) {
    return { key: token, ...configs[token] };
  }

  // Allow stuffing the calendarId (or "primary") directly into the channel token
  if (token && (token.includes('@') || token === 'primary' || token.length > 3)) {
    const safeKey = token.replace(/[^a-zA-Z0-9_-]/g, '_');
    return {
      key: safeKey,
      calendarId: token,
      defaultPosition: 3,
    };
  }

  // Final fallback
  const firstKey = keys[0] || 'default';
  const entry = configs[firstKey] || { calendarId: 'primary', defaultPosition: 3 };
  return { key: firstKey, ...entry };
}

/**
 * Strict schema enforcement.
 * Takes a Google Calendar event + a Position and returns a document that
 * exactly matches what the existing Express routes and mobile app expect.
 */
function toKtpEventSchema(googleEvent, position) {
  // Day: prefer date (all-day) or extract date from dateTime
  let day = '';
  if (googleEvent.start?.date) {
    day = googleEvent.start.date; // already YYYY-MM-DD
  } else if (googleEvent.start?.dateTime) {
    day = googleEvent.start.dateTime.split('T')[0];
  }

  // Time: best effort human-readable string.
  // If you want more structure later, you can expand the schema,
  // but for now we keep compatibility with the existing Time field.
  let time = '';
  const start = googleEvent.start?.dateTime || googleEvent.start?.date;
  const end = googleEvent.end?.dateTime || googleEvent.end?.date;

  if (start && end) {
    // Simple formatting — you can improve this mapping as needed.
    const startStr = start.includes('T') ? start.split('T')[1]?.substring(0, 5) : 'All day';
    const endStr = end.includes('T') ? end.split('T')[1]?.substring(0, 5) : '';
    time = endStr ? `${startStr} - ${endStr}` : startStr;
  }

  const name = googleEvent.summary || 'Untitled Event';
  const location = googleEvent.location || '';
  const description = googleEvent.description || '';

  // ============================================================
  // FIRESTORE SCHEMA (follows the existing one used by the app)
  //
  // Core fields we always try to provide (matching backend/routes/eventsRoutes.js):
  //   Name, Day, Time, Location, Description
  //
  // Position (visibility):
  //   - No longer a strict/required value from the Google Calendar side.
  //   - Reason: Only Eboard will be editing the source calendar(s).
  //   - We attempt to extract it (see extractPosition).
  //   - If we cannot determine it, we use the per-calendar defaultPosition.
  //   - Final fallback = 3 (E-board level).
  // ============================================================
  const ktpEvent = {
    Name: name,
    Day: day,
    Time: time,
    Location: location,
    Description: description,
    Position: Number.isFinite(Number(position)) ? Number(position) : 3,
  };

  // Internal sync metadata
  ktpEvent.source = 'google';
  ktpEvent.googleEventId = googleEvent.id || '';
  ktpEvent.lastSyncedAt = admin.firestore.FieldValue.serverTimestamp();

  return ktpEvent;
}

/**
 * Derive Position (visibility) — BEST EFFORT ONLY.
 *
 * We no longer treat Position as a strict requirement from the Google Calendar.
 * Reason: Only Eboard will be editing the source calendar(s).
 *
 * Resolution order:
 *   1. extendedProperties.private.position (e.g. set to "3")
 *   2. Description contains POSITION:3 or POS: 3 etc.
 *   3. The defaultPosition configured for this specific calendar (see calendarConfigs)
 *   4. Hard fallback = 3 (E-board visible)
 */
function extractPosition(googleEvent, defaultPosition = 3) {
  // 1. Private extended property (cleanest)
  const ext = googleEvent.extendedProperties?.private?.position;
  if (ext !== undefined && ext !== null && ext !== '') {
    const n = parseFloat(ext);
    if (!isNaN(n)) return n;
  }

  // 2. Description tag fallback
  const desc = googleEvent.description || '';
  const match = desc.match(/(?:POSITION|POS)[:=\s]*([0-9.]+)/i);
  if (match) {
    const n = parseFloat(match[1]);
    if (!isNaN(n)) return n;
  }

  // 3. Per-calendar default
  return defaultPosition;
}

/**
 * Main HTTP handler for Google Calendar push notifications.
 *
 * Deploy this as a Cloud Function (recommended: Firebase Functions v2).
 *
 * Example wrapper (create or update functions/index.js):
 *
 *   const { onRequest } = require('firebase-functions/v2/https');
 *   const calendarWebhookMod = require('./calendarWebhook/main');
 *
 *   exports.calendarWebhook = onRequest(
 *     {
 *       region: 'us-central1',
 *       memory: '256MiB',
 *       timeoutSeconds: 60,
 *     },
 *     calendarWebhookMod.calendarWebhook
 *   );
 *
 * Then register a Google Calendar watch pointing at the deployed HTTPS URL.
 */
exports.calendarWebhook = async (req, res) => {
  try {
    const headers = req.headers || {};
    const channelId = headers['x-goog-channel-id'];
    const resourceState = headers['x-goog-resource-state']; // 'sync', 'exists', 'not_exists'
    const resourceId = headers['x-goog-resource-id'];
    const token = headers['x-goog-channel-token']; // optional verification token you set when creating the watch

    console.log('[calendarWebhook] Notification received', {
      channelId,
      resourceState,
      resourceId,
    });

    // Always respond quickly to Google
    if (resourceState === 'sync') {
      console.log('[calendarWebhook] Initial sync notification');
      return res.status(200).send('OK');
    }

    // Optional: verify token if you set one when creating the watch
    // if (token && token !== process.env.CALENDAR_WEBHOOK_TOKEN) {
    //   return res.status(403).send('Forbidden');
    // }

    // Load calendar configuration from Firestore (calendarTokens/main) with env fallback.
    // This is the single source of truth for which Google Calendar(s) to pull from and their Position defaults.
    const calendarConfigMap = await loadCalendarConfig();

    // Resolve the specific calendar for this notification using the channel token.
    // Different watches (personal vs Eboard/president) use different tokens so the same function can handle many calendars.
    const cfg = resolveConfig(token, calendarConfigMap);
    const calendarId = cfg.calendarId || 'primary';
    const defaultPositionForThisCal = Number.isFinite(Number(cfg.defaultPosition)) ? Number(cfg.defaultPosition) : 3;

    console.log('[calendarWebhook] Using calendar config', {
      key: cfg.key,
      calendarId,
      defaultPosition: defaultPositionForThisCal,
    });

    // Auth for Calendar API using Application Default Credentials (works in Cloud Functions)
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });
    const calendar = google.calendar({ version: 'v3', auth });

    // Per-calendar sync token document (sanitized key so it works for "primary" and email-style IDs)
    const syncDocId = (cfg.key || calendarId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const syncDocRef = db.collection('calendarSync').doc(syncDocId);
    const syncDoc = await syncDocRef.get();
    let syncToken = syncDoc.exists ? syncDoc.data().syncToken : null;

    let eventsToProcess = [];

    if (resourceState === 'exists' || resourceState === 'not_exists') {
      try {
        const listParams = {
          calendarId,
          singleEvents: true, // expand recurring events into instances (simpler for now)
          maxResults: 250,
        };

        if (syncToken) {
          listParams.syncToken = syncToken;
        } else {
          // First time after watch creation — get recent events
          const now = new Date();
          const past = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // ~90 days
          listParams.timeMin = past.toISOString();
        }

        const listRes = await calendar.events.list(listParams);

        eventsToProcess = listRes.data.items || [];

        // Save the new sync token for next time (per calendar)
        if (listRes.data.nextSyncToken) {
          await syncDocRef.set(
            {
              syncToken: listRes.data.nextSyncToken,
              lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
              calendarId,
            },
            { merge: true }
          );
        }
      } catch (err) {
        // If the sync token is invalid/expired, Google returns 410
        if (err.code === 410 || (err.response && err.response.status === 410)) {
          console.warn('[calendarWebhook] Sync token expired for calendar', calendarId, '. Clearing and doing full sync next time.');
          await syncDocRef.delete().catch(() => {});
          // Re-trigger a full sync by responding OK; on next change we will do a full pull.
          return res.status(200).send('Sync token expired - will full sync on next change');
        }
        throw err;
      }
    }

    // Process each changed event
    for (const ev of eventsToProcess) {
      const position = extractPosition(ev, defaultPositionForThisCal);

      if (ev.status === 'cancelled') {
        // Event was deleted — remove from Firestore
        if (ev.id) {
          // Use the googleEventId as the doc ID (idempotent), so delete is a direct ref
          const docRef = db.collection('events').doc(ev.id);
          const snap = await docRef.get();
          if (snap.exists) {
            await docRef.delete();
            console.log(`[calendarWebhook] Deleted event ${ev.id}`);
          }
        }
        continue;
      }

      // Normal create / update
      const ktpDoc = toKtpEventSchema(ev, position);
      ktpDoc.calendarId = calendarId;

      // Use googleEventId as the Firestore doc ID.
      // This makes all writes idempotent — concurrent webhook invocations
      // always set() the same doc rather than racing to add() duplicates.
      const docRef = db.collection('events').doc(ev.id);

      // Check existence BEFORE writing to correctly determine create vs update
      const existingSnap = await docRef.get();
      const isNew = !existingSnap.exists;

      await docRef.set(ktpDoc, { merge: true });

      console.log(`[calendarWebhook] ${isNew ? 'Created' : 'Updated'} event ${ev.id} (Name: ${ktpDoc.Name})`);
      await notifyEventChange(ktpDoc, isNew ? 'created' : 'updated');
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('[calendarWebhook] Error handling notification:', error);
    // Always return 200 to Google so it doesn't keep retrying forever on our bugs.
    // Log the error so we can investigate.
    return res.status(200).send('Error logged');
  }
};


// ---------------------------------------------------------
// renewCalendarWatches — Scheduled Cloud Function
//
// Runs every 5 days (Google watches last ~7 days max).
// Checks every doc in `calendarWatches`, and for any watch expiring within
// the next 2 days it:
//   1. Registers a fresh watch via the Google Calendar API.
//   2. Writes the new watch doc to `calendarWatches`.
//   3. Deletes the old (soon-to-expire) watch doc.
//
// This creates an infinite self-renewing cycle with no manual intervention.
//
// Schedule: every 5 days at 09:00 UTC  (cron: "0 9 */5 * *")
// ---------------------------------------------------------
const renewCalendarWatchesHandler = async (context) => {
  console.log('[renewCalendarWatches] Starting scheduled watch renewal check...');

  const WEBHOOK_URL = `https://us-central1-${effectiveProjectId}.cloudfunctions.net/calendarWebhook`;
  const RENEW_BEFORE_MS = 2 * 24 * 60 * 60 * 1000; // renew if expiring within 2 days
  const now = Date.now();

  // Build Google Calendar auth from the service account
  let auth;
  if (fs.existsSync(keyPath)) {
    auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(fs.readFileSync(keyPath, 'utf8')),
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });
  } else {
    auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });
  }
  const calendar = google.calendar({ version: 'v3', auth });
  const crypto = require('crypto');

  const watchesSnap = await db.collection('calendarWatches').get();

  if (watchesSnap.empty) {
    console.log('[renewCalendarWatches] No watches found in calendarWatches. Nothing to renew.');
    return null;
  }

  let renewed = 0;
  let skipped = 0;

  for (const doc of watchesSnap.docs) {
    const watch = doc.data();
    const expiration = Number(watch.expiration);
    const daysLeft = Math.floor((expiration - now) / 86400000);

    if (expiration - now > RENEW_BEFORE_MS) {
      console.log(`[renewCalendarWatches] Watch "${watch.key}" (${doc.id}) is fine — ${daysLeft} day(s) left. Skipping.`);
      skipped++;
      continue;
    }

    console.log(`[renewCalendarWatches] Watch "${watch.key}" (${doc.id}) expires in ${daysLeft} day(s). Renewing...`);

    try {
      const channelId = `ktp-${watch.key}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      const res = await calendar.events.watch({
        calendarId: watch.calendarId,
        requestBody: {
          id: channelId,
          type: 'web_hook',
          address: WEBHOOK_URL,
          token: watch.key,
        },
      });

      const newWatchInfo = {
        key: watch.key,
        calendarId: watch.calendarId,
        channelId,
        resourceId: res.data.resourceId,
        expiration: res.data.expiration, // ms timestamp string from Google
        webhookUrl: WEBHOOK_URL,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Write new watch doc
      await db.collection('calendarWatches').doc(channelId).set(newWatchInfo);

      // Delete the old expiring doc
      await doc.ref.delete();

      console.log(`[renewCalendarWatches] ✅ Renewed watch "${watch.key}". New channel: ${channelId}. Expires: ${new Date(Number(res.data.expiration)).toISOString()}`);
      renewed++;
    } catch (err) {
      // Log but don't throw — a single failure shouldn't block other renewals
      console.error(`[renewCalendarWatches] ❌ Failed to renew watch "${watch.key}" (${doc.id}):`, err.message || err);
    }
  }

  console.log(`[renewCalendarWatches] Done. Renewed: ${renewed}, Skipped (still valid): ${skipped}`);
  return null;
};

module.exports.calendarWebhook = exports.calendarWebhook;
module.exports.renewCalendarWatchesHandler = renewCalendarWatchesHandler;

// ---------------------------------------------------------------------------
// pollAllCalendars — callable from the scheduled pollCalendarEvents function.
// Reads every calendar in calendarTokens/main and incrementally syncs
// any changes since the last calendarSync token into Firestore `events`.
// Uses the same idempotent doc ID strategy as the webhook handler.
// ---------------------------------------------------------------------------
module.exports.pollAllCalendars = async function pollAllCalendars() {
  const configMap = await loadCalendarConfig();
  const keys = Object.keys(configMap);

  if (keys.length === 0) {
    console.log('[pollAllCalendars] No calendars configured.');
    return;
  }

  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });
  const calendar = google.calendar({ version: 'v3', auth });

  for (const key of keys) {
    const entry = configMap[key];
    if (!entry || !entry.calendarId) continue;

    const calendarId = entry.calendarId;
    const defaultPosition = Number.isFinite(Number(entry.defaultPosition)) ? Number(entry.defaultPosition) : 3;
    const syncDocId = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    const syncDocRef = db.collection('calendarSync').doc(syncDocId);
    const syncDoc = await syncDocRef.get();
    let syncToken = syncDoc.exists ? syncDoc.data().syncToken : null;

    let items = [];
    try {
      const params = { calendarId, singleEvents: true, maxResults: 250 };
      if (syncToken) {
        params.syncToken = syncToken;
      } else {
        const past = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        params.timeMin = past.toISOString();
      }

      const res = await calendar.events.list(params);
      items = res.data.items || [];

      if (res.data.nextSyncToken) {
        await syncDocRef.set({
          syncToken: res.data.nextSyncToken,
          lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
          calendarId,
        }, { merge: true });
      }
    } catch (err) {
      if (err.code === 410 || (err.response && err.response.status === 410)) {
        console.warn(`[pollAllCalendars] Sync token expired for "${key}". Clearing — will full sync next run.`);
        await syncDocRef.delete().catch(() => {});
        continue;
      }
      console.error(`[pollAllCalendars] Error polling "${key}":`, err.message || err);
      continue;
    }

    if (items.length === 0) {
      console.log(`[pollAllCalendars] "${key}" — no changes since last sync.`);
      continue;
    }

    console.log(`[pollAllCalendars] "${key}" — ${items.length} change(s) to process.`);

    for (const ev of items) {
      if (ev.status === 'cancelled') {
        if (ev.id) {
          const docRef = db.collection('events').doc(ev.id);
          const snap = await docRef.get();
          if (snap.exists) {
            await docRef.delete();
            console.log(`[pollAllCalendars] Deleted event ${ev.id}`);
          }
        }
        continue;
      }

      const position = extractPosition(ev, defaultPosition);
      const ktpDoc = toKtpEventSchema(ev, position);
      ktpDoc.calendarId = calendarId;

      const docRef = db.collection('events').doc(ev.id);
      const existingSnap = await docRef.get();
      const isNew = !existingSnap.exists;
      await docRef.set(ktpDoc, { merge: true });

      console.log(`[pollAllCalendars] ${isNew ? 'Created' : 'Updated'} event ${ev.id} (${ktpDoc.Name})`);

      // Only notify on new events from the poller to avoid spamming users
      // every 5 minutes with "updated" notifications for unchanged events
      if (isNew) {
        await notifyEventChange(ktpDoc, 'created');
      }
    }
  }
};

