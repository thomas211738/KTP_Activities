#!/usr/bin/env python3
"""
Temporary test script — pings the deployed calendarWebhook Cloud Function
with a fake Google Calendar push notification payload.

What this does:
  1. POSTs a fake "exists" notification to the deployed function URL
     (same headers Google sends when a calendar event changes).
  2. Prints the HTTP status + response body.
  3. Optionally checks the backend /events endpoint to confirm
     that events were synced into Firestore and are visible via the API.

Usage:
    cd backend
    python3 ping_calendar_webhook.py

    # Override the function URL (e.g. when testing locally via ngrok):
    WEBHOOK_URL=https://YOUR-NGROK-URL.ngrok.io/calendar-webhook python3 ping_calendar_webhook.py

    # Override the backend URL to check /events:
    BACKEND_URL=http://localhost:5001 python3 ping_calendar_webhook.py

Dependencies (stdlib only — no pip install needed):
    urllib.request, json, os, sys

The webhook always returns HTTP 200 even on errors (to stop Google retries),
so also check Firebase Functions logs for deeper debugging:
    firebase functions:log --only calendarWebhook
"""

import json
import os
import sys
import urllib.request
import urllib.error

# ---------------------------------------------------------------------------
# Configuration — override with environment variables
# ---------------------------------------------------------------------------

# Deployed Cloud Function URL (static — does not change when switching calendars)
WEBHOOK_URL = os.environ.get(
    "WEBHOOK_URL",
    "https://us-central1-kappa-theta.cloudfunctions.net/calendarWebhook",
)

# Backend Express API URL (for the follow-up /events check)
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:5001")

# The channel token — must match a key in Firestore calendarTokens/main
# ("personal" or "eboard").  Google sends this back in x-goog-channel-token.
CHANNEL_TOKEN = os.environ.get("CHANNEL_TOKEN", "personal")

# ---------------------------------------------------------------------------
# Fake notification headers — mirrors what Google Calendar actually sends
# ---------------------------------------------------------------------------
FAKE_HEADERS = {
    "Content-Type":              "application/json",
    "x-goog-channel-id":         f"test-ping-{CHANNEL_TOKEN}-001",
    "x-goog-resource-state":     "exists",
    "x-goog-resource-id":        "fake-resource-id-for-testing",
    "x-goog-resource-uri":       "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    "x-goog-channel-token":      CHANNEL_TOKEN,
    "x-goog-channel-expiration": "Sat, 01 Jan 2028 00:00:00 GMT",
}


# ---------------------------------------------------------------------------
# Helper: HTTP POST (stdlib only)
# ---------------------------------------------------------------------------
def post(url, headers, body=b"{}"):
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")
    except urllib.error.URLError as e:
        return 0, str(e.reason)


# ---------------------------------------------------------------------------
# Helper: HTTP GET (stdlib only)
# ---------------------------------------------------------------------------
def get(url):
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")
    except urllib.error.URLError as e:
        return 0, str(e.reason)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 65)
    print("KTP Calendar Webhook — Ping Test")
    print("=" * 65)
    print(f"  Webhook URL  : {WEBHOOK_URL}")
    print(f"  Channel token: {CHANNEL_TOKEN}  (-> calendarTokens/main[\"{CHANNEL_TOKEN}\"])")
    print(f"  Backend URL  : {BACKEND_URL}")
    print()

    # ------------------------------------------------------------------
    # Step 1: Fake SYNC notification (Google sends this on watch creation)
    # ------------------------------------------------------------------
    print("-- Step 1: SYNC notification (resourceState=sync) --")
    sync_headers = {**FAKE_HEADERS, "x-goog-resource-state": "sync"}
    status, body = post(WEBHOOK_URL, sync_headers)
    print(f"  HTTP {status}  ->  {body!r}")
    print("  OK" if status == 200 else f"  WARNING: Unexpected status {status}")
    print()

    # ------------------------------------------------------------------
    # Step 2: Fake EXISTS notification (triggers calendar pull + Firestore write)
    # ------------------------------------------------------------------
    print("-- Step 2: EXISTS notification (resourceState=exists) --")
    print("   (triggers Google Calendar API call + Firestore upsert)")
    status, body = post(WEBHOOK_URL, FAKE_HEADERS)
    print(f"  HTTP {status}  ->  {body!r}")
    print("  OK" if status == 200 else f"  WARNING: Unexpected status {status}")
    print()

    # ------------------------------------------------------------------
    # Step 3: Check /events endpoint (reads Firestore `events` collection)
    # ------------------------------------------------------------------
    print("-- Step 3: GET /events from backend --")
    events_url = f"{BACKEND_URL}/events"
    print(f"  GET {events_url}")
    status, body = get(events_url)
    print(f"  HTTP {status}")

    if status == 200:
        try:
            data = json.loads(body)
            events = data.get("data", data) if isinstance(data, dict) else data
            count = len(events) if isinstance(events, list) else "?"
            print(f"  {count} event(s) returned from Firestore")
            if isinstance(events, list) and len(events) > 0:
                print()
                print("  First event:")
                first = events[0]
                for field in ("Name", "Day", "Time", "Location", "Description",
                              "Position", "source", "googleEventId"):
                    print(f"    {field:20s}: {first.get(field, '<not set>')}")
        except json.JSONDecodeError:
            print(f"  Could not parse JSON: {body[:200]!r}")
    elif status == 0:
        print(f"  Could not reach backend. Start it with:  cd backend && node index.js")
    else:
        print(f"  HTTP {status} error: {body[:200]!r}")

    print()
    print("=" * 65)
    print("Done.")
    print()
    print("Watch live Cloud Function logs:")
    print("  cd backend && firebase functions:log --only calendarWebhook")
    print()
    print("Force a full re-sync (polling workaround, no deploy needed):")
    print("  cd backend && node pollGoogleCalendars.js personal")
    print("=" * 65)
    return 0


if __name__ == "__main__":
    sys.exit(main())

