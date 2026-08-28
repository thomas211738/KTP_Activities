# Connecting Your Personal Gmail Calendar to the KTP App

This guide walks you through connecting **your personal Google Calendar** so that events you create/edit there automatically flow into the app's Firestore `events` collection (via the Cloud Function webhook).

Current Firestore config (already seeded):

```json
{
  "personal": {
    "calendarId": "primary",
    "defaultPosition": 3
  },
  "eboard": {
    "calendarId": "eboard-ktp@group.calendar.google.com",
    "defaultPosition": 3
  }
}
```

You will use the `"personal"` entry for your own Gmail calendar.

---

## Step 0: Prerequisites

- You have the Firebase project `kappa-theta` set up.
- You have `backend/serviceAccountKey.json` on your machine.
- You have run the seed script at least once (`node seedCalendarConfig.js`).

---

## Step 1: Find the Service Account Email (one time)

Run this command:

```bash
cd backend
node -e '
  const key = require("./serviceAccountKey.json");
  console.log("Service account email to share with:");
  console.log(key.client_email);
'
```

You should see something like:

```
firebase-adminsdk-qa0k1@kappa-theta.iam.gserviceaccount.com
```

**Copy this email.** You will need it in the next step.

---

## Step 2: Share Your Personal Calendar with the Service Account

This is the most important step.

1. Go to [https://calendar.google.com](https://calendar.google.com) and log in with the **personal Gmail account** whose calendar you want to sync.
2. On the left sidebar, find your calendar under "My calendars".
3. Hover over it → click the three dots → **Settings and sharing**.
4. Scroll down to **Share with specific people**.
5. Click **Add people**.
6. Paste the service account email you copied in Step 1.
7. Give it the permission: **See all event details**.
8. Click **Send**.

> Do **not** give it "Make changes" unless you want the function to be able to write back later (not currently supported).

Repeat this step later when you switch to the official Eboard calendar.

---

## Step 3: Make Sure Google Calendar API Is Enabled

1. Go to the Google Cloud Console: https://console.cloud.google.com
2. Make sure you are in the **kappa-theta** project.
3. In the left menu go to **APIs & Services → Library**.
4. Search for "Google Calendar API".
5. If it says "Enable", click it. If it already says "Manage", you're good.

---

## Step 4: Deploy the Calendar Webhook Cloud Function

The function must be deployed before you can register a watch.

Currently the project exports it as `calendarWebhook` (see `backend/index.js`).

Run:

```bash
cd backend

# Make sure you have firebase CLI and are logged in
firebase login

# Deploy ONLY the calendar webhook (not the whole Express API)
firebase deploy --only functions:calendarWebhook
```

After it finishes, you will see output like:

```
calendarWebhook(us-central1): https://us-central1-kappa-theta.cloudfunctions.net/calendarWebhook
```

**Copy that full HTTPS URL.** This is the address Google will call.

You can also find it later in the Firebase Console → Functions.

---

## Step 5: Register a Watch for Your Personal Calendar

We provide a helper script: `backend/registerCalendarWatch.js`

It reads the config from Firestore (`calendarTokens/main`) so it knows to use `"primary"` for the `"personal"` key.

### First time setup (simplified)

The webhook URL is now a **static value** defined in `backend/config.js`.

You no longer need to pass the URL when running the script:

```bash
cd backend

# Just run it — it reads the static URL from config.js
node registerCalendarWatch.js personal
```

You can still override if you ever need to (e.g. testing a different deployment):

```bash
cd backend
CALENDAR_WEBHOOK_URL="https://..." node registerCalendarWatch.js personal
```

You should see output similar to:

```
✅ Watch registered successfully!
...
resourceId = xxxxx...
```

Google will also send an initial "sync" notification to the function.

---

## Step 6: Test It

1. Go to your personal Google Calendar.
2. Create a new event (or edit an existing one).
3. Wait 30–90 seconds.
4. Check Firestore → `events` collection.

You should see a new document with:
- `source: "google"`
- `googleEventId: ...`
- `calendarId: "primary"`
- The normal fields (Name, Day, Time, Location, Description, Position: 3)

You can also check the Cloud Function logs:

```bash
firebase functions:log --only calendarWebhook
```

---

## Step 7: (Optional but recommended) Save the Watch Info

The `registerCalendarWatch.js` script already saves the watch details to:

`Firestore → calendarWatches → {channelId}`

This is useful because watches expire (usually after ~1 month). You can later write a small renewal script or re-run the registration.

---

## Common Gotchas

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| 401 / 403 when registering watch | Service account does not have access | Re-check Step 2 (share calendar) |
| Calendar API not enabled | Google Calendar API disabled in project | Enable it in Cloud Console |
| "Channel id not unique" | You reused the same channel id | The script generates a new one each time |
| No events appearing | Watch not registered or wrong URL | Re-deploy + re-register |
| Events stop after a month | Watch expiration | Re-run the registration script |
| Using "primary" with service account | Works only because you shared the calendar | Always share first |

---

## Later: Switching to the Official Eboard Calendar (or any other calendar)

**Yes — the webhook URL is completely static and does not change.**

It does **not** change when you:
- Switch which Google Calendar is the source
- Remove the service account email from one calendar and add it to a different Google Calendar
- Add more calendars (personal, eboard, president, etc.)
- Change the `calendarId` values in Firestore

The exact same deployed function URL is reused for **every** calendar you want to listen to.

### Complete steps when changing the calendar (beyond just sharing the service account)

In addition to inviting/sharing the service account email with the new Google Calendar (with "See all event details"), you must do the following:

1. **Ensure the calendar is listed in Firestore** at `calendarTokens/main`

   The function reads from here to know:
   - Which `calendarId` to query when it receives a push for a given token
   - What `defaultPosition` to use

   Current example (already seeded):
   ```json
   {
     "personal": { "calendarId": "primary", "defaultPosition": 3 },
     "eboard":   { "calendarId": "eboard-ktp@group.calendar.google.com", "defaultPosition": 3 }
   }
   ```

   Edit this document in the Firebase Console (or re-run `node seedCalendarConfig.js` after modifying it) when you want to:
   - Add a new calendar
   - Change a `calendarId`
   - Change a `defaultPosition`

2. **Register a new watch** for the new calendar key

   This is the step that actually tells Google Calendar:
   > "Send push notifications for this calendar to my webhook."

   Run (using the key you defined in `calendarTokens/main`):

   ```bash
   cd backend

   # For the eboard calendar
   node registerCalendarWatch.js eboard

   # Or for any other key you added
   node registerCalendarWatch.js president
   ```

   This calls Google’s `events.watch` API with:
   - `address` = the static webhook URL (from `backend/config.js`)
   - `token` = the key (`"eboard"`, etc.) → Google will send this back as `x-goog-channel-token`

3. **(Only if you changed Cloud Function code)** Redeploy

   ```bash
   firebase deploy --only functions:calendarWebhook
   ```

   You usually do **not** need to redeploy just to point at a different calendar.

4. **Test**

   - Create or edit an event on the new Google Calendar.
   - Wait 30–90 seconds.
   - Check the Firestore `events` collection (look for `source: "google"` and the matching `calendarId`).
   - Check logs: `firebase functions:log --only calendarWebhook`

### Summary of what each piece does

| Action                              | What it actually does                                                                 | Required when switching calendars? |
|-------------------------------------|---------------------------------------------------------------------------------------|------------------------------------|
| Share calendar with service account | Grants the Cloud Function read access to that Google Calendar                         | Yes                                |
| Edit `calendarTokens/main`          | Tells the webhook "when I get a push with this token, use this calendarId + position" | Yes                                |
| `node registerCalendarWatch.js KEY` | Subscribes with Google: "notify my webhook when this calendar changes"                | Yes                                |
| Redeploy function                   | Updates the running Cloud Function code                                               | Only if you changed code           |

You can keep multiple watches active at the same time (personal + eboard + others). They all point to the same static webhook URL.

**Important clarification about the service account + multiple calendars:**

- Simply inviting/sharing the service account with many calendars is **not enough** by itself.
- The service account must be shared with each calendar (for read access).
- **AND** you must explicitly register a watch for each calendar you want to sync (using `registerCalendarWatch.js <key>`).
- The function does **not** automatically discover and pull from every calendar the service account can see. You control exactly which calendars are synced via the entries in `calendarTokens/main` + the registered watches.

All events from all registered calendars are written into the same Firestore `events` collection (they are tagged with `source: "google"` and `calendarId`).

Watches expire after roughly a month. When they do, just re-run the `registerCalendarWatch.js` command for that key.

---

## Quick Commands Cheat Sheet

```bash
# Share step is manual in Google Calendar UI

# Deploy
firebase deploy --only functions:calendarWebhook

# Register personal watch
# (URL is now static in backend/config.js — no need to pass it)
node registerCalendarWatch.js personal

# View logs
firebase functions:log --only calendarWebhook

# Check current config
node -e '
  const admin = require("firebase-admin");
  const fs = require("fs");
  admin.initializeApp({credential: admin.credential.cert("./serviceAccountKey.json")});
  admin.firestore().collection("calendarTokens").doc("main").get()
    .then(s => console.dir(s.data()));
'
```

---

You now have everything needed to connect your personal Gmail calendar for testing.

When you're ready for the official Eboard calendar, just repeat Steps 2 + 5 with the `"eboard"` key.

---

## Workarounds while you cannot deploy the Cloud Function (IAM restriction)

The current blocker is an IAM permission (`cloudfunctions.functions.setIamPolicy`) on your personal account. This is independent of the service account key and the calendar sharing you already did.

Here are practical workarounds you can use **immediately**:

### 1. Polling script (recommended right now)

We created `backend/pollGoogleCalendars.js`.

It reads the exact same `calendarTokens/main` document you just updated and syncs events into the **same** Firestore `events` collection the app uses.

```bash
cd backend

# Sync everything configured (personal + eboard)
node pollGoogleCalendars.js

# Or just the one you changed
node pollGoogleCalendars.js personal
```

Run this manually, or put it on a schedule (cron, GitHub Action, Railway cron, etc.).

This is reliable and does not require any public URL or tunnel.

### 2. Local server + ngrok (closer to real-time)

We also mounted the webhook handler locally at `/calendar-webhook`.

1. Start your backend locally:
   ```bash
   cd backend
   node index.js
   ```

2. Expose it:
   ```bash
   npx ngrok http 5000
   ```

3. Copy the https ngrok URL and register the watch:
   ```bash
   CALENDAR_WEBHOOK_URL="https://YOUR-NGROK-URL.ngrok.io/calendar-webhook" \
   node registerCalendarWatch.js personal
   ```

4. Keep the local server + ngrok running while you test.

Google will POST to the ngrok URL → your local handler → Firestore.

### 3. Ask someone else to deploy once

If another person on the project has "Cloud Functions Admin" (or sufficient rights), have them run:

```bash
cd backend
npx firebase deploy --only functions:calendarWebhook
```

After that one successful deploy, the static URL will exist and you can register watches normally going forward.

### Switching back to the real push webhook later

Once you get the deploy permission, just run:

```bash
cd backend
npx firebase deploy --only functions:calendarWebhook
node registerCalendarWatch.js personal
```

No code changes are needed. The polling script and local route are explicitly temporary.
