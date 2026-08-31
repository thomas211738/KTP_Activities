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

async function saveRawCalendarCache(rawItems: any[]): Promise<void> {
  try {
    await AsyncStorage.setItem(RAW_CALENDAR_CACHE_KEY, JSON.stringify(rawItems));
  } catch {
    // ignore cache write errors
  }
}

let hasFetchedThisLaunch = false;
let lastFetchedEvents: KtpCalendarEvent[] | null = null;
let lastFetchedRaw: any[] | null = null;
let resolvedDefaultPosition = 3;

type KtpCalendarEvent = {
  id: string;
  Name: string;
  Day: string;
  Time: string;
  Location: string;
  Description: string;
  Position: number;
};

function mapGoogleEventToKtpSchema(googleEvent: any, defaultPosition: number = 3): KtpCalendarEvent | null {
  if (!googleEvent?.summary) return null;

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

  const position = extractPosition(googleEvent, defaultPosition);

  return {
    id: googleEvent.id || '',
    Name: googleEvent.summary || 'Untitled Event',
    Day: day,
    Time: time || 'All day',
    Location: googleEvent.location || '',
    Description: googleEvent.description || '',
    Position: position,
  };
}

function extractPosition(googleEvent: any, defaultPosition: number = 3): number {
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

/**
 * Loads calendar config from Firestore document `calendarTokens/main`
 */
async function loadCalendarConfigFromFirestore(): Promise<any> {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('../firebaseConfig');
    const configRef = doc(db, 'calendarTokens', 'main');
    const snap = await getDoc(configRef);

    if (snap.exists()) {
      let data = snap.data();

      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (_) {}
      }

      if (data && typeof data === 'object') {
        const keys = Object.keys(data);
        if (keys.length > 0) {
          const firstKey = keys[0];
          const firstVal = data[firstKey];
          if (firstVal && typeof firstVal === 'object' && firstVal.calendarId) {
            devLog('[publicCalendar] Loaded calendar config from Firestore calendarTokens/main');
            return firstVal;
          }
        }
      }
    }
  } catch (e) {
    devWarn('[publicCalendar] Failed to load calendar config from Firestore:', (e as any)?.message);
  }
  return null;
}

export async function fetchPublicCalendarEvents(opts: {
  calendarId: string;
  apiKey?: string;
  defaultPosition?: number;
}): Promise<PublicCalendarEvent[]> {
  devLog('[publicCalendar] Fetching Google Calendar API', { calendarId: opts.calendarId });

  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  if (opts.apiKey) params.set('key', opts.apiKey);

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(opts.calendarId)}/events?${params}`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Calendar API error ${res.status}: ${t}`);
  }

  const data = await res.json();
  const items = data.items || [];

  return items.map((item: any) => ({
    id: item.id,
    summary: item.summary,
    description: item.description,
    location: item.location,
    start: item.start,
    end: item.end,
    position: opts.defaultPosition || 3,
  }));
}

export async function fetchPublicCalendarEventsAsKtp(opts: {
  calendarId: string;
  apiKey?: string;
  defaultPosition?: number;
}): Promise<KtpCalendarEvent[]> {
  const raw = await fetchPublicCalendarEvents(opts);
  const defaultPos = opts.defaultPosition || 3;

  return raw
    .map((g: any) => mapGoogleEventToKtpSchema(g, defaultPos))
    .filter((e): e is KtpCalendarEvent => e !== null);
}

export async function fetchRawGoogleCalendarItems(opts: {
  calendarId: string;
  apiKey?: string;
}): Promise<any[]> {
  devLog('[publicCalendar] Fetching RAW Google Calendar items', { calendarId: opts.calendarId });

  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  if (opts.apiKey) params.set('key', opts.apiKey);

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(opts.calendarId)}/events?${params}`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Raw Calendar API error ${res.status}: ${t}`);
  }

  const data = await res.json();
  return data.items || [];
}

export async function fetchRawGoogleCalendarEventsOncePerLaunch(): Promise<any[]> {
  if (hasFetchedThisLaunch && lastFetchedRaw) {
    return lastFetchedRaw;
  }

  let cfg = await loadCalendarConfigFromFirestore();
  let cfgSource = cfg ? 'firestore' : null;

  if (!cfg) {
    if (GOOGLE_CALENDAR_ID) {
      cfg = {
        calendarId: GOOGLE_CALENDAR_ID,
        defaultPosition: Number.isFinite(Number(DEFAULT_POSITION)) ? Number(DEFAULT_POSITION) : 3,
      };
      cfgSource = 'env';
    }
  }

  if (!cfg) {
    cfg = { calendarId: 'primary', defaultPosition: 3 };
    cfgSource = 'hardcoded-primary';
    devWarn('[publicCalendar] No calendar config in Firestore and no GOOGLE_CALENDAR_ID env. Using fallback to "primary".');
  }

  resolvedDefaultPosition = Number.isFinite(Number(cfg?.defaultPosition)) ? Number(cfg.defaultPosition) : 3;

  devLog('[publicCalendar] Attempting RAW direct fetch', {
    calendarId: cfg.calendarId,
    source: cfgSource,
    hasApiKey: !!GOOGLE_CALENDAR_API_KEY,
  });

  try {
    const rawItems = await fetchRawGoogleCalendarItems({
      calendarId: cfg.calendarId,
      apiKey: GOOGLE_CALENDAR_API_KEY || undefined,
    });

    hasFetchedThisLaunch = true;
    lastFetchedRaw = rawItems;
    await saveRawCalendarCache(rawItems);

    return rawItems;
  } catch (err) {
    prodError('[publicCalendar] RAW direct Google Calendar fetch failed', err);
    const cached = await loadRawCalendarCache();
    if (cached && cached.length > 0) return cached;
    return [];
  }
}

export async function fetchCalendarEventsOncePerLaunch(): Promise<KtpCalendarEvent[]> {
  if (hasFetchedThisLaunch && lastFetchedEvents) {
    return lastFetchedEvents;
  }

  let cfg = await loadCalendarConfigFromFirestore();
  let cfgSource = cfg ? 'firestore' : null;

  if (!cfg) {
    if (GOOGLE_CALENDAR_ID) {
      cfg = {
        calendarId: GOOGLE_CALENDAR_ID,
        defaultPosition: Number.isFinite(Number(DEFAULT_POSITION)) ? Number(DEFAULT_POSITION) : 3,
      };
      cfgSource = 'env';
    }
  }

  if (!cfg) {
    cfg = { calendarId: 'primary', defaultPosition: 3 };
    cfgSource = 'hardcoded-primary';
    devWarn('[publicCalendar] No calendar config in Firestore and no GOOGLE_CALENDAR_ID env. Using fallback to "primary".');
  }

  resolvedDefaultPosition = Number.isFinite(Number(cfg?.defaultPosition)) ? Number(cfg.defaultPosition) : 3;

  try {
    const events = await fetchPublicCalendarEventsAsKtp({
      calendarId: cfg.calendarId,
      apiKey: GOOGLE_CALENDAR_API_KEY || undefined,
      defaultPosition: resolvedDefaultPosition,
    });

    hasFetchedThisLaunch = true;
    lastFetchedEvents = events;
    await saveCalendarCache(events);

    return events;
  } catch (err) {
    prodError('[publicCalendar] Direct Google Calendar fetch failed', err);
    const cached = await loadCalendarCache();
    if (cached && cached.length > 0) {
      lastFetchedEvents = cached;
      return cached;
    }
    return [];
  }
}

export async function getCachedDirectCalendarEvents(): Promise<KtpCalendarEvent[]> {
  const cached = await loadCalendarCache();
  return cached || [];
}

export async function getCachedRawGoogleCalendarEvents(): Promise<any[]> {
  const cached = await loadRawCalendarCache();
  return cached || [];
}
