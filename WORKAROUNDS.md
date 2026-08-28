# Workarounds for Google Calendar → App Sync

**Status at time of writing:**  
The app is in a clean (TypeScript error-free) state.  
**No workaround has been activated or wired into the main app flow.**  
All options below are **dormant** — they are just sitting as files/scripts for review.

The user will choose after waking up.

---

## Ranked from Closest to Production → Furthest

### 1. Server-side scheduled polling (Closest to real production design)
- **Files:**
  - `backend/pollGoogleCalendars.js`
  - `.github/workflows/poll-google-calendars.yml`
- **How it works:**
  - Runs on a schedule (e.g. GitHub Actions every 10 min, or any cron/serverless).
  - Uses the service account to call Google Calendar API.
  - Uses sync tokens for incremental updates (same pattern as the intended webhook).
  - Normalizes events using the exact same schema + best-effort Position logic.
  - Writes into the unified Firestore `events` collection.
- **Production closeness:**
  - Very close. The only real difference from the ideal push webhook is that it is pull-based on a schedule instead of push on change.
  - App code stays exactly the same (just reads Firestore `events`).
- **Trade-offs:**
  - Not instant (depends on schedule).
  - Still requires a place to run the job + the service account key.
- **When to use:**
  - Primary recommendation while Cloud Function deploy is blocked by IAM.
  - Can be used long-term if push is not strictly required.

### 2. Client-direct public Google Calendar fetch (Skips Firestore reads for the calendar source)
- **File:**
  - `KTPActivities/app/utils/publicCalendar.ts`
  - Exports `fetchPublicCalendarEvents(...)`
- **How it works:**
  - The mobile app calls the public Google Calendar API directly (no backend read hop for this data).
  - Calendar must be set to "anyone with the link" (See all event details).
  - Best-effort Position extraction from description (same logic as server paths).
- **Production closeness:**
  - Reasonably close as a "no backend read" path.
  - Real production still prefers server → unified Firestore.
  - This is one of the closest alternatives when you specifically want to avoid server reads for Google events.
- **Trade-offs:**
  - Requires making the source calendar readable without auth.
  - Quota moves to the client (use a restricted browser API key).
  - Loses the single unified `events` collection for Google-sourced items unless you also keep writing via polling.
- **When to use:**
  - When you want the absolute minimum backend involvement for reading the calendar.

### 3. Manual / brute-force upload to Firestore
- **How it works:**
  - Eboard (or a script) exports or maintains events as JSON.
  - Manually (or via a tiny admin script) writes documents into the Firestore `events` collection using the existing schema (Name, Day, Time, Location, Description, Position + optional googleEventId/source).
- **Production closeness:**
  - Furthest from automated production.
  - Works, but is manual and error-prone.
- **Trade-offs:**
  - No automation.
  - Easy to get out of sync.
  - Acceptable as emergency fallback only.
- **When to use:**
  - Last resort when nothing else can run.

### 4. Making the mobile client act as a webhook receiver (Furthest / not recommended)
- **Concept:**
  - Try to have the installed app on the user's phone receive push notifications from Google Calendar (via ngrok, WebSocket tunnel, background service, etc.).
- **Why this is furthest from production:**
  - Mobile apps are not stable public HTTP endpoints.
  - iOS/Android aggressively kill background processes.
  - No reliable public address, changing networks, battery restrictions.
  - Google expects a stable, always-up HTTPS target for `events.watch`.
  - Extremely fragile, high battery drain, not maintainable.
- **Verdict:**
  - Do not pursue this path. It is architecturally wrong for production.

---

## Other Notes

- Local + ngrok route (`/calendar-webhook` mounted on the Express server in `backend/index.js`) is only a **development/testing** trick. It is not a production or even near-production solution.
- The real intended production path (already architected in the codebase) remains:
  Google Calendar → `events.watch` push to Cloud Function (`calendarWebhook`) → normalizes + writes to Firestore `events` → app reads Firestore.
- The `calendarTokens/main` Firestore document + `registerCalendarWatch.js` are designed around the push model.

---

## Files Containing Workaround Code (as of this snapshot)

- `backend/pollGoogleCalendars.js` — server-side incremental poller
- `.github/workflows/poll-google-calendars.yml` — GitHub Actions schedule for the poller
- `KTPActivities/app/utils/publicCalendar.ts` — client-direct fetch (skips Firestore reads)
- `backend/index.js` — contains a local-only `/calendar-webhook` route (dev only)
- `WORKAROUNDS.md` (this file) — ranked list for review

**Nothing above is imported or called from the main app screens yet.**

---

When you wake up, review this list and tell me which one (if any) to activate / wire up. The app is currently sitting in a clean error-free state with no workarounds enabled.
