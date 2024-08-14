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
import { getUserInfo } from '../../components/userInfoManager';


const index = ({ navigation }) => {
    const colorScheme = useColorScheme();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const userInfo = getUserInfo();

    const fetchEvents = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/events`);
            const events = response.data.data.filter((event) => event.Position <= userInfo.Position);
            const sortedEvents = events.sort((a, b) => new Date(a.Day) - new Date(b.Day));
            setEvents(sortedEvents);
            setLoading(false);
        } catch (err) {
            console.log(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

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
                                                    {userInfo.Position.toString() === "3" || userInfo.Position.toString() === "5" ? (
                                                        <Feather
                                                            name="edit"
                                                            size={23}
                                                            color={colorScheme === 'light' ? "white" : "black"}
                                                            onPress={() => {
                                                                router.push({ pathname: '(tabs)/Calendar/editEvent', params: { eventID: event._id } });
                                                            }}
                                                        />
                                                    ):""}
                                                    {userInfo.Position === 3 || userInfo.Position === 5 ? (
                                                        <MaterialIcons
                                                            name="delete"
                                                            size={25}
                                                            color={colorScheme === 'light' ? "white" : "black"}
                                                            style={styles.iconSpacing}
                                                            onPress={() => confirmDeleteAlert(event.Name, event._id)}
                                                        />
                                                    ): ""}
                                                </View>
                                            </View>
                                            <Text style={[styles.eventText, themeTextStyle]}>
                                                <MaterialIcons name="access-time-filled" size={15} color={colorScheme === 'light' ? "white" : "black"} /> {event.Time}{' '}
                                                <Entypo name="location-pin" size={17} color={colorScheme === 'light' ? "white" : "black"} /> {event.Location}
                                            </Text>
                                            <Text style={[styles.eventText, themeTextStyle]}>{event.Description}</Text>
                                            <View style={styles.positionContainer}>
                                                <View style={[styles.positionTextContainer, positionTextStyle]}>
                                                    <Text style={themeTitleTextStyle}>{positions[event.Position]}</Text>
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
});

export default index;
