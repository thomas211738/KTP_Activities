
import { View, Text, ScrollView, StyleSheet, Image, Pressable, TouchableOpacity, Platform, useColorScheme } from 'react-native'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { getAllUsersInfo } from '../../components/allUsersManager'
import { useNavigation } from '@react-navigation/native'
import { getUserInfo } from '../../components/userInfoManager';
import PeopleLoader from '../../components/loaders/poepleLoader';
import axios from 'axios';
import { BACKEND_URL } from '@env';

const Person = (props) => {
    const colorScheme = useColorScheme();

    const textTheme = colorScheme === 'light' ? styles.textDark : styles.textLight ;
    return (
        <TouchableOpacity onPress={() => router.push({ pathname: '(tabs)/People/profileId', params: { userID: props.user._id } })}>
            <View style={styles.personContainer}>
                {
                    props.user.ProfilePhoto ?
                        <Image 
                            source={{ uri: props.image }} 
                            style={[styles.personImage, { borderRadius: 30 }]} 
                        />
                        :
                        <Image 
                            source={require("../../../img/ktplogopng.png")} 
                            style={styles.personImage} 
                        />
                }
                <View>
                    <Text style={[styles.personName, textTheme]}>
                        {props.user.FirstName + " " + props.user.LastName}
                    </Text>
                    <Text style={styles.personMajors}>
                        {props.user.Position == 3 ?
                            props.user.Eboard_Position :
                            `${props.user.Major.join(" and ")} Major${props.user.Minor.length !== 0 && props.user.Minor[0] !== "" ? `, ${props.user.Minor.join(" and ")} Minor` : ''}`
                        }
                    </Text>
                </View>
            </View>
        </TouchableOpacity>

    )
}

const index = () => {
    const users = getAllUsersInfo();
    const user = getUserInfo();
    const [pos, setPos] = React.useState(0);
    const [search, setSearch] = React.useState('');
    const [filteredUsers, setFilteredUsers] = React.useState(users.filter(user => user.Position === pos));
    const [loading, setLoading] = React.useState(false);
    const [photos, setPhotos] = React.useState({});
    const navigation = useNavigation();
    const colorScheme = useColorScheme();

    useEffect(() => {
        fetchAllPhotos();
    }, []);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerSearchBarOptions: {
                placeholder: "Search People",
                textColor: colorScheme === 'dark' ? 'black' : 'white',
                onChangeText: (event) => searchUsers(event.nativeEvent.text),
                hideWhenScrolling: false,
            },
        });
    }, [colorScheme]);

    const fetchAllPhotos = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/users/photo/all`);
            const photosData = {};
            response.data.data.forEach(photo => {
                photosData[photo.fileid] = `data:image/png;base64,${photo.data}`;   
            });
            setPhotos(photosData);
        } catch (err) {
            console.log(err.message);
        }
    }

    const searchUsers = (text) => {
        setSearch(text);
        setLoading(true);
        setFilteredUsers(users.filter(
            (user) => {
                let name = user.FirstName + " " + user.LastName;
                return name.toLowerCase().includes(text.toLowerCase());
            })
        )
        setLoading(false);
    }

    const changePosition = (position) => {
        if (position !== pos) {
            setLoading(true);
            setSearch('');
            setPos(position);
            if (position === 2) {
                setFilteredUsers(users.filter(user => user.Position === 2 || user.Position === 5));
            } else {
                setFilteredUsers(users.filter(user => user.Position === position));
            }
            setLoading(false);
        }
    }

    const selectedButtonTheme = colorScheme === 'light' ? styles.selectedButtonLight :  styles.selectedButtonDark ;
    const unselectedButtonTheme = colorScheme === 'light' ? styles.unselectedButtonLight : styles.unselectedButtonDark;
    const containerTheme = colorScheme === 'light' ? styles.containerLight : styles.containerDark ;
    const textTheme = colorScheme === 'light' ? styles.textDark : styles.textLight ;


    return (
        <View style={[styles.container, containerTheme]}>
            <ScrollView keyboardDismissMode='on-drag' contentInsetAdjustmentBehavior='automatic'>

            <View style={styles.buttonsContainer}>
            <Pressable 
                style={[styles.unselectedButton,unselectedButtonTheme, pos == 0 && selectedButtonTheme]}
                onPress={() => changePosition(0)}
            >
                <Text style={[(colorScheme === 'light' ? { color: 'black'} : { color: 'white'}), pos == 0 && (colorScheme === 'light' ? {color: 'white', fontWeight: 'bold'} : {color: 'black', fontWeight: 'bold'})]}>Rushees</Text>
            </Pressable>
            {user.Position >= 1 && (
                <>
                <Pressable 
                    style={[styles.unselectedButton,unselectedButtonTheme, pos == 1 && selectedButtonTheme]}
                    onPress={() => changePosition(1)}
                >
                    <Text style={[(colorScheme === 'light' ? { color: 'black'} : { color: 'white'}), pos == 1 && (colorScheme === 'light' ? {color: 'white', fontWeight: 'bold'} : {color: 'black', fontWeight: 'bold'})]}>Pledges</Text>
                </Pressable>
                </>
            )}
            <Pressable 
                style={[styles.unselectedButton,unselectedButtonTheme, pos == 2 && selectedButtonTheme]}
                onPress={() => changePosition(2)}
            >
                <Text style={[(colorScheme === 'light' ? { color: 'black'} : { color: 'white'}), pos == 2 && (colorScheme === 'light' ? {color: 'white', fontWeight: 'bold'} : {color: 'black', fontWeight: 'bold'})]}>Brothers</Text>
            </Pressable>
            <Pressable 
                style={[styles.unselectedButton,unselectedButtonTheme, pos == 3 && selectedButtonTheme]}
                onPress={() => changePosition(3)}
            >
                <Text style={[(colorScheme === 'light' ? { color: 'black'} : { color: 'white'}), pos == 3 && (colorScheme === 'light' ? {color: 'white', fontWeight: 'bold'} : {color: 'black', fontWeight: 'bold'})]}>E-Board</Text>
            </Pressable>
            {user.Position >= 1 && (
                <>
                <Pressable 
                    style={[styles.unselectedButton,unselectedButtonTheme, pos == 4 && selectedButtonTheme]}
                    onPress={() => changePosition(4)}
                >
                    <Text style={[(colorScheme === 'light' ? { color: 'black'} : { color: 'white'}), pos == 4 && (colorScheme === 'light' ? {color: 'white', fontWeight: 'bold'} : {color: 'black', fontWeight: 'bold'})]}>Alumni</Text>
                </Pressable>
                </>
            )}
            </View>
            
            {loading ? (
                <PeopleLoader />
            ) : (
                filteredUsers.length > 0 ? filteredUsers.map((user) => (
                    <Person
                    key={user._id}
                    user={user}
                    />
                )) : (
                    <View style={styles.noMembersContainer}>
                    <Text style={[styles.noMembers, textTheme]}>No members found</Text>
                    </View>
                )
            )}            

            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 10,
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
        marginTop: 5
    },
    unselectedButton: {
        paddingVertical: 10,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    unselectedButtonDark: {
        backgroundColor: '#363636',
    },
    unselectedButtonLight: {
        backgroundColor: 'lightgray',
    },
    selectedButtonLight: {
        backgroundColor: '#134b91'
    },
    selectedButtonDark: {
        backgroundColor: '#86ebba'

    },
    personContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 5
    },
    personImage: {
        width: 50,
        height: 50,
        borderRadius: 15,
        marginRight: 5
    },
    personName: {
        fontWeight: 'bold',
        fontSize: 18
    },
    personMajors: {
        color: 'gray',
        fontSize: 14,
        paddingRight: 70
    },
    noMembersContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    noMembers: {
        fontSize: 18
    }
})

export default index