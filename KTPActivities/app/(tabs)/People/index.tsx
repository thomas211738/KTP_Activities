import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
    Pressable,
    TouchableOpacity,
    TextInput,
  } from 'react-native';
  import { router } from 'expo-router';
  import React, { useEffect, useState } from 'react';
  import { getAllUsersInfo } from '../../components/allUsersManager';
  import { getUserInfo } from '../../components/userInfoManager';
  import PeopleLoader from '../../components/loaders/poepleLoader';
  import axios from 'axios';
  import { BACKEND_URL } from '@env';
  import { Octicons } from '@expo/vector-icons';
  import { useColorScheme } from 'react-native';
  
  const Person = ({ user, image }) => {
    const colorScheme = useColorScheme();
    const textTheme = colorScheme === 'light' ? styles.textDark : styles.textLight;
  
    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: '(tabs)/People/profileId',
            params: { userID: user.id, userImage: image },
          })
        }
      >
        <View style={styles.personContainer}>
          {user.ProfilePhoto ? (
            <Image
              source={{ uri: image }}
              style={[styles.personImage, { borderRadius: 30 }]}
            />
          ) : (
            <Octicons
              name="feed-person"
              size={50}
              color={colorScheme === 'light' ? '#242424' : 'white'}
              style={{ borderRadius: 15, marginRight: 5 }}
            />
          )}
          <View>
            <Text style={[styles.personName, textTheme]}>
              {user.FirstName + ' ' + user.LastName}
            </Text>
            <Text style={styles.personMajors}>
              {user.Position === 3
                ? user.Eboard_Position
                : `${user.Major.join(' and ')} Major${
                    user.Minor.length !== 0 && user.Minor[0] !== ''
                      ? `, ${user.Minor.join(' and ')} Minor`
                      : ''
                  }`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  const Index = () => {
    const users = getAllUsersInfo();
    const user = getUserInfo();
    const [pos, setPos] = useState(0);
    const [search, setSearch] = useState('');
    const [filteredUsers, setFilteredUsers] = useState(
      users.filter((user) => user.Position === pos)
    );
    const [loading, setLoading] = useState(false);
    const [photos, setPhotos] = useState({});
    const colorScheme = useColorScheme();
  
    useEffect(() => {
      fetchAllPhotos();
    }, []);
  
    const fetchAllPhotos = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/photo/photos`);
        const photosData = {};
        response.data.data.forEach((photo) => {
          photosData[photo._id] = `data:image/png;base64,${photo.data}`;
        });
        setPhotos(photosData);
      } catch (err) {
        console.log(err.message);
      }
    };
  
    const searchUsers = (text) => {
      setSearch(text);
      setLoading(true);
      setFilteredUsers(
        users.filter((user) => {
          let name = user.FirstName + ' ' + user.LastName;
          return name.toLowerCase().includes(text.toLowerCase());
        })
      );
      setLoading(false);
    };
  
    const changePosition = (position) => {
      if (position !== pos) {
        setLoading(true);
        setSearch('');
        setPos(position);
        if (position === 2) {
          setFilteredUsers(users.filter((user) => user.Position === 2 || user.Position === 5));
        } else if (position === 0) {
          setFilteredUsers(users.filter((user) => user.Position === 0 || user.Position === 0.5));
        } else {
          setFilteredUsers(users.filter((user) => user.Position === position));
        }
        setLoading(false);
      }
    };
  
    const selectedButtonTheme =
      colorScheme === 'light' ? styles.selectedButtonLight : styles.selectedButtonDark;
    const unselectedButtonTheme =
      colorScheme === 'light' ? styles.unselectedButtonLight : styles.unselectedButtonDark;
    const containerTheme = colorScheme === 'light' ? styles.containerLight : styles.containerDark;
    const textTheme = colorScheme === 'light' ? styles.textDark : styles.textLight;
  
    return (
      <View style={[styles.container, containerTheme]}>
        <TextInput
          style={[styles.searchBar, textTheme]}
          placeholder="Search People"
          placeholderTextColor={colorScheme === 'light' ? '#888' : '#ccc'}
          value={search}
          onChangeText={searchUsers}
          autoCapitalize="none"
        />
        <ScrollView keyboardDismissMode="on-drag" contentInsetAdjustmentBehavior="automatic">
          <View style={styles.buttonsContainer}>
            <Pressable
              style={[styles.unselectedButton, unselectedButtonTheme, pos === 0 && selectedButtonTheme]}
              onPress={() => changePosition(0)}
            >
              <Text
                style={[
                  colorScheme === 'light' ? { color: 'black' } : { color: 'white' },
                  pos === 0 &&
                    (colorScheme === 'light'
                      ? { color: 'white', fontWeight: 'bold' }
                      : { color: 'black', fontWeight: 'bold' }),
                ]}
              >
                Rushees
              </Text>
            </Pressable>
            {user.Position >= 1 && (
              <Pressable
                style={[styles.unselectedButton, unselectedButtonTheme, pos === 1 && selectedButtonTheme]}
                onPress={() => changePosition(1)}
              >
                <Text
                  style={[
                    colorScheme === 'light' ? { color: 'black' } : { color: 'white' },
                    pos === 1 &&
                      (colorScheme === 'light'
                        ? { color: 'white', fontWeight: 'bold' }
                        : { color: 'black', fontWeight: 'bold' }),
                  ]}
                >
                  Pledges
                </Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.unselectedButton, unselectedButtonTheme, pos === 2 && selectedButtonTheme]}
              onPress={() => changePosition(2)}
            >
              <Text
                style={[
                  colorScheme === 'light' ? { color: 'black' } : { color: 'white' },
                  pos === 2 &&
                    (colorScheme === 'light'
                      ? { color: 'white', fontWeight: 'bold' }
                      : { color: 'black', fontWeight: 'bold' }),
                ]}
              >
                Brothers
              </Text>
            </Pressable>
            <Pressable
              style={[styles.unselectedButton, unselectedButtonTheme, pos === 3 && selectedButtonTheme]}
              onPress={() => changePosition(3)}
            >
              <Text
                style={[
                  colorScheme === 'light' ? { color: 'black' } : { color: 'white' },
                  pos === 3 &&
                    (colorScheme === 'light'
                      ? { color: 'white', fontWeight: 'bold' }
                      : { color: 'black', fontWeight: 'bold' }),
                ]}
              >
                E-Board
              </Text>
            </Pressable>
            {user.Position >= 1 && (
              <Pressable
                style={[styles.unselectedButton, unselectedButtonTheme, pos === 4 && selectedButtonTheme]}
                onPress={() => changePosition(4)}
              >
                <Text
                  style={{
                    ...(colorScheme === 'light' ? { color: 'black' } : { color: 'white' }),
                    ...(pos === 4 &&
                      (colorScheme === 'light'
                        ? { color: 'white', fontWeight: 'bold' }
                        : { color: 'black', fontWeight: 'bold' })),
                  }}
                >
                  Alumni
                </Text>
              </Pressable>
            )}
          </View>
  
          {loading ? (
            <PeopleLoader />
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <Person key={user.id} user={user} image={photos[user.ProfilePhoto]} />
            ))
          ) : (
            <View style={styles.noMembersContainer}>
              <Text style={[styles.noMembers, textTheme]}>No members found</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      marginTop: 10,
    },
    searchBar: {
      height: 40,
      margin: 10,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: '#f0f0f0',
      fontSize: 16,
    },
    textLight: {
      color: 'white',
    },
    textDark: {
      color: 'black',
    },
    containerLight: {
      backgroundColor: 'white',
    },
    containerDark: {
      backgroundColor: '#1a1a1a',
    },
    buttonsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 10,
      marginHorizontal: 10,
      marginTop: 5,
    },
    unselectedButton: {
      paddingVertical: 10,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unselectedButtonDark: {
      backgroundColor: '#363636',
    },
    unselectedButtonLight: {
      backgroundColor: 'lightgray',
    },
    selectedButtonLight: {
      backgroundColor: '#134b91',
    },
    selectedButtonDark: {
      backgroundColor: '#86ebba',
    },
    personContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: 5,
    },
    personImage: {
      width: 50,
      height: 50,
      borderRadius: 15,
      marginRight: 5,
    },
    personName: {
      fontWeight: 'bold',
      fontSize: 18,
    },
    personMajors: {
      color: 'gray',
      fontSize: 14,
      paddingRight: 70,
    },
    noMembersContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noMembers: {
      fontSize: 18,
    },
  });
  
  export default Index;