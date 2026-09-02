/**
 * notifyEvent.js — Shared push notification utility (CommonJS)
 *
 * Sends Expo push notifications for calendar event changes.
 * Designed as CommonJS so it can be require()'d from:
 *   - backend/cloudFunctions/calendarWebhook/main.js  (CJS)
 *   - backend/routes/eventsRoutes.js                  (ESM via createRequire)
 *
 * Notification text:
 *   New     → "🗓 New Event"       body: "{Name} — {Day}"
 *   Updated → "📝 Event Updated"   body: "{Name} has been updated"
 *
 * Visibility rule (matches Calendar tab):
 *   userPosition >= eventPosition → eligible to receive notification
 */

const admin = require('firebase-admin');
const https = require('https');

/**
 * Send Expo push notifications for a calendar event change.
 *
 * @param {object} eventData  – KTP event doc fields (Name, Position, Day, Time, ...)
 * @param {'created'|'updated'} action
 */
async function notifyEventChange(eventData, action = 'created') {
  try {
    const db = admin.firestore();
    const eventPos = Number.isFinite(Number(eventData.Position))
      ? Number(eventData.Position)
      : 0;

    // 1. Build userId → position map from users collection
    const usersSnap = await db.collection('users').get();
    const userPositionMap = {};
    usersSnap.docs.forEach(d => {
      userPositionMap[d.id] = Number.isFinite(Number(d.data().Position))
        ? Number(d.data().Position)
        : 0;
    });

    // 2. Load all push tokens
    const tokensSnap = await db.collection('notifications').get();
    if (tokensSnap.empty) {
      console.log('[notifyEvent] No push tokens found, skipping.');
      return;
    }

    // 3. Filter: only tokens for users who can see this event (userPos >= eventPos)
    const eligibleTokens = [];
    tokensSnap.docs.forEach(d => {
      const { userID, token } = d.data();
      if (typeof token !== 'string' || !token.startsWith('ExponentPushToken')) return;
      const userPos = userPositionMap[userID];
      if (userPos === undefined) return; // orphan token — no matching user doc
      if (userPos >= eventPos) eligibleTokens.push(token);
    });

    if (eligibleTokens.length === 0) {
      console.log(`[notifyEvent] No eligible tokens for eventPos=${eventPos}. Skipping.`);
      return;
    }

    // 4. Build notification payload
    const title = action === 'created' ? '🗓 New Event' : '📝 Event Updated';
    const body  = action === 'created'
      ? [eventData.Name, eventData.Day].filter(Boolean).join(' — ')
      : `${eventData.Name || 'Event'} has been updated`;

    // 5. Fan out in batches of 100 (Expo's per-request limit)
    const BATCH_SIZE = 100;
    for (let i = 0; i < eligibleTokens.length; i += BATCH_SIZE) {
      const batch = eligibleTokens.slice(i, i + BATCH_SIZE).map(to => ({
        to,
        sound: 'default',
        title,
        body,
        badge: 1,
        data: {
          type: 'calendar_event',
          action,
          eventName: eventData.Name || '',
          day:       eventData.Day  || '',
          time:      eventData.Time || '',
        },
      }));

      const payload = JSON.stringify(batch);
      await new Promise((resolve, reject) => {
        const options = {
          hostname: 'exp.host',
          path:     '/--/api/v2/push/send',
          method:   'POST',
          headers: {
            'Content-Type':    'application/json',
            'Accept':          'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Length':  Buffer.byteLength(payload),
          },
        };

        const req = https.request(options, res => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            console.log(`[notifyEvent] Expo push batch ${Math.floor(i / BATCH_SIZE) + 1}: HTTP ${res.statusCode}`);
            resolve();
          });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
      });
    }

    console.log(`[notifyEvent] ✅ "${title}" → ${eligibleTokens.length} device(s)`);
  } catch (err) {
    console.error('[notifyEvent] Error sending push notifications:', err.message || err);
    // Never throw — notification failure must never block calendar sync or route handlers
  }
}

module.exports = { notifyEventChange };
