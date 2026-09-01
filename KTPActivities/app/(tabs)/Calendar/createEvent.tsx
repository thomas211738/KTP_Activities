import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, useColorScheme } from 'react-native';
import React from 'react';
import axios from 'axios';
import { router } from 'expo-router';
import { BACKEND_URL } from '@env';

// Shared colours — darker inputs so they stand out against the background
const INPUT_BG    = { light: '#e2e2e2', dark: '#252525' };
const INPUT_TEXT  = { light: '#000',    dark: '#f0f0f0' };
const LABEL_TEXT  = { light: '#111',    dark: '#d0d0d0' };
const PLACEHOLDER = { light: '#888',    dark: '#666'    };

const createEvent = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [eventName, setEventName] = React.useState('');
  const [eventDay, setEventDay] = React.useState('');
  const [eventTime, setEventTime] = React.useState('');
  const [eventLocation, setEventLocation] = React.useState('');
  const [eventDescription, setEventDescription] = React.useState('');
  const [eventPosition, setEventPosition] = React.useState('');

  const inputStyle = [styles.boxEntry, {
    backgroundColor: isDark ? INPUT_BG.dark   : INPUT_BG.light,
    color:           isDark ? INPUT_TEXT.dark : INPUT_TEXT.light,
  }];
  const labelStyle = [styles.boxTitle, { color: isDark ? LABEL_TEXT.dark : LABEL_TEXT.light }];
  const ph = isDark ? PLACEHOLDER.dark : PLACEHOLDER.light;

  const validateDate = (date) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;
    const [year, month, day] = date.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);
    return parsed.getFullYear() === year && parsed.getMonth() + 1 === month && parsed.getDate() === day;
  };

  const handleCreateEvent = () => {
    if (!eventName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for the event.');
      return;
    }
    if (eventDay && !validateDate(eventDay)) {
      Alert.alert('Invalid Date', 'Please enter a valid date in the format YYYY-MM-DD.');
      return;
    }
    axios
      .post(`${BACKEND_URL}/events`, {
        Name: eventName, Day: eventDay, Time: eventTime,
        Location: eventLocation, Description: eventDescription, Position: eventPosition || '0',
      })
      .then(() => router.back())
      .catch((error) => {
        console.error('Error creating event:', error.response ? error.response.data : error.message);
        Alert.alert('Error', 'Failed to create event. Please try again.');
      });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled">
        <View style={styles.form}>

          <View style={styles.field}>
            <Text style={labelStyle} accessibilityRole="text">Name</Text>
            <TextInput style={inputStyle} value={eventName} onChangeText={setEventName}
              placeholder="e.g. Rush Night" placeholderTextColor={ph}
              returnKeyType="next" accessibilityLabel="Event name" accessibilityHint="Enter the name of the event" />
          </View>

          <View style={styles.field}>
            <Text style={labelStyle} accessibilityRole="text">Date</Text>
            <TextInput style={inputStyle} value={eventDay} onChangeText={setEventDay}
              placeholder="YYYY-MM-DD  e.g. 2026-09-15" placeholderTextColor={ph}
              keyboardType="numbers-and-punctuation" returnKeyType="next"
              accessibilityLabel="Event date" accessibilityHint="Enter the date in YYYY-MM-DD format" />
          </View>

          <View style={styles.field}>
            <Text style={labelStyle} accessibilityRole="text">Time</Text>
            <TextInput style={inputStyle} value={eventTime} onChangeText={setEventTime}
              placeholder="e.g. 7:00 - 9:00 PM" placeholderTextColor={ph}
              returnKeyType="next" accessibilityLabel="Event time" accessibilityHint="Enter the start and end time" />
          </View>

          <View style={styles.field}>
            <Text style={labelStyle} accessibilityRole="text">Location</Text>
            <TextInput style={inputStyle} value={eventLocation} onChangeText={setEventLocation}
              placeholder="e.g. Photonics Center 206" placeholderTextColor={ph}
              returnKeyType="next" accessibilityLabel="Event location" accessibilityHint="Enter the location or room" />
          </View>

          <View style={styles.field}>
            <Text style={labelStyle} accessibilityRole="text">Position (visibility)</Text>
            <TextInput style={inputStyle} value={eventPosition} onChangeText={setEventPosition}
              placeholder="0=Rushees  2=Brothers  3=Eboard" placeholderTextColor={ph}
              keyboardType="numeric" returnKeyType="next"
              accessibilityLabel="Position visibility level" accessibilityHint="0 shows to rushees, 2 to brothers, 3 to Eboard" />
          </View>

          <View style={styles.field}>
            <Text style={labelStyle} accessibilityRole="text">Description</Text>
            <TextInput style={[inputStyle, styles.multiline]} value={eventDescription} onChangeText={setEventDescription}
              placeholder="What should attendees know about this event?" placeholderTextColor={ph}
              multiline returnKeyType="done"
              accessibilityLabel="Event description" accessibilityHint="Enter a short description of the event" />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleCreateEvent}
              accessibilityRole="button" accessibilityLabel="Create event" accessibilityHint="Saves and publishes this event">
              <Text style={styles.buttonText}>Create Event</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
  },
  field: {
    marginBottom: 20,
  },
  boxTitle: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  boxEntry: {
    height: 46,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 15,
    width: '100%',
  },
  multiline: {
    height: 96,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  button: {
    borderRadius: 10,
    backgroundColor: '#86ebba',
    width: '100%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default createEvent;
