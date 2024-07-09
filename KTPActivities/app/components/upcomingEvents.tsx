import React from 'react';
import { View, Text,Alert, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Entypo from '@expo/vector-icons/Entypo';
import { MaterialIcons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { format, parseISO } from 'date-fns';
import { BACKEND_URL } from '@env';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

const InformationPage = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  //TO-DO: Integrate pos state when file system is reorganized
  const [pos, setPos] = useState(3);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/events`);
      setEvents(response.data.data);
    } catch (err) {
      console.log(err);
    }
  }
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
      {text: 'Delete', onPress: () => deleteEvent(id), style: 'destructive'},
    ]);


  const deleteEvent = async (id) => {
    try{ 
      await axios.delete(`${BACKEND_URL}/events/${id}`);
      const updatedEvents = events.filter(event => event._id != id);
      setEvents(updatedEvents);
    } catch (err) {
      console.log(err);
    }
  }

  const handleaddEvent = () => {
    router.push('components/createEvent');
  };

  const groupedEvents = groupEventsByDate(events);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollcontainer} style={styles.container}>
      <View style={styles.iconview}>
      {pos >= 3 ? 
      
      <Ionicons name="add-circle-outline" size={33} color="black"  style={styles.addIcon} onPress={handleaddEvent}/> : ''}
      </View>
      {Object.keys(groupedEvents).map((date, index) => (
        <View key={index} style={styles.dateGroup}>
          <Text style={styles.eventDate}>{date}</Text>
          {groupedEvents[date].map((event, eventIndex) => (
            <View key={eventIndex} style={styles.eventWrapper}>
              <View style={styles.eventContainer}>
                <View style={styles.titleContainer}>
                  <Text style={styles.eventTitle}>{event.Name}</Text>
                  <View style={styles.icon}>
                  {pos >= 3 ?<Feather name="edit" size={23} color="black" onPress={() => 
                  router.push( {
                    pathname: 'components/editEvent',
                    params: { eventID: event._id },
                  })} /> : '' }
                  {pos >= 3 ? <MaterialIcons name="delete" size={25} color="black" style={styles.iconSpacing} onPress={() => confirmDeleteAlert(event.Name, event._id)}/> : ''}
                  </View >
                </View>
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
  scrollcontainer: {
    padding: 16,
  },
  container: {
    flexGrow: 1,
    height: '100%',
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
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  icon:{
    flexDirection: 'row',
  },
  iconSpacing:{
    marginLeft: 10,
  },
  iconview: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: -20
  },
  addIcon: {
    marginRight: 10
  },
});

export default InformationPage;
