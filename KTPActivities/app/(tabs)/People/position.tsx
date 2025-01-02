import React, { useState, useEffect } from 'react';
import { 
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useColorScheme
} from 'react-native';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { IP_ADDRESS } from '@env';

const Position = () => {
  const { userID } = useLocalSearchParams();
  const [currentPosition, setCurrentPosition] = useState('');
  const [newPosition, setNewPosition] = useState(null); // store as number
  const [currentEboardPosition, setCurrentEboardPosition] = useState('');
  const [newEboardPosition, setNewEboardPosition] = useState('');

  const colorScheme = useColorScheme();
  const containerTheme = colorScheme === 'light' ? styles.containerLight : styles.containerDark;
  const cardTheme = colorScheme === 'light' ? styles.cardSlightlyDarker : styles.cardDark;
  const textTheme = colorScheme === 'light' ? styles.lightText : styles.darkText;
  const separatorTheme = colorScheme === 'light' ? styles.separatorLight : styles.separatorDark;
  

  const positionMap = {
    0: 'Open Rushees',
    0.5: 'Closed Rushees',
    1: 'Pledges',
    2: 'Brothers',
    3: 'Eboard',
    4: 'Alumni',
    5: 'SuperAdmin',
  };

  const eboardPositions = [
    'Co-President',
    'VP of Finance',
    'VP of Professional Development',
    'VP of Technical Development',
    'VP of Engagement',
    'VP of External Affairs',
    'VP of Internal Affairs',
    'VP of Marketing',
    'VP of Recruitment',
    'VP of Membership',
  ];

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get(`${IP_ADDRESS}/users/${userID}`);
        // The API presumably returns numeric positions. Make sure to handle 0.5 if that’s valid in your backend.
        setCurrentPosition(response.data.Position);
        if (response.data.Position === 3) {
          setCurrentEboardPosition(response.data.Eboard_Position);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    if (userID) fetchUserInfo();
  }, [userID]);

  const handleSubmit = () => {
    if (newPosition === null) {
      Alert.alert('Error', 'New position is required.');
      return;
    }

    if (newPosition === 3 && newEboardPosition === '') {
      Alert.alert('Error', 'New Eboard position is required.');
      return;
    }

    if (newPosition === 3) {
      axios.put(`${IP_ADDRESS}/users/${userID}`, {
        Position: newPosition,
        Eboard_Position: newEboardPosition,
      })
        .then(() => {
          Alert.alert('Success', 'Position updated successfully.');
        })
        .catch((error) => {
          console.error('Error updating position:', error);
          Alert.alert('Error', 'An error occurred while updating the position.');
        });
        return;
    }

    axios.put(`${IP_ADDRESS}/users/${userID}`, { Position: newPosition, Eboard_Position: '' })
      .then(() => {
        Alert.alert('Success', 'Position updated successfully.');
      })
      .catch((error) => {
        console.error('Error updating position:', error);
        Alert.alert('Error', 'An error occurred while updating the position.');
      });
    
  };

  return (

    <View style={[styles.bigconatiner, containerTheme]}>    
    <ScrollView contentContainerStyle={[styles.container, containerTheme]}>

      <Text style={[styles.label, textTheme]}>
        Current Position: {positionMap[currentPosition] || 'Loading...'}
      </Text>

      {currentPosition === 3 && (
        <Text style={[styles.label, textTheme]}>
          Current Eboard Position: {currentEboardPosition || 'None'}
        </Text>
      )}

      {/* Select New Position */}
      <Text style={[styles.containertitle, textTheme]}>New Position</Text>
      <View style={[styles.card, cardTheme]}>
        {Object.keys(positionMap).map((key) => {
          const numericKey = parseFloat(key); // convert the string key to number
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.cardItem,
                { marginBottom: 10 },
                newPosition === numericKey && {
                  backgroundColor: colorScheme === 'light' ? '#ddd' : '#555'
                },
              ]}
              onPress={() => setNewPosition(numericKey)}
            >
              <View style={styles.cardContent}>
                <View style={styles.checkboxContainer}>
                  {newPosition === numericKey && (
                    <AntDesign
                      name="checkcircle"
                      size={18}
                      color={colorScheme === 'light' ? '#333' : '#ccc'}
                    />
                  )}
                </View>
                <Text style={[styles.cardText, textTheme]}>
                  {positionMap[numericKey]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>


      {/* Select New Eboard Position if newPosition === 3 */}
      {newPosition === 3 && (
        <>
         <View style={styles.seperator}></View>
          <Text style={[styles.containertitle, textTheme]}>New Eboard Position</Text>
          <View style={[styles.card, cardTheme]}>
            {eboardPositions.map((position) => (
              <TouchableOpacity
                key={position}
                style={[
                  styles.cardItem,
                  { marginBottom: 10 },
                  newEboardPosition === position && {
                    backgroundColor: colorScheme === 'light' ? '#ddd' : '#555'
                  },
                ]}
                onPress={() => setNewEboardPosition(position)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.checkboxContainer}>
                    {newEboardPosition === position && (
                      <AntDesign
                        name="checkcircle"
                        size={18}
                        color={colorScheme === 'light' ? '#333' : '#ccc'}
                      />
                    )}
                  </View>
                  <Text style={[styles.cardText, textTheme]}>
                    {position}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity style={[styles.nextButton, cardTheme]} onPress={handleSubmit}>
        <Text style={[styles.nextButtonText, textTheme]}>Update Position</Text>
      </TouchableOpacity>

    </ScrollView>
    </View>
  );
};

export default Position;

const styles = StyleSheet.create({
    bigconatiner:{
        flex: 1,
        justifyContent: 'center',
    },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  containerLight: {
    backgroundColor: 'white',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  containertitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: -15,
  },
  label: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 20,
  },
  seperator: {
    height: 1,
    width: '100%',
    backgroundColor: '#ddd',
    marginVertical: 20,
  },
  cardSlightlyDarker: {
    backgroundColor: '#ededed',
  },
  cardDark: {
    backgroundColor: '#333',
  },
  cardItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    fontSize: 16,
    fontWeight: '600',
  },
  lightText: {
    color: '#333',
  },
  darkText: {
    color: '#ccc',
  },
  nextButton: {
    marginTop: 20,
    borderRadius: 8,
    paddingVertical: 10,
    alignSelf: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,

  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  separatorLight: {
    backgroundColor: '#ddd',
  },
  separatorDark: {
    backgroundColor: '#444',
  },
});
