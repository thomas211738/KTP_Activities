import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import React, { useState } from 'react';
import axios from 'axios';
import { useLocalSearchParams, router } from 'expo-router';
import { BACKEND_URL } from '@env';

const editEvent = () => {
  const { eventID } = useLocalSearchParams();
  const [eventName, setEventName] = React.useState('');
  const [eventDay, setEventDay] = React.useState('');
  const [eventTime, setEventTime] = React.useState('');
  const [eventLocation, setEventLocation] = React.useState('');
  const [eventDescription, setEventDescription] = React.useState('');
  const [eventPosition, setEventPosition] = React.useState('');

  React.useEffect(() => {
    axios.get(`${BACKEND_URL}/events/${eventID}`)
      .then((response) => {
        setEventName(response.data.Name);
        setEventDay(response.data.Day);
        setEventTime(response.data.Time);
        setEventLocation(response.data.Location);
        setEventDescription(response.data.Description);
        setEventPosition(response.data.Position);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [eventID]);

  const validateDate = (date) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) {
      return false;
    }

    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);

    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() + 1 !== month ||
      parsedDate.getDate() !== day
    ) {
      return false;
    }

    return true;
  };

  const handleEditEvent = () => {
    if (!eventName || !eventDay || !eventTime || !eventLocation || !eventDescription || !eventPosition) {
      Alert.alert('Validation Error', 'All fields are required and must be at least one character long.');
      return;
    }

    if (!validateDate(eventDay)) {
      Alert.alert('Invalid Date', 'Please enter a valid date in the format yyyy-mm-dd');
      return;
    }

    const data = {
      Name: eventName,
      Day: eventDay,
      Time: eventTime,
      Location: eventLocation,
      Description: eventDescription,
      Position: eventPosition
    };

    axios
      .put(`${BACKEND_URL}/events/${eventID}`, data)
      .then(() => {
        router.back();
      })
      .catch((error) => {
        console.log(error.message);
      });
  };

  return (
    <View style={styles.container}>
      
        <ScrollView contentInsetAdjustmentBehavior='automatic' automaticallyAdjustKeyboardInsets>
        <View style={styles.scrollContainer}>
        <View style={styles.top}>
          <Text style={styles.boxTitle}>Name</Text>
          <TextInput style={styles.boxEntry} onChangeText={setEventName} value={eventName} />
          <Text style={styles.boxTitle}>Date (yyyy-mm-dd)</Text>
          <TextInput style={styles.boxEntry} onChangeText={setEventDay} value={eventDay} />
          <Text style={styles.boxTitle}>Time</Text>
          <TextInput style={styles.boxEntry} onChangeText={setEventTime} value={eventTime} />
          <Text style={styles.boxTitle}>Location</Text>
          <TextInput style={styles.boxEntry} onChangeText={setEventLocation} value={eventLocation} />
          <Text style={styles.boxTitle}>Position</Text>
          <TextInput style={styles.boxEntry} onChangeText={setEventPosition} value={eventPosition} />
          <Text style={styles.boxTitle}>Description</Text>
          <TextInput style={[styles.boxEntry, { height: 55 }]} multiline onChangeText={setEventDescription} value={eventDescription} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleEditEvent}>
              <Text style={styles.buttonText}>Save Event</Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>

        </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#134b91',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  top: {
    margin: 20,
  },
  box: {
    marginVertical: 10,
  },
  boxTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 10,
  },
  boxEntry: {
    backgroundColor: '#d1d1d1',
    height: 40,
    padding: 10,
    borderRadius: 6,
    marginTop: 4,
    color: 'black',
    width: '100%',
  },
  bottom: {
    alignItems: 'center',
    padding: 12,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  button: {
    marginTop: 20,
    borderRadius: 8,
    backgroundColor: '#86ebba',
    width: 200,
    height: 40,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'darkgray',
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
  },
});

export default editEvent;
