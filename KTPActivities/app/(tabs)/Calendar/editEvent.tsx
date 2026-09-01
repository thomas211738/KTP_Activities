import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, useColorScheme } from 'react-native';
import React, { useState } from 'react';
import axios from 'axios';
import { useLocalSearchParams, router } from 'expo-router';
import { BACKEND_URL } from '@env';

const editEvent = () => {
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams();
  const eventID = params.eventID as string;

  const [eventName, setEventName] = useState((params.name as string) || '');
  const [eventDay, setEventDay] = useState((params.day as string) || '');
  const [eventTime, setEventTime] = useState((params.time as string) || '');
  const [eventLocation, setEventLocation] = useState((params.location as string) || '');
  const [eventDescription, setEventDescription] = useState((params.description as string) || '');
  const [eventPosition, setEventPosition] = useState((params.position as string) || '');

  // If not passed via params, fetch from backend
  React.useEffect(() => {
    if (!params.name && eventID) {
      axios.get(`${BACKEND_URL}/events/${eventID}`)
        .then((response) => {
          setEventName(response.data.Name || '');
          setEventDay(response.data.Day || '');
          setEventTime(response.data.Time || '');
          setEventLocation(response.data.Location || '');
          setEventDescription(response.data.Description || '');
          setEventPosition(response.data.Position?.toString() || '');
        })
        .catch((error) => {
          console.error("Error fetching event data:", error.response ? error.response.data : error.message);
        });
    }
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
        console.error("Error updating event:", error.response ? error.response.data : error.message);
      });
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff' }]}>
      <ScrollView contentInsetAdjustmentBehavior='automatic' automaticallyAdjustKeyboardInsets>
        <View style={styles.scrollContainer}>
          <View style={styles.top}>
            <Text style={[styles.boxTitle, { color: colorScheme === 'dark' ? '#ccc' : '#1a1a1a' }]}>Name</Text>
            <TextInput style={[styles.boxEntry, { backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : '#f0f0f0', color: colorScheme === 'dark' ? '#fff' : '#000' }]} onChangeText={setEventName} value={eventName} placeholderTextColor={colorScheme === 'dark' ? '#888' : '#aaa'} />
            <Text style={[styles.boxTitle, { color: colorScheme === 'dark' ? '#ccc' : '#1a1a1a' }]}>Date (yyyy-mm-dd)</Text>
            <TextInput style={[styles.boxEntry, { backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : '#f0f0f0', color: colorScheme === 'dark' ? '#fff' : '#000' }]} onChangeText={setEventDay} value={eventDay} placeholder="e.g. 2026-09-15" placeholderTextColor={colorScheme === 'dark' ? '#888' : '#aaa'} />
            <Text style={[styles.boxTitle, { color: colorScheme === 'dark' ? '#ccc' : '#1a1a1a' }]}>Time</Text>
            <TextInput style={[styles.boxEntry, { backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : '#f0f0f0', color: colorScheme === 'dark' ? '#fff' : '#000' }]} onChangeText={setEventTime} value={eventTime} placeholder="e.g. 7:00 - 9:00 PM" placeholderTextColor={colorScheme === 'dark' ? '#888' : '#aaa'} />
            <Text style={[styles.boxTitle, { color: colorScheme === 'dark' ? '#ccc' : '#1a1a1a' }]}>Location</Text>
            <TextInput style={[styles.boxEntry, { backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : '#f0f0f0', color: colorScheme === 'dark' ? '#fff' : '#000' }]} onChangeText={setEventLocation} value={eventLocation} placeholderTextColor={colorScheme === 'dark' ? '#888' : '#aaa'} />
            <Text style={[styles.boxTitle, { color: colorScheme === 'dark' ? '#ccc' : '#1a1a1a' }]}>Position</Text>
            <TextInput style={[styles.boxEntry, { backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : '#f0f0f0', color: colorScheme === 'dark' ? '#fff' : '#000' }]} onChangeText={setEventPosition} value={eventPosition} keyboardType="numeric" placeholder="e.g. 2" placeholderTextColor={colorScheme === 'dark' ? '#888' : '#aaa'} />
            <Text style={[styles.boxTitle, { color: colorScheme === 'dark' ? '#ccc' : '#1a1a1a' }]}>Description</Text>
            <TextInput style={[styles.boxEntry, { height: 80, backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : '#f0f0f0', color: colorScheme === 'dark' ? '#fff' : '#000' }]} multiline onChangeText={setEventDescription} value={eventDescription} placeholderTextColor={colorScheme === 'dark' ? '#888' : '#aaa'} />
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
    fontWeight: 'bold',
    marginTop: 14,
    fontSize: 15,
  },
  boxEntry: {
    height: 40,
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
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
    color: '#000',
    fontWeight: 'bold',
  },
});

export default editEvent;
