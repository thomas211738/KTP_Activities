import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ScrollView, StyleSheet, SafeAreaView, useColorScheme } from 'react-native';
import axios from 'axios';
import Entypo from '@expo/vector-icons/Entypo';
import { MaterialIcons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { format, parseISO } from 'date-fns';
import { BACKEND_URL } from '@env';
import { router } from 'expo-router';
import CalendarLoader from '../../components/loaders/calendarLoader';
import { getUserInfo, subscribeToUserInfo } from '../../components/userInfoManager';
import { CheckNotificationStatus, registerForPushNotificationsAsync } from '../../components/notificationStatus';
import EventCard from '../../components/EventCard';
import { isProduction } from '../../config';

const index = () => {
    const colorScheme = useColorScheme();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const freshUser = getUserInfo() || { Position: 0, id: null };
    const userPos = Number(freshUser.Position ?? 0);
    const isEboard = userPos === 3 || userPos === 5 || freshUser.BUEmail === 'ander010@bu.edu'; // Eboard, SuperAdmin, or dev override

    const fetchEvents = async () => {
        try {
            const freshUser = getUserInfo() || { Position: 0, id: null };

            // Only register push token if we have a real user ID.
            // If ValidateUser hasn't resolved yet, id is null — skip here,
            // subscribeToUserInfo will re-trigger fetchEvents with the real user.
            if (freshUser.id) {
                const dbToken = await CheckNotificationStatus(freshUser.id);
                if (dbToken === 0) {
                    const registration = await registerForPushNotificationsAsync();
                    const token = registration.token;
                    if (registration.status === 'registered' && token?.startsWith('ExponentPushToken')) {
                        try {
                            await axios.post(`${BACKEND_URL}/notifications`, {
                                userID: freshUser.id,
                                token,
                            });
                        } catch (err) {
                            console.error("Error posting notification token:", err);
                        }
                    }
                }
            }

            // Legacy client-side direct Google Calendar API call disabled.
            // Now relies on Cloud Function webhook (calendarWebhook) that syncs from the same public calendar
            // (configured in Firestore calendarTokens/main) → writes normalized events to Firestore `events` collection.
            // The backend /events GET returns those.
            console.log('[Calendar] Fetching events from backend (Firestore via Cloud Functions - migrated)');

            const response = await axios.get(`${BACKEND_URL}/events`);
            const fetchedEvents = response.data.data || response.data || [];

            // Filter by user's Position (visibility rule)
            const userPos = Number(freshUser.Position ?? 0);
            const filteredEvents = fetchedEvents.filter(event => {
                const eventPos = Number(event.Position ?? 3);
                return eventPos <= userPos;
            });

            // Filter to today + future only.
            // Use local date parts (not toISOString which is UTC) so events
            // on today's date always show regardless of the hour or timezone.
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const upcomingEvents = filteredEvents.filter((event: any) => {
                if (!event.Day) return true; // keep "TBA" events with no date
                return String(event.Day) >= todayStr;
            });

            // Sort by date ascending
            const sortedEvents = [...upcomingEvents].sort((a, b) => {
                const dateA = a.Day ? new Date(a.Day).getTime() : Infinity;
                const dateB = b.Day ? new Date(b.Day).getTime() : Infinity;
                return dateA - dateB;
            });

            setEvents(sortedEvents);
            setLoading(false);

            if (!isProduction) {
                console.log(`[Calendar] Loaded ${sortedEvents.length} upcoming events (filtered from ${filteredEvents.length} total)`);
            }

        } catch (error) {
            console.error('[Calendar] Error fetching calendar events from backend:', error);
            setLoading(false);
            Alert.alert('Error', 'Failed to load calendar events');
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

    const formatDate = (dateString: any) => {
        if (!dateString) return 'Date to be announced';
        try {
            const date = parseISO(String(dateString));
            if (isNaN(date.getTime())) return 'Date to be announced';
            return format(date, 'EEEE, MMMM d');
        } catch {
            return 'Date to be announced';
        }
    };

    const groupEventsByDate = (eventsList: any[]) => {
        return eventsList.reduce((groups: Record<string, any[]>, event: any) => {
            const dateKey = formatDate(event?.Day);
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(event);
            return groups;
        }, {});
    };

    const groupedEvents = groupEventsByDate(events);

    // Delete event
    const deleteEvent = async (event: any) => {
        try {
            await axios.delete(`${BACKEND_URL}/events/${event.id}`);
            void fetchEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            Alert.alert('Error', 'Failed to delete event');
        }
    };

    // Edit event — navigate to editEvent screen, passing current values as params for instant pre-population
    const editEvent = (event: any) => {
        router.push({
            pathname: '/(tabs)/Calendar/editEvent',
            params: {
                eventID:     event.id,
                name:        event.Name        || '',
                day:         event.Day         || '',
                time:        event.Time        || '',
                location:    event.Location    || '',
                description: event.Description || '',
                position:    String(event.Position ?? ''),
            },
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' }]}>
            <ScrollView style={styles.scrollView}>
                {loading ? (
                    <CalendarLoader />
                ) : Object.keys(groupedEvents).length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: colorScheme === 'dark' ? '#888' : '#666' }]}>No upcoming events</Text>
                    </View>
                ) : (
                    Object.entries(groupedEvents).map(([date, dayEvents]: [string, any[]]) => (
                        <View key={date} style={styles.dateGroup}>
                            <Text style={[styles.dateHeader, {
                                backgroundColor: colorScheme === 'dark' ? '#252525' : '#f0f0f0',
                                color:           colorScheme === 'dark' ? '#d0d0d0' : '#333',
                            }]}>{date}</Text>
                            {dayEvents.map((event: any) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    isEboard={isEboard}
                                    onEdit={editEvent}
                                    onDelete={deleteEvent}
                                />
                            ))}
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    dateGroup: {
        marginBottom: 16,
    },
    dateHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f0f0f0',
        color: '#333',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
    },
});

export default index;
