import { View, Text, TextInput, StyleSheet, TouchableOpacity} from 'react-native'
import React from 'react'
import axios from 'axios'
import { useLocalSearchParams, router } from 'expo-router';
import {BACKEND_URL} from '@env';

const editAlert = () => {
    const { alertID } = useLocalSearchParams();
    const [alertName, setAlertName] = React.useState('');
    const [alertDescription, setAlertDescription] = React.useState('');
    const [alertTime, setAlertTime] = React.useState('');

    React.useEffect(() => {
        axios.get(`${BACKEND_URL}/alerts/${alertID}`)
        .then((response) => {
            setAlertName(response.data.AlertName);
            setAlertDescription(response.data.Description);
            setAlertTime(response.data.Time);
        })
        .catch((error) => {
            console.log(error);
        });
    }, [alertID, BACKEND_URL]);

    const handleEditAlert = async () => {
        try {
            await axios.put(`${BACKEND_URL}/alerts/${alertID}`, {
                "AlertName": alertName,
                "Description": alertDescription,
                "Time": alertTime
            })
            router.back();
        } catch (err) {
            console.log(err.message);
        }
      };


return (
    <View style={styles.container}>
        <View style={styles.scrollContainer}>
            <View style={styles.top}>
                <Text style={styles.boxTitle}>Name</Text>
                <TextInput style={styles.boxEntry} onChangeText={setAlertName} value={alertName} />
                <Text style={styles.boxTitle}>Time</Text>
                <TextInput style={styles.boxEntry} onChangeText={setAlertTime} value={alertTime} />
                <Text style={styles.boxTitle}>Description</Text>
                <TextInput style={[styles.boxEntry, {height: 55}]} multiline onChangeText={setAlertDescription} value={alertDescription} />
                <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleEditAlert}
                        >
                            <Text style={styles.buttonText}>Save Event</Text>
                        </TouchableOpacity>
                    </View>
            </View>
        </View>

    </View>
)
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

export default editAlert