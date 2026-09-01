import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, useColorScheme, Platform } from 'react-native';
import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
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

  const [eventName, setEventName] = useState('');
  const [eventDay, setEventDay] = useState<Date | null>(null);
  const [eventStartTime, setEventStartTime] = useState<Date | null>(null);
  const [eventEndTime, setEventEndTime] = useState<Date | null>(null);
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventPosition, setEventPosition] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const inputStyle = [styles.boxEntry, {
    backgroundColor: isDark ? INPUT_BG.dark   : INPUT_BG.light,
    color:           isDark ? INPUT_TEXT.dark : INPUT_TEXT.light,
  }];
  const labelStyle = [styles.boxTitle, { color: isDark ? LABEL_TEXT.dark : LABEL_TEXT.light }];
  const ph = isDark ? PLACEHOLDER.dark : PLACEHOLDER.light;

  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const formatTime12 = (d: Date) => {
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  const timeString = () => {
    if (eventStartTime && eventEndTime) return `${formatTime12(eventStartTime)} - ${formatTime12(eventEndTime)}`;
    if (eventStartTime) return formatTime12(eventStartTime);
    return '';
  };

  const handleCreateEvent = () => {
    if (!eventName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for the event.');
      return;
    }
    axios
      .post(`${BACKEND_URL}/events`, {
        Name: eventName,
        Day: eventDay ? formatDate(eventDay) : '',
        Time: timeString(),
        Location: eventLocation,
        Description: eventDescription,
        Position: eventPosition || '0',
      })
      .then(() => router.back())
      .catch((error) => {
        console.error('Error creating event:', error.response ? error.response.data : error.message);
        Alert.alert('Error', 'Failed to create event. Please try again.');
      });
  };

  const pickerBtnStyle = [styles.pickerButton, { backgroundColor: isDark ? INPUT_BG.dark : INPUT_BG.light }];
  const pickerTxtStyle = { color: isDark ? INPUT_TEXT.dark : INPUT_TEXT.light, fontSize: 15 as const };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled">
        <View style={styles.form}>

          <View style={styles.field}>
            <Text style={labelStyle}>Name</Text>
            <TextInput style={inputStyle} value={eventName} onChangeText={setEventName}
              placeholder="e.g. Rush Night" placeholderTextColor={ph}
              returnKeyType="next" accessibilityLabel="Event name" />
          </View>

          <View style={styles.field}>
            <Text style={labelStyle}>Date</Text>
            <TouchableOpacity style={pickerBtnStyle} onPress={() => { setShowStartPicker(false); setShowEndPicker(false); setShowDatePicker(true); }}>
              <Text style={[pickerTxtStyle, !eventDay && { color: ph }]}>
                {eventDay ? formatDate(eventDay) : 'Select date…'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker value={eventDay || new Date()} mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                minimumDate={new Date()} themeVariant={isDark ? 'dark' : 'light'}
                onChange={(_, d) => { if (Platform.OS === 'android') setShowDatePicker(false); if (d) setEventDay(d); }} />
            )}
          </View>

          <View style={styles.field}>
            <Text style={labelStyle}>Start Time</Text>
            <TouchableOpacity style={pickerBtnStyle} onPress={() => { setShowDatePicker(false); setShowEndPicker(false); setShowStartPicker(true); }}>
              <Text style={[pickerTxtStyle, !eventStartTime && { color: ph }]}>
                {eventStartTime ? formatTime12(eventStartTime) : 'Select start time…'}
              </Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker value={eventStartTime || new Date()} mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                themeVariant={isDark ? 'dark' : 'light'}
                onChange={(_, d) => { if (Platform.OS === 'android') setShowStartPicker(false); if (d) setEventStartTime(d); }} />
            )}
          </View>

          <View style={styles.field}>
            <Text style={labelStyle}>End Time</Text>
            <TouchableOpacity style={pickerBtnStyle} onPress={() => { setShowDatePicker(false); setShowStartPicker(false); setShowEndPicker(true); }}>
              <Text style={[pickerTxtStyle, !eventEndTime && { color: ph }]}>
                {eventEndTime ? formatTime12(eventEndTime) : 'Select end time…'}
              </Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker value={eventEndTime || eventStartTime || new Date()} mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                themeVariant={isDark ? 'dark' : 'light'}
                onChange={(_, d) => { if (Platform.OS === 'android') setShowEndPicker(false); if (d) setEventEndTime(d); }} />
            )}
          </View>

          <View style={styles.field}>
            <Text style={labelStyle}>Location</Text>
            <TextInput style={inputStyle} value={eventLocation} onChangeText={setEventLocation}
              placeholder="e.g. Photonics Center 206" placeholderTextColor={ph}
              returnKeyType="next" accessibilityLabel="Event location" />
          </View>

          <View style={styles.field}>
            <Text style={labelStyle}>Position (visibility)</Text>
            <TextInput style={inputStyle} value={eventPosition} onChangeText={setEventPosition}
              placeholder="0=Rushees  2=Brothers  3=Eboard" placeholderTextColor={ph}
              keyboardType="numeric" returnKeyType="next" />
          </View>

          <View style={styles.field}>
            <Text style={labelStyle}>Description</Text>
            <TextInput style={[inputStyle, styles.multiline]} value={eventDescription} onChangeText={setEventDescription}
              placeholder="What should attendees know about this event?" placeholderTextColor={ph}
              multiline returnKeyType="done" />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleCreateEvent} accessibilityRole="button">
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
  form: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48 },
  field: { marginBottom: 20 },
  boxTitle: { fontWeight: '600', fontSize: 14, marginBottom: 6, letterSpacing: 0.2 },
  boxEntry: { height: 46, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, fontSize: 15, width: '100%' },
  pickerButton: { height: 46, paddingHorizontal: 14, borderRadius: 10, justifyContent: 'center', width: '100%' },
  multiline: { height: 96, paddingTop: 12, textAlignVertical: 'top' },
  buttonContainer: { alignItems: 'center', marginTop: 8 },
  button: { borderRadius: 10, backgroundColor: '#86ebba', width: '100%', height: 48, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
});

export default createEvent;
