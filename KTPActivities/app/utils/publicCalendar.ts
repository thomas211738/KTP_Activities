/**
 * Direct public Google Calendar fetcher (client-side).
 *
 * This is the "Firestore population alternative" using a direct Google API call
 * from the mobile client. No backend hop for the calendar data.
 *
 * Key behaviors requested:
 * - Calendar configuration (calendarId + defaultPosition) lives in Firestore
 *   at calendarTokens/main so it can be updated without rebuilding the app.
 * - Client reads that config on app launch.
 * - Fetch from Google Calendar API happens **once per cold app launch**
 *   (when the app was previously closed, not just backgrounded).
 * - Works in both local dev builds and production EAS builds.
 *
 * Config shape (same as backend):
 *   Direct map (recommended):
 *     { "personal": { calendarId: "...", defaultPosition: 3 }, "eboard": { ... } }
 *     "personal" is the default profile.
 *   Or wrapped: { config: { ... } } or { configJson: "..." }
 *
 * The client picks the first entry (or a preferred key) and uses it.
 *
 * For production:
 *   - The calendar should be public ("anyone with the link" + "See all event details").
 *   - You can optionally supply a restricted Google API key via env (GOOGLE_CALENDAR_API_KEY).
 *
 * Default profile: "personal" (as requested).
 * The loader always prefers the "personal" key when it exists.
 *
 * Example Firestore calendarTokens/main (with your public calendar):
 * {
 *   "personal": {
 *     "calendarId": "16ecd22691fb3acae84743f9484a65e405ef525c85763ea23316f565b217b06b@group.calendar.google.com",
 *     "defaultPosition": 3
 *   }
 * }
 */

export type PublicCalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
  position?: number;
};

// ------------------------------------------------------------------
// Static top-level imports for react-native-dotenv
// This is the ONLY safe way to use the plugin.
// The Babel transform replaces these with literal values at build time.
// Dynamic require('@env') or dynamic import inside functions will
// cause Metro to try to bundle the dotenv package, which does
// `require('fs')` at the top level → the error the user is seeing.
// ------------------------------------------------------------------
import {
  GOOGLE_CALENDAR_ID,
  DEFAULT_POSITION,
  GOOGLE_CALENDAR_API_KEY,
} from '@env';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isProduction } from '../config';

// Production log guards (centralized for this module).
// Use these instead of raw console.* so that prod bundles are quiet by default.
const devLog = (...args: any[]) => { if (!isProduction) console.log(...args); };
const devWarn = (...args: any[]) => { if (!isProduction) console.warn(...args); };
// Keep real errors visible (they are useful in crash reports), but never put secrets in them.
const prodError = (...args: any[]) => { console.error(...args); };

const CALENDAR_CACHE_KEY = '@ktp_direct_calendar_events_v1';
const RAW_CALENDAR_CACHE_KEY = '@ktp_direct_calendar_events_raw_v1';

async function loadCalendarCache(): Promise<KtpCalendarEvent[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CALENDAR_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function saveCalendarCache(events: KtpCalendarEvent[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CALENDAR_CACHE_KEY, JSON.stringify(events));
  } catch {
    // ignore cache write errors
  }
}

async function loadRawCalendarCache(): Promise<any[] | null> {
  try {
    const raw = await AsyncStorage.getItem(RAW_CALENDAR_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function saveRawCalendarCache(rawEvents: any[]): Promise<void> {
  try {
    await AsyncStorage.setItem(RAW_CALENDAR_CACHE_KEY, JSON.stringify(rawEvents));
  } catch {
    // ignore cache write errors
  }
}

export type KtpCalendarEvent = {
  id: string;
  Name: string;
  Day: string;
  Time: string;
  Location: string;
  Description: string;
  Position: number;
  source?: 'google-direct';
  googleEventId?: string;
};

/**
 * NOTE on partial schema support (per product requirement):
 * - Title (Name) is MANDATORY. If a Google event has no summary/title, it is dropped (mapper returns null).
 * - All other fields are allowed to be empty strings when the source data does not provide them.
 *   The UI renders only the pieces that are present.
 */

export type FetchPublicCalendarOptions = {
  calendarId: string;
  apiKey?: string;
  maxResults?: number;
  timeMin?: string;
  timeMax?: string;
  defaultPosition?: number;
};

/**
 * Position now comes **only** from the Firebase config document.
 *
 * calendarTokens/main  (the chosen profile, e.g. "personal".defaultPosition)
 *
 * We deliberately do NOT read Position from:
 *   - the Google event's extendedProperties
 *   - the Google event's description (no more POSITION: or POS: tags)
 *   - anywhere inside the raw Google Calendar event
 *
 * Every event fetched for a calendar receives the exact same Position value
 * (the defaultPosition stored for that calendar profile in Firestore).
 */
export function getPositionFromConfig(defaultPosition: any): number {
  const n = Number(defaultPosition);
  return Number.isFinite(n) ? n : 3;
}

/**
 * =================================================================================
 * PER-EVENT POSITION OVERRIDE (SECOND RULE) — Production-safe, simple string logic
 * =================================================================================
 *
 * PRIMARY rule (always applied first):
 *   Position for the calendar = defaultPosition from Firestore document:
 *     calendarTokens / main   (under "personal" or the profile you use)
 *
 * SECOND rule (applied at mapping time, can override the primary for one event):
 *   You can put a Position tag **in the Description** of a Google Calendar event.
 *
 * WHERE TO PUT THE TAG (when creating the event in Google Calendar):
 *   - Edit the event
 *   - Put it **anywhere in the Description** field (top or bottom is fine).
 *
 * Recommended (very tolerant):
 *   Position: 2
 *   Pos:1
 *   POSITION = 0
 *   pos  2
 *   visibility pos: 3
 *
 * String parsing rules (no regex, only indexOf / split / replace / trim):
 *   - Case insensitive
 *   - Tolerates spaces around ":", "=", and the number
 *   - If the word "position" or "pos" appears and a clean number follows → use that number
 *     (overrides the calendar defaultPosition from Firestore for this single event)
 *   - If "position" / "pos" appears but the value is missing or not a valid number
 *     (examples of bad: "Positoin: 2", "Position foo", "Pos:", "Position=", "Position  abc")
 *     → the event is **dropped** (never rendered). This is intentional and strict.
 *   - If no "position" or "pos" keyword at all → fall back to the calendar defaultPosition.
 *
 * This is the simplest, least error-prone approach:
 *   - One place to control the whole calendar (Firestore)
 *   - Optional fine-grained override per event in the Google description
 *   - Misspelled keywords cause the event to be filtered (fail-closed)
 *
 * Put the tag only in the **Description**. Do not rely on title, location, or extended properties.
 */
export type PerEventPositionResult =
  | { type: 'use'; value: number }   // valid tag found → use this (overrides calendar default)
  | { type: 'malformed' }            // keyword seen but no valid number → DROP the event
  | { type: 'none' };                // no keyword → use calendar defaultPosition

/**
 * Pure string-based parser for the per-event Position override (Rule 2).
 *
 * NO regex is used anywhere in this function (indexOf, slice, charAt, loops, trim only).
 * This is the most efficient and least error-prone approach for this requirement.
 *
 * Placement:
 *   Put the tag inside the Google Calendar event's **Description** field (anywhere).
 *   Recommended forms (all accepted, spacing tolerant):
 *     Position: 2
 *     Pos: 1
 *     pos = 0
 *     POSITION  =  3
 *     visibility pos : 2
 *
 * Behavior (strict fail-closed):
 *   - No keyword ("position" or whole-word "pos") anywhere → 'none' (use calendar defaultPosition)
 *   - Keyword present + clean number after it (tolerating : = and spaces) → 'use', value
 *   - Keyword present but value missing / not a number / keyword misspelled → 'malformed' (DROP the event)
 */
export function parsePerEventPositionTag(description: string | null | undefined): PerEventPositionResult {
  if (!description || typeof description !== 'string') return { type: 'none' };

  const lower = description.toLowerCase();

  // Collect start indexes of candidate keywords using only indexOf + manual word-boundary checks.
  const starts: number[] = [];

  // "position" (full word)
  let idx = lower.indexOf('position');
  while (idx !== -1) {
    const before = idx === 0 ? ' ' : lower.charAt(idx - 1);
    const afterPos = idx + 8 < lower.length ? lower.charAt(idx + 8) : ' ';
    const isWordStart = !isLetter(before);
    const isWordEnd = !isLetter(afterPos);
    if (isWordStart && isWordEnd) {
      starts.push(idx);
    }
    idx = lower.indexOf('position', idx + 1);
  }

  // whole-word "pos" (not part of "position", "possible", etc.)
  idx = lower.indexOf('pos');
  while (idx !== -1) {
    const before = idx === 0 ? ' ' : lower.charAt(idx - 1);
    const afterPos = idx + 3 < lower.length ? lower.charAt(idx + 3) : ' ';
    const isWordStart = !isLetter(before);
    const isWordEnd = !isLetter(afterPos);
    if (isWordStart && isWordEnd) {
      // Make sure we didn't already count this as part of "position"
      // (if "position" started here the previous loop would have caught the longer match first,
      // but we still push; duplicate starts are harmless because we process in order).
      starts.push(idx);
    }
    idx = lower.indexOf('pos', idx + 1);
  }

  if (starts.length === 0) return { type: 'none' };

  // Sort so we evaluate leftmost occurrences first (predictable).
  starts.sort((a, b) => a - b);

  for (const start of starts) {
    const isFullPosition = lower.startsWith('position', start);
    const keywordLen = isFullPosition ? 8 : 3;

    // Text immediately after the keyword
    let rest = lower.slice(start + keywordLen);

    // Skip any run of separators and whitespace: space, tab, :, =, newline, carriage return
    let j = 0;
    while (j < rest.length) {
      const ch = rest.charAt(j);
      if (ch === ' ' || ch === '\t' || ch === ':' || ch === '=' || ch === '\n' || ch === '\r') {
        j += 1;
        continue;
      }
      break;
    }
    rest = rest.slice(j);

    // Collect a "number token": optional sign, digits, at most one '.', more digits.
    // Stop at first non-number character. No regex.
    if (rest.length === 0) {
      return { type: 'malformed' };
    }

    let k = 0;
    const first = rest.charAt(0);
    if (first === '+' || first === '-') k += 1;

    let seenDot = false;
    let hasDigit = false;
    while (k < rest.length) {
      const ch = rest.charAt(k);
      if (ch >= '0' && ch <= '9') {
        hasDigit = true;
        k += 1;
        continue;
      }
      if (ch === '.' && !seenDot) {
        seenDot = true;
        k += 1;
        continue;
      }
      break;
    }

    const token = rest.slice(0, k).trim();

    if (!token || !hasDigit) {
      return { type: 'malformed' }; // keyword present, but no usable number value
    }

    const num = parseFloat(token);
    if (Number.isFinite(num)) {
      return { type: 'use', value: num };
    }

    return { type: 'malformed' };
  }

  return { type: 'malformed' };
}

// Small helper: ASCII letter check without regex or locale issues.
function isLetter(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
}

// NOTE: The legacy extractPosition (regex) is intentionally left but NEVER called from the active
// Google-direct paths. All Rule 2 parsing goes through parsePerEventPositionTag (pure string ops).
// If this function is ever reached in prod, it is a bug — do not wire it into mapping.

/**
 * Client-side schema mapper.
 *
 * Position comes **only** from the Firebase config:
 *   calendarTokens/main  →  chosen profile (e.g. "personal").defaultPosition
 *
 * We deliberately ignore anything that might be inside the Google event:
 *   - extendedProperties.private.position
 *   - POSITION: / POS: tags in the description
 *   - any other per-event data
 *
 * Every Google-direct event for the calendar gets exactly the same Position
 * (the value stored for that calendar in Firestore).
 *
 * - If an event has only partial data, we still render what we have.
 * - **Hard requirement**: every event MUST have a non-empty title (Name).
 *   If no title, the mapper returns `null` and the caller must drop the event.
 *
 * Output shape (when valid):
 *   { id, Name, Day, Time, Location, Description, Position, source: 'google-direct', googleEventId }
 */
export function mapGoogleEventToKtpSchema(googleEvent: any, defaultPositionFromConfig: number = 3): KtpCalendarEvent | null {
  const calendarPos = getPositionFromConfig(defaultPositionFromConfig);

  // Tolerate already-mapped items (old caches) — still apply per-event rule for safety
  if (googleEvent && (googleEvent.Name || googleEvent.source === 'google-direct')) {
    const candidateName = (googleEvent.Name || googleEvent.summary || '').toString().trim();
    if (!candidateName) {
      return null; // title is mandatory
    }

    // Apply second rule even on cached mapped items
    const perEvent = parsePerEventPositionTag(googleEvent.Description || googleEvent.description);
    let finalPos = calendarPos;

    if (perEvent.type === 'malformed') {
      return null; // malformed tag → drop
    }
    if (perEvent.type === 'use') {
      finalPos = perEvent.value;
    }

    return {
      id: googleEvent.id || googleEvent.googleEventId || String(Date.now()),
      Name: candidateName,
      Day: googleEvent.Day || '',
      Time: googleEvent.Time || '',
      Location: googleEvent.Location || googleEvent.location || '',
      Description: googleEvent.Description || googleEvent.description || '',
      Position: finalPos,
      source: 'google-direct',
      googleEventId: googleEvent.googleEventId || googleEvent.id,
    };
  }

  // Raw Google item path — most common
  const perEvent = parsePerEventPositionTag(googleEvent?.description);

  if (perEvent.type === 'malformed') {
    // Keyword present but bad value / misspelled → drop the event (strict)
    return null;
  }

  const finalPosition = perEvent.type === 'use' ? perEvent.value : calendarPos;

  return toKtpEvent(googleEvent, finalPosition);
}

/**
 * Convert a raw Google Calendar API event item to the KTP app schema.
 * (This is the direct port of the transformation that lived in the Cloud Function.)
 *
 * Partial data is allowed for optional fields (Day/Time/Location/Description can be empty).
 * However: if there is no usable title (summary), we return null — the event must NOT be rendered.
 */
function toKtpEvent(googleEvent: any, position: number): KtpCalendarEvent | null {
  const rawName = (googleEvent?.summary || '').toString().trim();
  if (!rawName) {
    // Hard requirement from user: every rendered event must have a title.
    // If no title, drop the event entirely (do not render it).
    return null;
  }

  let day = '';
  if (googleEvent?.start?.date) {
    day = googleEvent.start.date;
  } else if (googleEvent?.start?.dateTime) {
    day = googleEvent.start.dateTime.split('T')[0];
  }

  let time = '';
  const start = googleEvent?.start?.dateTime || googleEvent?.start?.date;
  const end = googleEvent?.end?.dateTime || googleEvent?.end?.date;

  if (start && end) {
    const startStr = start.includes('T') ? start.split('T')[1]?.substring(0, 5) : 'All day';
    const endStr = end.includes('T') ? end.split('T')[1]?.substring(0, 5) : '';
    time = endStr ? `${startStr} - ${endStr}` : startStr;
  }

  return {
    id: googleEvent?.id,
    Name: rawName,
    Day: day,
    Time: time,
    Location: googleEvent?.location || '',
    Description: googleEvent?.description || '',
    Position: Number.isFinite(Number(position)) ? Number(position) : 3,
    source: 'google-direct',
    googleEventId: googleEvent?.id,
  };
}

export async function fetchPublicCalendarEvents(
  opts: FetchPublicCalendarOptions
): Promise<PublicCalendarEvent[]> {
  const {
    calendarId,
    apiKey,
    maxResults = 120,
    timeMin,
    timeMax,
    defaultPosition = 3,
  } = opts;

  const now = new Date();
  const tMin = timeMin || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const tMax = timeMax || new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(maxResults),
    timeMin: tMin,
    timeMax: tMax,
  });
  if (apiKey) params.set('key', apiKey);

  const baseUrl =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  const url = `${baseUrl}?${params.toString()}`;

  devLog('[publicCalendar] Fetching Google Calendar API', {
    calendarId,
    urlWithoutKey: baseUrl + (params.toString() ? '?' + params.toString().replace(/key=[^&]+/, 'key=REDACTED') : ''),
  });

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    // 404 on the Calendar API for a ?key= call almost always means:
    // - The calendarId is wrong / does not exist, OR
    // - The calendar is not public ("Make available to anyone with the link" + "See all event details").
    // Note: sharing with a service account only helps the backend, not this unauthenticated client fetch.
    throw new Error(`Public calendar fetch failed (${res.status}): ${t}`);
  }

  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];

  // We intentionally do NOT derive per-event position here.
  // The Position for all events will be taken from the calendar config (opts.defaultPosition)
  // when the items are later turned into KTP events.
  return items.map((ev: any) => ({
    id: ev.id,
    summary: ev.summary || 'Untitled Event',
    description: ev.description || '',
    location: ev.location || '',
    start: ev.start || {},
    end: ev.end || {},
    position: getPositionFromConfig(defaultPosition),
  }));
}

/**
 * Same as fetchPublicCalendarEvents but returns events already normalized
 * to the KTP schema the Calendar screen expects (Name, Day, Time, etc.).
 */
export async function fetchPublicCalendarEventsAsKtp(
  opts: FetchPublicCalendarOptions
): Promise<KtpCalendarEvent[]> {
  const raw = await fetchPublicCalendarEvents(opts);

  // IMPORTANT: Position for Google-direct events must come only from the calendar config
  // (opts.defaultPosition), never from per-event data.
  const forcedPos = getPositionFromConfig(opts.defaultPosition);

  return raw
    .map((ev) =>
      toKtpEvent(
        {
          id: ev.id,
          summary: ev.summary,
          description: ev.description,
          location: ev.location,
          start: ev.start,
          end: ev.end,
        },
        forcedPos   // always the config value, ignore anything on the event
      )
    )
    .filter((e): e is KtpCalendarEvent => e !== null);
}

/**
 * Low-level fetch that returns the *raw* items array exactly as Google Calendar API v3 returns them.
 * This is what the client-side mapper will be applied to (user request).
 */
export async function fetchRawGoogleCalendarItems(opts: {
  calendarId: string;
  apiKey?: string;
  maxResults?: number;
  timeMin?: string;
  timeMax?: string;
}): Promise<any[]> {
  const {
    calendarId,
    apiKey,
    maxResults = 120,
    timeMin,
    timeMax,
  } = opts;

  const now = new Date();
  const tMin = timeMin || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const tMax = timeMax || new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(maxResults),
    timeMin: tMin,
    timeMax: tMax,
  });
  if (apiKey) params.set('key', apiKey);

  const baseUrl =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  const url = `${baseUrl}?${params.toString()}`;

  devLog('[publicCalendar] Fetching RAW Google Calendar items', {
    calendarId,
    urlWithoutKey: baseUrl + (params.toString() ? '?' + params.toString().replace(/key=[^&]+/, 'key=REDACTED') : ''),
  });

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Raw Google calendar fetch failed (${res.status}): ${t}`);
  }

  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];
  return items;
}

/**
 * Firestore-backed calendar configuration loader (client side).
 *
 * Reads from:  calendarTokens / main
 * Supports the same shapes the backend supports:
 *   - Direct map: { personal: { calendarId, defaultPosition }, eboard: { ... }, ... }
 *   - Wrapped:    { config: {...} } or { configJson: "..." }
 *
 * "personal" is treated as the default profile (as requested).
 * The code always prefers the "personal" key when present.
 * Order inside each shape: personal → eboard → default → first key.
 */
export type CalendarConfigEntry = {
  calendarId: string;
  defaultPosition: number;
};

export async function loadCalendarConfigFromFirestore(): Promise<CalendarConfigEntry | null> {
  try {
    // Dynamic require so this module can be imported even if Firebase is stubbed.
    const { db } = require('../firebaseConfig');

    if (!db) {
      return null; // No client Firestore available (dev stub mode)
    }

    const { doc, getDoc } = require('firebase/firestore');
    const ref = doc(db, 'calendarTokens', 'main');
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return null;
    }

    let data: any = snap.data();

    // Helpful diagnostic: only in dev (never dump Firestore shape in prod)
    devLog('[publicCalendar] Raw calendarTokens/main from Firestore present:', !!data);

    // Handle root string (rare)
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { return null; }
    }
    if (!data || typeof data !== 'object') return null;

    // Direct map
    const keys = Object.keys(data);
    if (keys.length > 0 && !data.config && !data.configJson && !data.data) {
      const firstVal = data[keys[0]];
      if (firstVal && typeof firstVal === 'object' && firstVal.calendarId) {
        // Prefer "personal" as the default profile, then eboard, then default, then first key
        const preferred = data.personal || data.eboard || data.default || data[keys[0]];
        if (preferred?.calendarId) {
          const usedKey = Object.keys(data).find(k => data[k] === preferred) || 'first';
          devLog('[publicCalendar] Using Firestore entry key:', usedKey, '(personal is treated as default profile)');
          if (usedKey === 'personal') {
            devLog('[publicCalendar] ✓ Loaded default profile "personal" from Firestore');
          }
          return {
            calendarId: preferred.calendarId,
            defaultPosition: Number.isFinite(Number(preferred.defaultPosition)) ? Number(preferred.defaultPosition) : 3,
          };
        }
        devLog('[publicCalendar] Using Firestore first entry key:', keys[0]);
        return {
          calendarId: firstVal.calendarId,
          defaultPosition: Number.isFinite(Number(firstVal.defaultPosition)) ? Number(firstVal.defaultPosition) : 3,
        };
      }
    }

    // Wrapped shapes
    const candidates = [data.config, data.data, data.value].filter(Boolean);
    for (const c of candidates) {
      if (c && typeof c === 'object') {
        const ck = Object.keys(c);
        if (ck.length > 0) {
          // Prefer "personal" as the default profile
          const preferred = c.personal || c.eboard || c.default || c[ck[0]];
          if (preferred?.calendarId) {
            return {
              calendarId: preferred.calendarId,
              defaultPosition: Number.isFinite(Number(preferred.defaultPosition)) ? Number(preferred.defaultPosition) : 3,
            };
          }
        }
      }
    }

    // JSON string field
    const str = data.configJson || (typeof data.config === 'string' ? data.config : null);
    if (str) {
      try {
        const parsed = JSON.parse(str);
        const pk = Object.keys(parsed);
        if (pk.length) {
          // Prefer "personal" as the default profile
          const preferred = parsed.personal || parsed.eboard || parsed.default || parsed[pk[0]];
          if (preferred?.calendarId) {
            return {
              calendarId: preferred.calendarId,
              defaultPosition: Number.isFinite(Number(preferred.defaultPosition)) ? Number(preferred.defaultPosition) : 3,
            };
          }
        }
      } catch {}
    }

    return null;
  } catch (e) {
    devWarn('[publicCalendar] Failed to load calendar config from Firestore:', (e as any)?.message);
    return null;
  }
}

/**
 * One-shot "cold launch" calendar fetch helper.
 *
 * Rules (per your requirements):
 * - Fetch from Google Calendar API **at most once per cold app launch**.
 * - "Cold launch" = the user opens the app after it was fully closed (not just backgrounded).
 *   Because this module is evaluated once per JS process, the guard naturally satisfies this.
 * - Calendar link + default Position live in Firestore (calendarTokens/main) so you can
 *   change the calendar without shipping a new build.
 * - Works the same in local dev builds (.env.development) and production EAS builds.
 * - No excessive polling: second and later calls in the same launch return instantly from cache.
 *
 * Primary source order:
 *   1. Firestore calendarTokens/main (recommended — update without rebuild)
 *   2. GOOGLE_CALENDAR_ID + DEFAULT_POSITION from the active .env.* file
 *   3. Safe fallback
 *
 * Optional (recommended for prod):
 *   GOOGLE_CALENDAR_API_KEY  (restricted browser key for the Calendar API)
 */
let hasFetchedThisLaunch = false;
let lastFetchedEvents: KtpCalendarEvent[] | null = null;
let lastFetchedRaw: any[] | null = null;

// The single source of truth for Position of Google-direct events.
// This comes ONLY from calendarTokens/main (the chosen profile's defaultPosition).
// It is set when we successfully load config during a fetch.
let resolvedDefaultPosition = 3;

export function getDefaultPosition(): number {
  return resolvedDefaultPosition;
}

/**
 * Returns the last successfully fetched Google Calendar events from local cache (disk).
 * This survives app closes/crashes and allows instant UI on next launch.
 * The cache is updated on every successful direct fetch.
 */
export async function getCachedDirectCalendarEvents(): Promise<KtpCalendarEvent[]> {
  const cached = await loadCalendarCache();
  return cached || [];
}

/**
 * Returns the *raw* Google Calendar items from the on-disk raw cache.
 * These are the exact items returned by the Google API before any client-side mapping.
 */
export async function getCachedRawGoogleCalendarEvents(): Promise<any[]> {
  const cached = await loadRawCalendarCache();
  return cached || [];
}

/**
 * Fetch *raw* Google Calendar items once per cold launch.
 * Returns the literal `items` array from Google (no schema conversion yet).
 * The caller (Calendar tab) will run `mapGoogleEventToKtpSchema` explicitly on each item.
 */
export async function fetchRawGoogleCalendarEventsOncePerLaunch(): Promise<any[]> {
  if (hasFetchedThisLaunch && lastFetchedRaw) {
    return lastFetchedRaw;
  }

  // 1. Try to get calendarId + defaultPosition from Firestore (personal is default profile)
  let cfg = await loadCalendarConfigFromFirestore();
  let cfgSource = cfg ? 'firestore' : null;

  // 2. Fallback to environment variables
  if (!cfg) {
    if (GOOGLE_CALENDAR_ID) {
      cfg = {
        calendarId: GOOGLE_CALENDAR_ID,
        defaultPosition: Number.isFinite(Number(DEFAULT_POSITION)) ? Number(DEFAULT_POSITION) : 3,
      };
      cfgSource = 'env';
    }
  }

  // 3. Final fallback
  if (!cfg) {
    cfg = {
      calendarId: 'primary',
      defaultPosition: 3,
    };
    cfgSource = 'hardcoded-primary';
    devWarn('[publicCalendar] No calendar config in Firestore and no GOOGLE_CALENDAR_ID env. Using fallback to "primary".');
    devWarn('[publicCalendar] NOTE: For the public API key path, put your calendar under the "personal" key in Firestore calendarTokens/main (as requested).');
  }

  if (cfg.calendarId === 'primary' || cfg.calendarId === 'primary@group.calendar.google.com') {
    devWarn(
      '[publicCalendar] WARNING: calendarId is "primary". ' +
      'For the unauthenticated Google Calendar API call (with ?key=), "primary" almost always returns 404. ' +
      'Use the actual calendar ID from Google Calendar settings (the long hex one or email shown under "Integrate calendar").'
    );
  }

  // === Position now comes ONLY from the Firestore calendar config (defaultPosition for the profile) ===
  // No per-event Position is read from Google events anymore.
  resolvedDefaultPosition = Number.isFinite(Number(cfg?.defaultPosition)) ? Number(cfg.defaultPosition) : 3;

  devLog('[publicCalendar] Attempting RAW direct fetch (client will map)', {
    calendarId: cfg.calendarId,
    source: cfgSource,
    hasApiKey: !!GOOGLE_CALENDAR_API_KEY,
    defaultPositionFromConfig: resolvedDefaultPosition,
  });

  try {
    const rawItems = await fetchRawGoogleCalendarItems({
      calendarId: cfg.calendarId,
      apiKey: GOOGLE_CALENDAR_API_KEY || undefined,
    });

    hasFetchedThisLaunch = true;
    lastFetchedRaw = rawItems;

    // Persist the RAW items so we can map them on cold start from cache.
    await saveRawCalendarCache(rawItems);

    // Also keep a convenience KTP-shaped cache for older callers (best effort).
    // IMPORTANT: filter out any events that had no title (mapper returns null for those).
    // All events get the SAME Position from the config (not from the event).
    try {
      const mapped = rawItems
        .map((g: any) => mapGoogleEventToKtpSchema(g, resolvedDefaultPosition))
        .filter((e): e is KtpCalendarEvent => e !== null);
      await saveCalendarCache(mapped);
    } catch {}

    return rawItems;
  } catch (err) {
    const msg = (err as any)?.message || String(err);
    prodError('[publicCalendar] RAW direct Google Calendar fetch failed', {
      calendarId: cfg.calendarId,
      error: msg,
    });
    if (msg.includes('404') || msg.includes('Not Found')) {
      devWarn(
        '[publicCalendar] 404 usually means: 1) wrong calendarId, or 2) calendar is NOT public. ' +
        'For the direct ?key= fetch to work, the calendar must be "Make available to anyone with the link" + "See all event details".'
      );
    }

    // Fall back to raw disk cache so the tab can still map on cold launch.
    const cachedRaw = await loadRawCalendarCache();
    if (cachedRaw && cachedRaw.length > 0) {
      hasFetchedThisLaunch = true;
      lastFetchedRaw = cachedRaw;
      return cachedRaw;
    }

    // Do not cache a failed, uncached request as an authoritative empty calendar.
    // A later user/config readiness transition can retry without requiring a manual reset.
    hasFetchedThisLaunch = false;
    lastFetchedRaw = null;
    return [];
  }
}

export async function fetchCalendarEventsOncePerLaunch(): Promise<KtpCalendarEvent[]> {
  if (hasFetchedThisLaunch && lastFetchedEvents) {
    return lastFetchedEvents;
  }

  // 1. Try to get calendarId + defaultPosition from Firestore
  let cfg = await loadCalendarConfigFromFirestore();
  let cfgSource = cfg ? 'firestore' : null;

  // 2. Fallback to environment variables (statically replaced by the Babel plugin at top of file)
  if (!cfg) {
    if (GOOGLE_CALENDAR_ID) {
      cfg = {
        calendarId: GOOGLE_CALENDAR_ID,
        defaultPosition: Number.isFinite(Number(DEFAULT_POSITION)) ? Number(DEFAULT_POSITION) : 3,
      };
      cfgSource = 'env';
    }
  }

  // 3. Final hardcoded fallback
  if (!cfg) {
    cfg = {
      calendarId: 'primary',
      defaultPosition: 3,
    };
    cfgSource = 'hardcoded-primary';
    devWarn('[publicCalendar] No calendar config in Firestore and no GOOGLE_CALENDAR_ID env. Using fallback to "primary".');
    devWarn('[publicCalendar] NOTE: For the public API key path, put your calendar under the "personal" key in Firestore calendarTokens/main (as requested).');
  }

  // "primary" is a very common cause of 404 on the public API key path.
  // It usually only works when authenticated as that Google user.
  if (cfg.calendarId === 'primary' || cfg.calendarId === 'primary@group.calendar.google.com') {
    devWarn(
      '[publicCalendar] WARNING: calendarId is "primary". ' +
      'For the unauthenticated Google Calendar API call (with ?key=), "primary" almost always returns 404. ' +
      'Use the actual calendar ID from Google Calendar settings (the long hex one or email shown under "Integrate calendar").'
    );
  }

  // Log exactly what we are about to request (very useful for 404 debugging)
  devLog('[publicCalendar] Attempting direct fetch', {
    calendarId: cfg.calendarId,
    source: cfgSource,
    hasApiKey: !!GOOGLE_CALENDAR_API_KEY,
    isPrimary: cfg.calendarId === 'primary',
  });

  // 4. Optional restricted browser key (also statically replaced)
  try {
    const events = await fetchPublicCalendarEventsAsKtp({
      calendarId: cfg.calendarId,
      apiKey: GOOGLE_CALENDAR_API_KEY || undefined,
      defaultPosition: cfg.defaultPosition,
    });

    hasFetchedThisLaunch = true;
    lastFetchedEvents = events;

    // Persist to disk so data survives app closes/crashes.
    // Next cold launch can render instantly from this cache.
    await saveCalendarCache(events);

    return events;
  } catch (err) {
    const msg = (err as any)?.message || String(err);
    prodError('[publicCalendar] Direct Google Calendar fetch failed', {
      calendarId: cfg.calendarId,
      error: msg,
    });
    // Extra hint for the most common 404 cause
    if (msg.includes('404') || msg.includes('Not Found')) {
      devWarn(
        '[publicCalendar] 404 usually means: 1) wrong calendarId, or 2) calendar is NOT public. ' +
        'For the direct ?key= fetch to work, the calendar must be "Make available to anyone with the link" + "See all event details". ' +
        'Service account sharing only helps the backend, not this client-side call.'
      );
    }

    hasFetchedThisLaunch = true;

    // On network failure, fall back to whatever we have in disk cache so the UI is not empty.
    const cached = await loadCalendarCache();
    if (cached && cached.length > 0) {
      lastFetchedEvents = cached;
      return cached;
    }

    lastFetchedEvents = [];
    return [];
  }
}

/**
 * Reset the one-per-launch guard. Only for testing / force-refresh scenarios.
 * Normal users should never need this.
 */
export function resetCalendarLaunchFetchGuard() {
  hasFetchedThisLaunch = false;
  lastFetchedEvents = null;
  lastFetchedRaw = null;
}

/**
 * Clears the on-disk calendar cache. Useful for testing or "pull to refresh" style features later.
 */
export async function clearDirectCalendarCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CALENDAR_CACHE_KEY);
  } catch {}
}
