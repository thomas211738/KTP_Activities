import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ScrollView, StyleSheet } from 'react-native';
import axios from 'axios';
import Entypo from '@expo/vector-icons/Entypo';
import { MaterialIcons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { format, parseISO } from 'date-fns';
import { BACKEND_URL } from '@env';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import CalendarLoader from '../../components/loaders/calendarLoader';

const index = ({ navigation }) => {
    const [events, setEvents] = useState([]);
    const [pos, setPos] = useState(3);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/events`);
            const sortedEvents = response.data.data.sort((a, b) => new Date(a.Day) - new Date(b.Day));
            setEvents(sortedEvents);
            setLoading(false);
        } catch (err) {
            console.log(err);
            setLoading(false);
        }
    };

    useFocusEffect(() => {
        fetchEvents();
    });

    const formatDate = (dateString) => {
        const date = parseISO(dateString);
        return format(date, 'EEEE, MMMM d');
    };

    const groupEventsByDate = (events) => {
        return events.reduce((groups, event) => {
            const date = formatDate(event.Day);
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(event);
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
            const updatedEvents = events.filter(event => event._id !== id);
            setEvents(updatedEvents);
        } catch (err) {
            console.log(err);
        }
    };

    const groupedEvents = groupEventsByDate(events);

    if (loading) {
        return <CalendarLoader />;
    }

    return (
        <ScrollView
            contentInsetAdjustmentBehavior='automatic'
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollcontainer]}
            style={styles.container}
        >
            {Object.keys(groupedEvents).map((date, index) => (
                <View key={index} style={styles.dateGroup}>
                    <Text style={styles.eventDate}>{date}</Text>
                    {groupedEvents[date].map((event, eventIndex) => (
                        <View key={eventIndex} style={styles.eventWrapper}>
                            <View style={styles.eventContainer}>
                                <View style={styles.titleContainer}>
                                    <Text style={styles.eventTitle}>{event.Name}</Text>
                                    <View style={styles.icon}>
                                        {pos >= 3 && <Feather name="edit" size={23} color="white" onPress={() => router.push({ pathname: '(tabs)/Calendar/editEvent', params: { eventID: event._id } })} />}
                                        {pos >= 3 && <MaterialIcons name="delete" size={25} color="white" style={styles.iconSpacing} onPress={() => confirmDeleteAlert(event.Name, event._id)} />}
                                    </View>
                                </View>
                                <Text style={styles.eventText}>
                                    <MaterialIcons name="access-time-filled" size={15} color="white" /> {event.Time}{' '}
                                    <Entypo name="location-pin" size={17} color="white" /> {event.Location}
                                </Text>
                                <Text style={styles.eventText}>{event.Description}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollcontainer: {
        padding: 16,
    },
    container: {
        flexGrow: 1,
        height: '100%',
        backgroundColor: 'white',
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
        color: 'black',
        marginBottom: 8,
    },
    eventContainer: {
        backgroundColor: '#134b91',
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
        color: 'white',
    },
    eventText: {
        fontSize: 16,
        color: 'white',
        padding: 2,
        marginTop: 2,
    },
    label: {
        fontWeight: 'bold',
        color: '#333',
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    icon: {
        flexDirection: 'row',
    },
    iconSpacing: {
        marginLeft: 10,
    },
    addIcon: {
        marginRight: 10,
    },
});

export default index;
