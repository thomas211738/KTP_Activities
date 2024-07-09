import { View, Text, TextInput, StyleSheet, TouchableOpacity} from 'react-native'
import React from 'react'
import axios from 'axios'
import { router } from 'expo-router';
import {BACKEND_URL} from '@env';

const createEvent = () => {
    const [eventName, setEventName] = React.useState('');
    const [eventDay, setEventDay] = React.useState('');
    const [eventTime, setEventTime] = React.useState('');
    const [eventLocation, setEventLocation] = React.useState('');
    const [eventPosition, setEventPosition] = React.useState('');
    const [eventDescription, setEventDescription] = React.useState('');

    const handleCreateEvent = () => {
        const data = {
            Name: eventName,
            Day: eventDay,
            Time: eventTime,
            Location: eventLocation,
            Position: eventPosition,
            Description: eventDescription,
        };
        axios
          .post(`${BACKEND_URL}/events`, data)
          .then(() => {
            router.back();
          })
          .catch((error) => {
            // alert('An error happened. Please Chack console');
            console.log(error.message);
          });
    };

  return (
    <View style={styles.container}>
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
                <TextInput style={[styles.boxEntry, {height: 55}]} multiline onChangeText={setEventDescription} value={eventDescription} />
                <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleCreateEvent}
                        >
                            <Text style={styles.buttonText}>Create Event</Text>
                        </TouchableOpacity>
                    </View>
            </View>
        </View>

    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#5E89B3',
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
      backgroundColor: '#3D3D3D',
      height: 40,
      padding: 10,
      borderRadius: 6,
      marginTop: 4,
      color: 'white',
      width: "100%",
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
      backgroundColor: '#1be347',
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

export default createEvent