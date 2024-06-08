import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Entypo from '@expo/vector-icons/Entypo';
import { MaterialIcons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';

import { BACKEND_URL } from '@env';

const InformationPage = ({ navigation }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/events`)
      .then((response) => {
        setEvents(response.data.data);
      })
      .catch((error) => {
        console.log(error);
      });
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

  const groupedEvents = groupEventsByDate(events);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {Object.keys(groupedEvents).map((date, index) => (
        <View key={index} style={styles.dateGroup}>
          <Text style={styles.eventDate}>{date}</Text>
          {groupedEvents[date].map((event, eventIndex) => (
            <View key={eventIndex} style={styles.eventWrapper}>
              <View style={styles.eventContainer}>
                <Text style={styles.eventTitle}>{event.Name}</Text>
                <Text style={styles.eventText}>
                  <MaterialIcons name="access-time-filled" size={15} color="black" /> {event.Time}{' '}
                  <Entypo name="location-pin" size={17} color="black" /> {event.Location}
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
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
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
    color: '#333',
    marginBottom: 8,
  },
  eventContainer: {
    backgroundColor: '#fff',
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
    color: '#333',
  },
  eventText: {
    fontSize: 16,
    color: '#555',
    padding: 2,
    marginTop: 2,
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
  },
});

export default InformationPage;
