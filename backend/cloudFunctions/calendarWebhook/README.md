# KTP Google Calendar Webhook Cloud Function

This Cloud Function receives push notifications from the Google Calendar API (via `events.watch`) whenever Eboard updates a source calendar.

It syncs those changes into Firestore using **exactly** the same schema the KTP app already uses for events.

## Enforced Firestore Schema (`events` collection)

Every document written by this function contains these core fields (matching `backend/routes/eventsRoutes.js` and the mobile app):

| Field        | Type    | Required (from Google side) | Notes |
|--------------|---------|-----------------------------|-------|
| `Name`       | string  | Yes                         | Event title (from Google summary) |
| `Day`        | string  | Yes                         | `YYYY-MM-DD` |
| `Time`       | string  | Yes                         | Human readable (e.g. "19:00 - 21:00") |
| `Location`   | string  | Yes                         | |
| `Description`| string  | Yes                         | |
| `Position`   | number  | **No (relaxed)**            | Visibility. See "Position (relaxed)" below. |

Extra fields added by the sync layer (safe for the app to ignore):
- `source`: `"google"`
- `googleEventId`: string
- `lastSyncedAt`: Firestore Timestamp
- `calendarId`: the source calendar ID used for this sync

## Position (visibility) is intentionally relaxed

Position is **not a strict typed requirement** from the Google Calendar side.

Reason: Only Eboard will be editing the source calendar(s).

Behavior:
- The function attempts best-effort extraction.
- If nothing is found it uses the **per-calendar `defaultPosition`**.
- Hard fallback is `3` (E-board level).

Resolution order for a given event:
1. `extendedProperties.private.position` on the Google event (cleanest; set via API or advanced edit).
2. Description contains `POSITION:3`, `POS=2`, etc.
3. The `defaultPosition` configured for the calendar that sent the notification.
4. Hard fallback = `3`.

You can configure a different default per calendar (see Multi-calendar section).

## Calendar configuration stored in Firestore (`calendarTokens/main`)

The calendar map (which Google Calendar(s) to sync + per-calendar `defaultPosition`) is now loaded from:

**Firestore → `calendarTokens` → `main`**

You can store the value as a native object/map or as a JSON string. The function accepts these shapes:

- Direct map on the document
- `{ "config": { ...map... } }`
- `{ "configJson": "{ ...json string... }" }`

Example direct map (recommended):

```json
{
  "personal": { "calendarId": "primary", "defaultPosition": 3 },
  "eboard":   { "calendarId": "eboard-ktp@group.calendar.google.com", "defaultPosition": 3 }
}
```

**Why this location?**
- Easy to edit from the Firebase Console without redeploying the Cloud Function.
- Supports your workflow: start with your personal Gmail calendar for testing, later point at the official Eboard/president calendar by updating this single document + registering one extra watch.
- No environment variable changes or app updates needed when you switch calendars.

The function still falls back to `CALENDAR_CONFIGS` / `GOOGLE_CALENDAR_ID` env vars **only** if the `calendarTokens/main` document is missing or empty. Once the Firestore document exists, those env vars are unnecessary.

## Deployment (Firebase Functions v2 recommended)

1. Make sure you have the Google Calendar API enabled in the `kappa-theta` project.

2. Give the Cloud Functions service account access to **every** calendar you want to watch:
   - Share each Google Calendar (personal test, Eboard, president, etc.) with the service account email (usually `...@appspot.gserviceaccount.com` or the functions SA) using "See all event details" permission.
   - You do this once per calendar. The same service account works for all of them.

3. Configure calendars in Firestore (primary) or via environment variables (fallback).

   **Recommended: store the map in Firestore at `calendarTokens/main`.**

   You can store it as a direct map, under a `config` field, or as a JSON string in `configJson`. Example direct map:

   ```json
   {
     "personal": { "calendarId": "primary", "defaultPosition": 3 },
     "eboard":   { "calendarId": "eboard-ktp@group.calendar.google.com", "defaultPosition": 3 }
   }
   ```

   Keys become the `token` values you use when registering watches.
   `calendarId` can be `primary`, a Gmail address, or a group calendar ID.
   Each entry can have its own `defaultPosition`.

   **Fallback (local dev / CI):** set environment variables on the function:

   Single calendar:
   ```
   GOOGLE_CALENDAR_ID=primary
   DEFAULT_POSITION=3
   ```

   Multiple:
   ```
   CALENDAR_CONFIGS={"personal":{"calendarId":"primary","defaultPosition":3},"eboard":{"calendarId":"eboard-ktp@group.calendar.google.com","defaultPosition":3}}
   ```

4. Deploy the function (example using Firebase CLI):

   ```bash
   firebase deploy --only functions:calendarWebhook
   ```

   Or if using the folder structure here, you may need a small wrapper that re-exports via `onRequest`.

5. Register one or more watches.

   Call Google Calendar API `events.watch` (or a small script) for each calendar. Point `address` at the deployed HTTPS URL of the function.

   Example for your personal test calendar:
   ```json
   {
     "id": "ktp-personal-001",
     "type": "web_hook",
     "address": "https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/calendarWebhook",
     "token": "personal"
   }
   ```

   Example for the official Eboard calendar later:
   ```json
   {
     "id": "ktp-eboard-001",
     "type": "web_hook",
     "address": "https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/calendarWebhook",
     "token": "eboard"
   }
   ```

   Store the returned `resourceId` + `expiration`. You can have many watches pointing at the same function.

6. The function stores the latest `syncToken` per calendar in Firestore under:
   `calendarSync/{sanitizedKeyOrCalendarId}`

   This keeps incremental syncs separate and efficient when you have multiple calendars.

## Account and credentials (important)

**What account owns / is used for the Google Calendar?**

- You (or the current Eboard president / admin) create and manage the calendar inside Google Calendar at https://calendar.google.com using a normal Google account (your personal Gmail for testing, or a dedicated Eboard/president Google account later).
- The actual "login" to edit events happens in the normal Google Calendar web UI under that account. No special KTP account is required.

**What credentials does the Cloud Function / backend need?**

- The function uses the **Firebase Cloud Functions service account** (or the one attached to your project) via Application Default Credentials.
- It only needs **read** access to the calendar(s).
- You grant that access by **sharing each calendar** with the service account email:
  1. In Google Calendar, open the target calendar → Settings and sharing → Share with specific people.
  2. Add the service account email (look it up in the Google Cloud Console under IAM, or it is often `<project-id>@appspot.gserviceaccount.com`).
  3. Give it "See all event details" permission.
- Do this once per calendar (your personal one for testing, then the official Eboard one later). The same service account works for all of them.

You do **not** need OAuth client IDs / client secrets for the webhook path (those are for user-facing login flows). The existing Firebase service account + sharing the calendar is sufficient.

The function already requests the `https://www.googleapis.com/auth/calendar.readonly` scope.

## Notes

- The function always returns HTTP 200 to Google, even on errors (to prevent infinite retries). Check logs for problems.
- Deleted/cancelled events in Google Calendar are removed from Firestore.
- Recurring events are expanded (`singleEvents: true`) for simplicity.
- This is **one-way**: Google Calendar → Firestore. The app reads from Firestore as before.

## Local testing (fake notification)

You can invoke the function locally with a fake Google notification payload:

```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -H "x-goog-resource-state: exists" \
  -H "x-goog-channel-id: test" \
  -d '{}'
```

Then check Firestore for new/updated documents in the `events` collection.

## The Webhook URL is STATIC (very important)

**Yes — the webhook URL is the same fixed address no matter how many times you change which Google Calendar you are listening to.**

Example URL (after you deploy):

```
https://us-central1-kappa-theta.cloudfunctions.net/calendarWebhook
```

This URL:
- Does **not** change when you remove the service account from one calendar and share it with another.
- Does **not** change when you switch from your personal Gmail to the official Eboard/president calendar.
- Does **not** change when you add more calendars.

You simply:
1. Share the new calendar with the service account.
2. Update (or add to) the config in Firestore at `calendarTokens/main`.
3. Register **another watch** for that key (using `registerCalendarWatch.js`).

The function uses the `x-goog-channel-token` header + the Firestore config to decide which calendar to sync.

The only things that make the URL change are:
- Deleting the function and redeploying it with a different name
- Changing the region
- Moving to a completely different Firebase project

## Full guide: Connecting your personal Gmail calendar

See the dedicated step-by-step guide in the repo:

**`backend/CONNECT_PERSONAL_CALENDAR.md`**

It covers:
- Finding the service account email
- Sharing your personal calendar (critical step)
- Enabling the Calendar API
- Deploying the `calendarWebhook` function
- Using `registerCalendarWatch.js` with the `"personal"` key
- Testing end-to-end
- Re-registering when watches expire

Quick summary of the flow:
1. Share calendar with service account (see all event details).
2. `firebase deploy --only functions:calendarWebhook`
3. `WEBHOOK_URL=... node registerCalendarWatch.js personal`
4. Create an event in your personal Google Calendar → watch it appear in Firestore `events`.
