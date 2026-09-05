/**
 * notifyAlert.cjs — Push notification utility for alerts (CommonJS)
 *
 * Sends Expo push notifications when an Eboard member posts a new alert.
 * Mirrors the pattern in notifyEvent.cjs.
 *
 * Visibility rule (matches Alerts tab):
 *   The alert's Position field means "visible to users at this position and above."
 *   So userPosition >= alertPosition → eligible to receive notification.
 *
 * Notification text:
 *   "🔔 New Alert"  body: "{AlertName}"
 */

const admin = require('firebase-admin');
const https = require('https');

/**
 * Send Expo push notifications for a new alert.
 *
 * @param {object} alertData  – { AlertName, Description, Position }
 */
async function notifyAlertCreated(alertData) {
  try {
    const db = admin.firestore();
    const alertPos = Number.isFinite(Number(alertData.Position))
      ? Number(alertData.Position)
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
      console.log('[notifyAlert] No push tokens found, skipping.');
      return;
    }

    // 3. Filter: only tokens for users who can see this alert (userPos >= alertPos)
    const eligibleTokens = [];
    tokensSnap.docs.forEach(d => {
      const { userID, token } = d.data();
      if (typeof token !== 'string' || !token.startsWith('ExponentPushToken')) return;
      const userPos = userPositionMap[userID];
      if (userPos === undefined) return;
      if (userPos >= alertPos) eligibleTokens.push(token);
    });

    if (eligibleTokens.length === 0) {
      console.log(`[notifyAlert] No eligible tokens for alertPos=${alertPos}. Skipping.`);
      return;
    }

    // 4. Build notification payload
    const title = '🔔 New Alert';
    const body = alertData.AlertName || 'New alert posted';

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
          type: 'alert',
          alertName: alertData.AlertName || '',
          description: alertData.Description || '',
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
            console.log(`[notifyAlert] Expo push batch ${Math.floor(i / BATCH_SIZE) + 1}: HTTP ${res.statusCode}`);
            resolve();
          });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
      });
    }

    console.log(`[notifyAlert] ✅ "${title}" → ${eligibleTokens.length} device(s)`);
  } catch (err) {
    console.error('[notifyAlert] Error sending push notifications:', err.message || err);
    // Never throw — notification failure must never block the alert POST response
  }
}

module.exports = { notifyAlertCreated };
