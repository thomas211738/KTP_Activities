
import React from 'react';
import { View, Text,ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Entypo from '@expo/vector-icons/Entypo';
import { MaterialIcons } from '@expo/vector-icons';

import {BACKEND_URL} from "@env";


const InformationPage = ({navigation}) => {
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


  return (
    <ScrollView contentContainerStyle={styles.container}>
      {events.map((event, index) => (
        <View key={index} style={styles.eventContainer}>
          <Text style={styles.eventTitle}>{event.Name}</Text>
          <Text style={styles.eventText}><Text style={styles.label}>Day:</Text> {event.Day}</Text>
          <Text style={styles.eventText}><MaterialIcons name="access-time-filled" size={15} color="black" /> {event.Time}     <Entypo name="location-pin" size={15} color="black" />{event.Location}</Text>
          <Text style={styles.eventText}><Text style={styles.label}>Description:</Text> {event.Description}</Text>
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
  eventContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
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
    padding: 2
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
  },
});

export default InformationPage;