# KTP Activities App — Master Feature & Bug-Fix Plan

**Goal:** Complete all outstanding backend/mobile work from the approved notification plan through new event-photos, hardened Alerts UI, expired-alert cleanup, header rendering bug fix, and event photo viewer with in-app camera.

**Architecture:**
- React Native (Expo SDK 52) + Expo Router, TypeScript frontend
- Firebase Cloud Functions v2 (Node/Express) backend, Firestore DB, Firebase Storage
- Push via Expo Push API (position-filtered tokens); no FCM topic subscriptions
- Google Calendar sync: webhook (fast path) + 1-min poller (safety net)
- Position map: 0=Rushees, 1=Pledges, 2=Brothers, 3=Eboard, 4=Alumni, 5=SuperAdmin

---

## EPIC 1 — Notification Pipeline Fix (Backend)

### Task 1.1 — Create `backend/utils/notifyEvent.js` (shared utility)

**Objective:** Extract `notifyEventChange` from `calendarWebhook/main.js` into a standalone CommonJS module reusable by both the CJS webhook and ESM Express routes.

**Files:** Create `backend/utils/notifyEvent.js`

```js
// CommonJS — required by calendarWebhook/main.js (CJS) and by ESM routes via createRequire
const admin = require('firebase-admin');

async function notifyEventChange(eventData, action = 'created') {
  try {
    const db = admin.firestore();
    const eventPos = Number.isFinite(Number(eventData.Position)) ? Number(eventData.Position) : 0;
    const usersSnap = await db.collection('users').get();
    const userPositionMap = {};
    usersSnap.docs.forEach(d => {
      userPositionMap[d.id] = Number.isFinite(Number(d.data().Position)) ? Number(d.data().Position) : 0;
    });
    const tokensSnap = await db.collection('notifications').get();
    if (tokensSnap.empty) return;
    const tokens = [];
    tokensSnap.docs.forEach(d => {
      const { userID, token } = d.data();
      if (!token || !token.startsWith('ExponentPushToken')) return;
      if ((userPositionMap[userID] ?? 0) >= eventPos) tokens.push(token);
    });
    if (tokens.length === 0) return;
    const title = action === 'created' ? '🗓 New Event' : '📝 Event Updated';
    const body  = action === 'created'
      ? `${eventData.Name}${eventData.Day ? ` — ${eventData.Day}` : ''}`
      : `${eventData.Name} has been updated`;
    const BATCH = 100;
    for (let i = 0; i < tokens.length; i += BATCH) {
      const msgs = tokens.slice(i, i + BATCH).map(to => ({
        to, title, body, sound: 'default',
        data: { type: 'calendar_event', eventName: eventData.Name },
      }));
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msgs),
      });
    }
    console.log(`[notifyEvent] "${title}" → ${tokens.length} token(s)`);
  } catch (err) {
    console.error('[notifyEvent] Error:', err.message || err);
  }
}

module.exports = { notifyEventChange };
```

---

### Task 1.2 — Strip notification calls from webhook handler

**Files:** Modify `backend/cloudFunctions/calendarWebhook/main.js`

1. Delete the inline `notifyEventChange` function definition (currently ~lines 60-110)
2. Add at top: `const { notifyEventChange } = require('../../utils/notifyEvent');`
3. Remove `await notifyEventChange(...)` calls inside `calendarWebhookHandler` only
4. Leave the single call in `pollAllCalendars` intact (Task 1.3 extends it)

---

### Task 1.3 — Enable "updated" notifications in poller

**Files:** Modify `backend/cloudFunctions/calendarWebhook/main.js`

```js
// BEFORE: if (isNew) { await notifyEventChange(ktpDoc, 'created'); }
// AFTER:
await notifyEventChange(ktpDoc, isNew ? 'created' : 'updated');
```

Rationale: Poller runs every 1 min with incremental sync tokens — it only touches events that actually changed, so "updated" notifs won't spam users.

---

### Task 1.4 — `POST /events` — call notifyEvent after create

**Files:** Modify `backend/routes/eventsRoutes.js`

```js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { notifyEventChange } = require('../utils/notifyEvent.js');
// After eventsCollection.add(newEvent):
notifyEventChange(newEvent, 'created').catch(e => console.error('[eventsRoute]', e.message));
```

---

### Task 1.5 — `PUT /events/:id` — call notifyEvent after update

**Files:** Modify `backend/routes/eventsRoutes.js`

```js
// After eventDoc.update(...):
notifyEventChange({ Name, Day, Time, Location, Description, Position: Number(Position ?? 0) }, 'updated')
  .catch(e => console.error('[eventsRoute] update notify:', e.message));
```

---

### Task 1.6 — Deploy

```bash
cd backend
firebase deploy --only functions:calendarWebhook,functions:pollCalendarEvents,functions:api
```

Verify in Firebase console: webhook shows NO `notifyEvent` lines; poller shows `[notifyEvent] …` on delta changes.

---

## EPIC 2 — Header Large-Title Flicker Bug

**Root cause:** `headerLargeTitle: true` + `headerTransparent: true` on iOS requires `contentInsetAdjustmentBehavior="automatic"` on the scroll container at the root level. Wrapping in `SafeAreaView` (Calendar) or a plain `View` (Alerts) breaks native scroll-offset reporting.

### Task 2.1 — Fix Calendar header flicker

**Files:** `KTPActivities/app/(tabs)/Calendar/index.tsx`

Remove `SafeAreaView` wrapper. Make `ScrollView` the root:
```tsx
<ScrollView
  style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' }}
  contentInsetAdjustmentBehavior="automatic"
>
  {/* existing content unchanged */}
</ScrollView>
```

### Task 2.2 — Fix Alerts header flicker

**Files:** `KTPActivities/app/(tabs)/Alerts/index.tsx`

Replace outer `<View><ScrollView>` with a single root:
```tsx
<ScrollView contentInsetAdjustmentBehavior="automatic" style={{ flex: 1 }}>
  {/* existing content unchanged */}
</ScrollView>
```

---

## EPIC 3 — Alerts: Hardened List UI

### Task 3.1 — Refactor AlertCard to match EventCard quality

**Files:** `KTPActivities/app/(tabs)/Alerts/index.tsx`

- Replace the flex-row (logo + text + time) layout with a rounded card mirroring `EventCard.tsx`
- Remove KTP logo image from inside cards (misaligns layout)
- Title (`AlertName`) bold large at top; description below; timestamp at bottom-right
- Edit/delete icons only visible when `isEboard`
- Dark/light theming consistent with EventCard

### Task 3.2 — Add `expireAt` field to alerts

**Files:**
- `backend/routes/alertsRoutes.js` — accept optional `expireAt` in POST body; default 30 days from now
- `KTPActivities/app/components/addAlertModal.tsx` — add optional "Expires" DateTimePicker (uses already-installed `@react-native-community/datetimepicker`)

---

## EPIC 4 — Alerts: Auto-Expiry

### Task 4.1 — `cleanExpiredAlerts` weekly Cloud Function + Firestore TTL

**Files:** Modify `backend/index.js`

```js
export const cleanExpiredAlerts = onSchedule(
  { schedule: '0 0 * * 1', region: 'us-central1', timeoutSeconds: 120, memory: '256MiB' },
  async () => {
    const now = new Date().toISOString();
    let deleted = 0;
    for (const pos of ['0','1','2','3','4','5']) {
      const snap = await db.collection('alerts').doc(pos).collection('items')
        .where('expireAt', '<', now).get();
      for (const doc of snap.docs) { await doc.ref.delete(); deleted++; }
    }
    console.log(`[cleanExpiredAlerts] Deleted ${deleted} expired alert(s)`);
  }
);
```

**Operator action (one-time):** Also enable Firestore TTL: Firebase Console → Firestore → TTL policies → Collection group `items` → Field `expireAt`. (Free, automatic, eventual consistency within ~72h.)

### Task 4.2 — Client-side expiry filter

**Files:** `KTPActivities/app/(tabs)/Alerts/index.tsx`

```ts
const now = new Date().toISOString();
const allAlerts = (response.data.data || []).filter(a => !a.expireAt || a.expireAt > now);
```

---

## EPIC 5 — Event Photos Feature

### Task 5.1 — Install `expo-camera` + update `app.config.ts`

```bash
cd KTPActivities && npx expo install expo-camera
```
Add `'expo-camera'` to `plugins` array in `app.config.ts`.

### Task 5.2 — Create `backend/routes/eventPhotosRoute.js`

Routes: `POST /event-photos` (Busboy upload → Storage → Firestore metadata), `GET /event-photos/:eventId` (list docs), `DELETE /event-photos/:eventId/:photoId`.

Firestore doc `eventPhotos/{eventId}/photos/{id}`: `downloadURL`, `storagePath`, `uploadedBy`, `uploadedAt`.

Using Firestore (not Storage list) because `onSnapshot` enables real-time gallery updates on all devices.

### Task 5.3 — Mount in `backend/index.js`

```js
app.use('/event-photos', eventPhotosRoute(db, storage));
```

### Task 5.4 — Make EventCard tappable → navigate to eventDetail

Add `onPress` prop + `TouchableOpacity` to `EventCard.tsx`. Pass handler in `Calendar/index.tsx`.

### Task 5.5 — Register `eventDetail` in Calendar `_layout.tsx`

`Stack.Screen name="eventDetail"` with dynamic `headerTitle` from route params.

### Task 5.6 — Create `PhotoGrid.tsx`

`FlatList numColumns={3}`, cell size `(screenWidth - 32) / 3`, `accessibilityRole="imagebutton"`, tap calls `onPhotoPress`, empty state message.

### Task 5.7 — Create `FullscreenImage.tsx`

Modal with black overlay, image at 90% × 90% `resizeMode="contain"`, close button top-left, tap-outside dismisses.

### Task 5.8 — Create `CameraSheet.tsx`

Animated slide-up to 75% height, `CameraView` (expo-camera SDK 52), flash toggle (off/on/auto), pinch-to-zoom via `PinchGestureHandler`, capture → preview → confirm/retake (no immediate upload on capture), upload via FormData, library picker via expo-image-picker, `onPhotoUploaded` callback.

State machine: `idle → capturing → previewing → uploading → done`

### Task 5.9 — Create `eventDetail.tsx`

Event metadata card (read-only) + "Photos (N)" header + Add button + real-time PhotoGrid via Firestore `onSnapshot` + FullscreenImage modal + CameraSheet.

### Task 5.10 — End-to-end verification

Tap EventCard → eventDetail loads; camera opens at 75%; flash/zoom work; capture → confirm → PhotoGrid updates in real time; second device sees photo within ~2s; fullscreen opens/closes at ~90%.

---

## EPIC 6 — Promote 33 Users ⏸

Create `backend/scripts/promoteUsers.js` — dry-run prints emails, then batch-update Position 0→2. Blocked on user confirmation.

---

## EPIC 7 — Git + Version 1.0.9

Structured commits per epic; version bump in `app.config.ts`.

---

## Complete Task Checklist

| # | Epic | Task | Status |
|---|------|------|--------|
| 1.1 | Notifications | Create `backend/utils/notifyEvent.js` | ⬜ |
| 1.2 | Notifications | Strip notifyEventChange from webhook | ⬜ |
| 1.3 | Notifications | Enable "updated" notifs in poller | ⬜ |
| 1.4 | Notifications | notifyEvent on POST /events | ⬜ |
| 1.5 | Notifications | notifyEvent on PUT /events/:id | ⬜ |
| 1.6 | Notifications | Deploy Cloud Functions | ⬜ |
| 2.1 | Header Bug | Fix Calendar large-title flicker | ⬜ |
| 2.2 | Header Bug | Fix Alerts large-title flicker | ⬜ |
| 3.1 | Alerts UI | Refactor AlertCard to EventCard quality | ⬜ |
| 3.2 | Alerts | Add expireAt + modal date picker | ⬜ |
| 4.1 | Expiry | cleanExpiredAlerts Cloud Function + TTL | ⬜ |
| 4.2 | Expiry | Client-side expiry filter | ⬜ |
| 5.1 | Photos | Install expo-camera + app.config.ts | ⬜ |
| 5.2 | Photos | Create eventPhotosRoute.js backend | ⬜ |
| 5.3 | Photos | Mount route in backend/index.js | ⬜ |
| 5.4 | Photos | Make EventCard tappable | ⬜ |
| 5.5 | Photos | Register eventDetail in _layout.tsx | ⬜ |
| 5.6 | Photos | Create PhotoGrid.tsx | ⬜ |
| 5.7 | Photos | Create FullscreenImage.tsx | ⬜ |
| 5.8 | Photos | Create CameraSheet.tsx | ⬜ |
| 5.9 | Photos | Create eventDetail.tsx | ⬜ |
| 5.10 | Photos | End-to-end verification | ⬜ |
| 6.1 | Users | Promote 33 Position-0 → Position-2 | ⏸ |
| 7.1 | Git | Commits + version 1.0.9 | ⬜ |

---

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| Poller-only for Google Calendar notifications | Webhook fires multiple times per change; sync token ensures only real deltas fire |
| notifyEvent.js as CommonJS | calendarWebhook/main.js is CJS; ESM routes use createRequire (existing pattern) |
| Firestore for photo metadata | onSnapshot = real-time gallery; Storage list() has no realtime |
| Dual expiry (Firestore TTL + Cloud Function) | TTL free/automatic; Cloud Function covers 72h TTL propagation window |
| contentInsetAdjustmentBehavior="automatic" | Idiomatic iOS fix for large-title + transparent header + ScrollView |
| expo-camera CameraView | Embedded live viewfinder; ImagePicker opens full system camera UI |
| 30-day default expireAt | Reasonable for announcements; overridable per alert |

---

## Operator Actions (Non-Code)

1. **Firestore TTL:** Firebase Console → Firestore → TTL policies → Collection group `items` → field `expireAt`
2. **Promote 33 users:** Confirm list before running script (Task 6.1)
3. **Storage CORS (web only, if needed):** `gsutil cors set cors.json gs://<project>.appspot.com`
