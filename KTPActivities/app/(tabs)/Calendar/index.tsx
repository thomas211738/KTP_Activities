import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ScrollView, StyleSheet, SafeAreaView, useColorScheme } from 'react-native';
import axios from 'axios';
import Entypo from '@expo/vector-icons/Entypo';
import { MaterialIcons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { format, parseISO, set } from 'date-fns';
import { BACKEND_URL } from '@env';
import { router } from 'expo-router';
import CalendarLoader from '../../components/loaders/calendarLoader';
import { getUserInfo, subscribeToUserInfo } from '../../components/userInfoManager';
import { CheckNotificationStatus, registerForPushNotificationsAsync } from '../../components/notificationStatus';
import KTPWrappedCard from '../../wrapped/ktpWrappedCard';

// Direct Google Calendar fetch (Firestore-driven config + once per cold launch)
// We fetch RAW items from Google and EXPLICITLY apply the client-side schema mapper
// (the port of the uncommitted Cloud Function's toKtpEventSchema + extractPosition).
import {
  fetchRawGoogleCalendarEventsOncePerLaunch,
  getCachedRawGoogleCalendarEvents,
  getCachedDirectCalendarEvents,
  mapGoogleEventToKtpSchema,
  resetCalendarLaunchFetchGuard,
  clearDirectCalendarCache,
  getDefaultPosition,
  loadCalendarConfigFromFirestore,
  parsePerEventPositionTag,
} from '../../utils/publicCalendar';

import { isProduction } from '../../config';

// -----------------------------------------------------------------------------
// TWO POSITION RULES FOR GOOGLE CALENDAR EVENTS (client side)
// -----------------------------------------------------------------------------
// Rule 1 (primary, from Firestore):
//   Every event for the calendar gets the same Position =
//   calendarTokens/main → <profile>.defaultPosition   (e.g. "personal")
//
// Rule 2 (optional per-event override):
//   If the Google event Description contains a "Position:" / "Pos:" tag
//   (spacing tolerant, pure string ops), that value overrides Rule 1 for that event.
//   If the tag exists but is malformed, misspelled, or has a bad value → the event is DROPPED (fail-closed).
//
// WHERE TO PUT THE TAG WHEN CREATING THE EVENT IN GOOGLE CALENDAR:
//   - Open the event in Google Calendar (web or app).
//   - Edit the event.
//   - Put the tag **anywhere in the Description** field (top, bottom, or middle is fine).
//   - Save.
//
// Accepted examples (all work; case-insensitive; tolerant of spaces around separators):
//   Position: 2
//   Pos:1
//   pos = 0
//   POSITION  =  3
//   visibility pos : 2
//
// If the keyword is present but the value is missing, not numeric, or the keyword is misspelled
// ("Positoin", "Possition", "P os", etc.) → event is filtered out and never rendered.
// -----------------------------------------------------------------------------

// Production safety: explicit guard expression is used at call sites for auditability.
// Never rely on __DEV__ alone for production-sensitive UI or behavior.
const _prodGuard = { isProd: isProduction, isStrictDev: !isProduction && __DEV__ };

const index = () => {
    const colorScheme = useColorScheme();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // NOTE: We intentionally do NOT capture userInfo at the top level here.
    // We re-read it fresh on every fetchEvents() call because it can be populated
    // after the component first mounts (post-login).
    // Using a stale value here is the #1 reason "I see it in logs but not on screen".

    const fetchEvents = async () => {
        try {
            // === ALWAYS read the CURRENT user right at fetch time ===
            // This is the most common reason "I see it in the logs but it doesn't render".
            // The component-level `userInfo` below can be stale (Position=0 or missing) if the
            // Calendar tab mounted before login completed.
            const freshUserForAuth = getUserInfo() || { Position: 0, id: null };
            const rawUserPos = freshUserForAuth.Position;
            const userVisPos = Number(rawUserPos ?? 0);

            if (!isProduction) {
              console.log('[Calendar] fetch running');
            }
            // Production hygiene: the majority of logs below are wrapped in `if (!isProduction)` already.
            // We intentionally keep the FINAL count + very small set of error paths for prod crash diagnostics.

            let dbTocken = await CheckNotificationStatus(freshUserForAuth.id);

            if (dbTocken === 0) {
                const registration = await registerForPushNotificationsAsync();
                const token = registration.token;

                if (registration.status === 'permission-denied') {
                    if (!isProduction) console.log('User token is NOT registered and user has notifications DISABLED');
                } else if (registration.status === 'registered' && typeof token === 'string' && token.startsWith('ExponentPushToken')) {
                    try {
                        await axios.post(`${BACKEND_URL}/notifications`, {
                            userID: `${freshUserForAuth.id}`,
                            token: `${token}`,
                        });
                        if (!isProduction) console.log('Token added to database');
                    } catch (err) {
                        console.error("Error posting notification token:", err.response ? err.response.data : err.message);
                    }
                    if (!isProduction) console.log('User token is NOT registered and user has notifications enabled, so token was added to database');
                } else if (registration.status === 'unavailable') {
                    if (!isProduction) console.log('Push registration is unavailable; notification token was not changed');
                } else {
                    if (!isProduction) console.log('BAD TOKEN');
                }

            } else {
                const registration = await registerForPushNotificationsAsync();
                if (registration.status === 'permission-denied'){
                    try {
                        await axios.delete(`${BACKEND_URL}/notifications/token/${dbTocken}`);
                        if (!isProduction) console.log('Token deleted from database');
                    } catch (err) {
                        console.error("Error deleting notification token:", err.response ? err.response.data : err.message);
                    }
                    if (!isProduction) console.log('User token is alrady registered and user still has notifications DISABLED, so token was deleted from database');
                } else if (registration.status === 'unavailable') {
                    if (!isProduction) console.log('Push registration is unavailable; existing notification token was not changed');
                } else {
                    if (!isProduction) console.log('User token is alrady registered and user still has notifications enabled');
                }
                
            }

            // ------------------------------------------------------------------
            // GOOGLE CALENDAR DATA IS WHAT MUST RENDER IN THE CALENDAR TAB.
            //
            // Per user request:
            // - Fetch the RAW items returned by the Google Calendar API.
            // - Explicitly apply the client-side schema mapper (`mapGoogleEventToKtpSchema`)
            //   on *whatever we get back from the Google calendar fetch*.
            // - This mapper is the direct client-side port of the transformation logic
            //   that was in the uncommitted Cloud Function (toKtpEventSchema + extractPosition).
            //
            // Strict rule (no mixing):
            // - If we received ANY raw items from Google (live or raw disk cache),
            //   we render ONLY the mapped Google data (after Position filter).
            // - We NEVER fall back to or mix in the legacy Firebase `events` docs
            //   while any raw Google data exists.
            // - Legacy GET /events is used ONLY when Google returned literally zero raw items.
            // ------------------------------------------------------------------

            let eventsToRender: any[] = [];
            let hadAnyRawGoogleData = false;

            // 1. Live RAW Google Calendar fetch (exactly what Google returns)
            let rawGoogleItems: any[] = [];
            try {
                rawGoogleItems = await fetchRawGoogleCalendarEventsOncePerLaunch() || [];
            } catch (e) {
                console.warn('[Calendar] raw Google fetch error:', (e as any)?.message);
            }

            if (!isProduction) {
              console.log('[Calendar] RAW Google items received (before mapping):', rawGoogleItems.length);
            }
            if (rawGoogleItems.length > 0 && !isProduction) {
                const sample = rawGoogleItems.slice(0, 3).map((g: any) => ({
                    id: g.id,
                    summary: g.summary,
                    start: g.start,
                    hasDesc: !!(g.description),
                    // Position is NOT read from the event. It will be set from the calendarTokens/main config.
                    descSnippet: (g.description || '').slice(0, 80),
                }));
                console.log('[Calendar] RAW sample (first few):', JSON.stringify(sample));
            }

            if (Array.isArray(rawGoogleItems) && rawGoogleItems.length > 0) {
                hadAnyRawGoogleData = true;
            } else if (!isProduction) {
                console.log('[Calendar] No raw Google items from live fetch. Will try raw disk cache next.');
            }

            // -----------------------------------------------------------------
            // TWO POSITION RULES (applied in this order)
            // -----------------------------------------------------------------
            // Rule 1 (calendar-wide, from Firestore — always loaded first):
            //   calendarTokens/main → <profile>.defaultPosition
            //   This becomes the base Position for all events of this calendar.
            //
            // Rule 2 (optional, per-event, applied during mapping):
            //   If the Google event Description contains a "Position:" or "Pos:" tag
            //   (case-insensitive, spacing tolerant), that value overrides Rule 1
            //   for that single event.
            //
            //   If a tag is present but the value is missing / not a number /
            //   the keyword is misspelled ("Positoin", "Possition", etc.) → DROP the event.
            //
            // Put the tag in the Google Calendar event's **Description** field.
            // Example:   Position: 2     or    Pos: 1     or    pos = 0
            // -----------------------------------------------------------------

            let calendarPosition = 3;
            try {
                const cfg = await loadCalendarConfigFromFirestore();
                if (cfg && Number.isFinite(Number(cfg.defaultPosition))) {
                    calendarPosition = Number(cfg.defaultPosition);
                } else {
                    calendarPosition = getDefaultPosition();
                }
            } catch {
                calendarPosition = getDefaultPosition();
            }

            if (!isProduction) {
              console.log('[Calendar] Rule 1 (calendar defaultPosition from Firestore):', calendarPosition);
            }

            // userVisPos already declared at top of fetchEvents from the fresh auth read.

            if (hadAnyRawGoogleData) {
                // 2. EXPLICIT client-side schema mapping on the RAW items we got back.
                //    This is the port of the cloud function logic. Do it here, before any render decision.
                //
                // Partial schema is allowed:
                //   - Description, Time, Location, or even Day may be missing/empty → we still render what we have.
                // Hard rule:
                //   - If no title (Name), mapper returns null → we drop the event entirely (never render it).
                //
                // IMPORTANT: we pass the calendar config's defaultPosition.
                // Per-event Position data inside Google events is ignored.
                const mappedRaw = rawGoogleItems
                    .map((g: any) => mapGoogleEventToKtpSchema(g, calendarPosition))
                    .filter((e): e is any => e !== null);

                if (!isProduction) {
                  console.log('[Calendar] ALL MAPPED (count=' + mappedRaw.length + '), calendarPos=' + calendarPosition);
                }

                const beforePosCount = mappedRaw.length;
                // Final visibility filter using the logged-in user's Position.
                eventsToRender = mappedRaw.filter((e: any) => Number(e.Position) <= userVisPos);

                const droppedByPosition = beforePosCount - eventsToRender.length;
                if (droppedByPosition > 0 && !isProduction) {
                    console.warn('[Calendar] DROPPED by visibility filter (userVis=' + userVisPos + '):', droppedByPosition);
                }

                // Lightweight dev-only diagnostics
                if (!isProduction) {
                  const devEvent = mappedRaw.find((e: any) => /dev.?day|Dev Day/i.test(String(e.Name || '')));
                  if (devEvent) {
                    const willRender = Number(devEvent.Position) <= userVisPos;
                    console.log('[Calendar] Dev event found. Pos=' + devEvent.Position + ' user=' + userVisPos + ' willShow=' + willRender);
                  }
                  const sample = mappedRaw.slice(0, 2).map((e: any) => ({Name: e.Name, Pos: e.Position}));
                  console.log('[Calendar] MAPPED sample:', JSON.stringify(sample));
                  console.log(`[Calendar] RAW+ mapped → after visibility: ${eventsToRender.length} (dropped ${droppedByPosition})`);
                }
            } else {
                // 3. Raw disk cache from previous successful Google fetch (survives closes/crashes)
                try {
                    const cachedRaw = await getCachedRawGoogleCalendarEvents();
                    if (Array.isArray(cachedRaw) && cachedRaw.length > 0) {
                        hadAnyRawGoogleData = true;
                        // Always apply the *current* calendar config Position when mapping raw items.
                        const mappedCache = cachedRaw
                            .map((g: any) => mapGoogleEventToKtpSchema(g, calendarPosition))
                            .filter((e): e is any => e !== null);
                        eventsToRender = mappedCache.filter((e: any) => Number(e.Position) <= userVisPos);
                        if (!isProduction) {
                          console.log('[Calendar] from raw cache, after filters:', eventsToRender.length);
                        }
                    }
                } catch {}

                // 3b. Defensive fallback using previous successful mapped cache (if raw cache is not present yet).
                if (!hadAnyRawGoogleData) {
                    try {
                        const oldCache = await getCachedDirectCalendarEvents();
                        if (Array.isArray(oldCache) && oldCache.length > 0) {
                            hadAnyRawGoogleData = true;
                            // Old KTP-shaped cache may have stale Position values.
                            // Force every Google-direct event to use the current calendar config Position.
                            const patched = oldCache.map((e: any) =>
                                e && e.source === 'google-direct'
                                    ? { ...e, Position: calendarPosition }
                                    : e
                            );
                            eventsToRender = patched.filter((e: any) => e && Number(e.Position) <= userVisPos);
                            console.log(
                                `[Calendar] >>> RENDERING *** GOOGLE CALENDAR DATA *** (OLD MAPPED DISK CACHE, position forced from config) ` +
                                `oldCacheItems=${oldCache.length} afterPosition=${eventsToRender.length}`
                            );
                        }
                    } catch {}
                }
            }

            // ------------------------------------------------------------------
            // FINAL HARD GATE
            // If the Google path ever produced raw items (live or cache), we render
            // ONLY the mapped Google data. Legacy Firebase `events` docs are ignored.
            // ------------------------------------------------------------------
            if (hadAnyRawGoogleData) {
                console.log(
                    '[Calendar] *** PURE GOOGLE CALENDAR DATA (client-mapped) *** ' +
                    'Raw Google items present. Firebase `events` collection is COMPLETELY SKIPPED.'
                );
            } else {
                // Only reach here if Google gave us zero raw items both live and from cache.
                console.warn('[Calendar] >>> FALLBACK PATH TRIGGERED: no raw Google data at all. Calling legacy /events (Firebase docs).');
                try {
                    const resp = await axios.get(`${BACKEND_URL}/events`);
                    const legacyDocs = resp.data?.data || [];
                    // Apply same rules as Google path:
                    // - Must have a title (Name)
                    // - Partial data for other fields is OK
                    // - Position filter
                    eventsToRender = legacyDocs
                        .filter((e: any) => e && e.Name && e.Name.toString().trim().length > 0)
                        .filter((e: any) => Number(e.Position) <= userVisPos);
                    console.warn(
                        `[Calendar] !!! NO RAW GOOGLE DATA (live + raw cache empty). ` +
                        `Falling back to legacy Firebase events docs → ${eventsToRender.length}`
                    );
                } catch (err) {
                    console.error('Legacy Firebase fallback failed:', err);
                    eventsToRender = [];
                }
            }

            // Extra loud check for the specific event the user is looking for (dev only)
            if (!isProduction) {
              const devDayStillHere = eventsToRender.find((e: any) => /dev.?day|Dev Day/i.test(String(e.Name || '')));
              if (devDayStillHere) {
                console.log('>>> "Dev Day" event SURVIVED all filters and will be passed to setEvents');
              } else {
                console.log('>>> After final filters, no "Dev Day" event is present in eventsToRender.');
              }
            }

            // Final safety:
            // - Drop anything that somehow has no Name (title is required).
            // - Partial data is OK for other fields (Day/Time/Location/Description can be empty).
            eventsToRender = eventsToRender.filter((e: any) => e && e.Name && e.Name.toString().trim().length > 0);

            // === FINAL DIAGNOSTIC before render (dev only; keep the length line as a one-liner for prod crash triage) ===
            if (!isProduction) {
              console.log('[Calendar] FINAL eventsToRender (after all filters):', eventsToRender.length);
              eventsToRender.forEach((e: any, i: number) => {
                console.log('  FINAL[' + i + ']:', e.Name, 'Day=', e.Day || '(none)', 'Pos=', e.Position);
              });
            } else {
              // One minimal line in prod for triage if something is obviously empty when it should not be.
              if (eventsToRender.length === 0) {
                console.log('[Calendar] FINAL count: 0');
              }
            }

            // Robust sort: events without a valid Day go to the end.
            const getSortKey = (e: any) => {
                const d = e?.Day ? new Date(e.Day).getTime() : NaN;
                return Number.isFinite(d) ? d : Number.MAX_SAFE_INTEGER;
            };
            const sorted = [...eventsToRender].sort((a: any, b: any) => getSortKey(a) - getSortKey(b));

            setEvents(sorted);
            setLoading(false);
        } catch (err) {
            console.error("Error in notification/event fetching logic:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchForResolvedUser = () => {
            if (getUserInfo()) {
                void fetchEvents();
            }
        };

        const unsubscribe = subscribeToUserInfo(fetchForResolvedUser);
        fetchForResolvedUser();

        return unsubscribe;
    }, []);

    // Safe date formatter. Handles missing or invalid Day (partial schema support).
    const formatDate = (dateString: any) => {
        if (!dateString) return 'Date to be announced';
        try {
            const date = parseISO(String(dateString));
            // date-fns format will throw on invalid date
            if (isNaN(date.getTime())) return 'Date to be announced';
            return format(date, 'EEEE, MMMM d');
        } catch {
            return 'Date to be announced';
        }
    };

    const groupEventsByDate = (events: any[]) => {
        return events.reduce((groups: Record<string, any[]>, event: any) => {
            const dateKey = formatDate(event?.Day);
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(event);
            return groups;
        }, {});
    };

    const confirmDeleteAlert = (name, id) =>
        Alert.alert('Are you sure you want to delete the following event:', name, [
            {
                text: 'Cancel',
            },
            { text: 'Delete', onPress: () => deleteEvent(id), style: 'destructive' },
        ]);

    const deleteEvent = async (id) => {
        try {
            await axios.delete(`${BACKEND_URL}/events/${id}`);
            const updatedEvents = events.filter(event => event.id !== id);
            setEvents(updatedEvents);
        } catch (err) {
            console.error("Error deleting event:", err.response ? err.response.data : err.message);
        }
        fetchEvents();
    };

    const positions = {
        0: "Open rush",
        0.5: "Closed rush",
        1: "Pledge",
        2: "Brother",
        3: "E-board",
        4: "Alumni",
        5: "Super"
    }

    const groupedEvents = groupEventsByDate(events);
    const themeContainerStyle = colorScheme === 'light' ? styles.lightcontainer : styles.darkcontainer;
    const themeTitleTextStyle = colorScheme === 'light' ? styles.darkText : styles.lightText ;
    const themeTextStyle = colorScheme === 'light' ?  styles.lightText : styles.darkText;
    const themeEventStyle = colorScheme === 'light' ? styles.lightEvent : styles.darkEvent;
    const positionTextStyle = colorScheme === 'light' ? styles.darkPositionTextContainer : styles.lightPositionTextContainer;

    if (loading) {
        return <CalendarLoader />;
    } else {
        return (
            <SafeAreaView style={[styles.container, themeContainerStyle]}>
                <ScrollView
                    contentInsetAdjustmentBehavior='automatic'
                    showsVerticalScrollIndicator={false}
                >   
                {/* <KTPWrappedCard onPress={() => console.log("Card Pressed")} /> */}

                    {/* DEV-ONLY UI — EXTREMELY STRICT production guard.
                        - Primary: `isProduction` (build-time from app.config.ts + extra.isProduction).
                        - Belt-and-suspenders: also require __DEV__ (Metro/Hermes dev flag is false in Release/prod bundles).
                        - Self-destruct inside the block: if somehow reached in a prod bundle, the view renders nothing.
                        - This box must NEVER appear in EAS production/preview or local --configuration Release builds.
                     */}
                    {!isProduction && __DEV__ && (
                        <View style={{ padding: 8, backgroundColor: '#333', marginBottom: 12, borderRadius: 6 }}>
                            {(() => {
                                // Defense-in-depth runtime kill switch.
                                // If any production signal is present at render time, render absolutely nothing.
                                const extra = require('expo-constants').default?.expoConfig?.extra || {};
                                const prodSignal =
                                    extra.isProduction === true ||
                                    extra.appEnv === 'production' ||
                                    (typeof process !== 'undefined' && (process.env?.APP_ENV === 'production' || process.env?.APP_ENV === 'prod'));
                                if (prodSignal) return null;

                                return (
                                    <>
                                        <Text style={{ color: '#ffcc00', fontSize: 12, marginBottom: 4 }}>
                                            DEV: Rule 1 (calendar default) = defaultPosition from Firestore calendarTokens/main.
                                        </Text>
                                        <Text style={{ color: '#ffcc00', fontSize: 11, marginBottom: 6 }}>
                                            Rule 2 (per-event): put in the Google event **Description** field, e.g. "Position: 2" or "Pos:1".
                                            Spacing tolerant. If keyword present but value bad or misspelled → event is DROPPED.
                                        </Text>
                                        <Text
                                            style={{ color: '#fff', fontSize: 13, textDecorationLine: 'underline' }}
                                            onPress={async () => {
                                                try {
                                                    resetCalendarLaunchFetchGuard();
                                                    await clearDirectCalendarCache();
                                                    fetchEvents();
                                                } catch (e) { /* swallow in dev box */ }
                                            }}
                                        >
                                            Force fresh fetch (clear cache + guard)
                                        </Text>
                                    </>
                                );
                            })()}
                        </View>
                    )}

                    <View style={styles.scrollcontainer}>

                        

                        {Object.keys(groupedEvents).map((date, index) => (
                            <View key={index} style={styles.dateGroup}>
                                <Text style={[styles.eventDate, themeTitleTextStyle]}>{date}</Text>
                                {groupedEvents[date].map((event, eventIndex) => (
                                    <View key={eventIndex} style={styles.eventWrapper}>
                                        <View style={[styles.eventContainer, themeEventStyle]}>
                                            <View style={styles.titleContainer}>
                                                <Text style={[styles.eventTitle, themeTextStyle]}>{event.Name}</Text>
                                                <View style={styles.icon}>
                                                    {/* Only allow edit/delete for events managed in the app (not direct Google Calendar events).
                                                        When using the direct Google fetch, E-board manages the calendar externally in Google Calendar. */}
                                                    {/* Use a fresh read for the current user's Position so E-board tools show correctly even if the tab mounted before login. */}
                                                    {(() => {
                                                        const dispUser = getUserInfo() || { Position: 0 };
                                                        const canEdit = !event.source && (String(dispUser.Position) === "3" || String(dispUser.Position) === "5");
                                                        if (!canEdit) return null;
                                                        return (
                                                            <>
                                                                <Feather
                                                                    name="edit"
                                                                    size={23}
                                                                    color={colorScheme === 'light' ? "white" : "black"}
                                                                    onPress={() => {
                                                                        router.push({ pathname: '(tabs)/Calendar/editEvent', params: { eventID: event.id } });
                                                                    }}
                                                                />
                                                                <MaterialIcons
                                                                    name="delete"
                                                                    size={25}
                                                                    color={colorScheme === 'light' ? "white" : "black"}
                                                                    style={styles.iconSpacing}
                                                                    onPress={() => confirmDeleteAlert(event.Name, event.id)}
                                                                />
                                                            </>
                                                        );
                                                    })()}
                                                </View>
                                            </View>
                                            {/* Time + Location line: only render if we have at least one of them (partial schema support) */}
                                            {(event.Time || event.Location) ? (
                                                <Text style={[styles.eventText, themeTextStyle]}>
                                                    {event.Time ? (
                                                        <>
                                                            <MaterialIcons name="access-time-filled" size={15} color={colorScheme === 'light' ? "white" : "black"} /> {event.Time}{' '}
                                                        </>
                                                    ) : null}
                                                    {event.Location ? (
                                                        <>
                                                            <Entypo name="location-pin" size={17} color={colorScheme === 'light' ? "white" : "black"} /> {event.Location}
                                                        </>
                                                    ) : null}
                                                </Text>
                                            ) : null}

                                            {/* Description: render only if present (empty is allowed for partial data) */}
                                            {event.Description ? (
                                                <Text style={[styles.eventText, themeTextStyle]}>{event.Description}</Text>
                                            ) : null}

                                            {/* Visual indicator that this event came from the shared Google Calendar (direct fetch) */}
                                            {event.source === 'google-direct' && (
                                                <View style={styles.googleSourceRow}>
                                                    <Text style={[styles.googleSourceText, themeTextStyle]}>Synced from Google Calendar</Text>
                                                </View>
                                            )}

                                            <View style={styles.positionContainer}>
                                                <View style={[styles.positionTextContainer, positionTextStyle]}>
                                                    <Text style={themeTitleTextStyle}>{positions[Number(event?.Position) as keyof typeof positions] ?? 'Member'}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ))}

                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    lightcontainer: {
        backgroundColor:  'white',
    },
    darkcontainer: {
        backgroundColor:  '#1a1a1a',
    },
    lightText: {
        color: 'white',
    },
    darkText: {
        color: 'black',
    },
    lightEvent:{
        backgroundColor: '#134b91',
    },
    darkEvent: {
        backgroundColor: '#86ebba',
    },
    scrollcontainer: {
        padding: 16,
    },

    dateGroup: {
        marginBottom: 16,
    },
    eventWrapper: {
        marginBottom: 16,
    },
    eventDate: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    eventContainer: {
        padding: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    eventTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    eventText: {
        fontSize: 16,
        padding: 2,
        marginTop: 2,
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    positionContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10
    },
    positionTextContainer: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 30  
    },
    lightPositionTextContainer: {
        backgroundColor: '#134b91',
    },
    darkPositionTextContainer: {
        backgroundColor: '#86ebba',
    },
    icon: {
        flexDirection: 'row',
    },
    iconSpacing: {
        marginLeft: 10,
    },
    googleSourceRow: {
        marginTop: 6,
    },
    googleSourceText: {
        fontSize: 12,
        fontStyle: 'italic',
        opacity: 0.7,
    },
});

export default index;
