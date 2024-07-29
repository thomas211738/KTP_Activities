
import { View, Text, ScrollView, StyleSheet, Image, Pressable, TouchableOpacity} from 'react-native'
import { router } from 'expo-router'
import React from 'react'
import { getAllUsersInfo } from '../../components/allUsersManager'
import { useNavigation } from '@react-navigation/native'
import { getUserInfo } from '../../components/userInfoManager'; 
import PeopleLoader from '../../components/loaders/poepleLoader';

const Person = (props) => {
    return (
        <TouchableOpacity onPress={() => router.push({ pathname: '(tabs)/People/profileId', params: { userID: props.user._id } })}>
                    <View style={styles.personContainer}>
            <Image source={require("../../../img/ktplogopng.png")} style={styles.personImage} />
            <View>
                <Text style={styles.personName}>
                    {props.user.FirstName + " " + props.user.LastName}
                </Text>
                <Text style={styles.personMajors}>
                    {props.user.Position == 3 ? 
                        props.user.Eboard_Position :
                        `${props.user.Major.join(" and")} Major${props.user.Minor.length !== 0 && props.user.Minor[0] !== "" ? `, ${props.user.Minor.join(" and ")} Minor` : ''}`
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
    const [pos, setPos] = React.useState(2);
    const [search, setSearch] = React.useState('');
    const [filteredUsers, setFilteredUsers] = React.useState(users.filter(user => user.Position === pos));
    const [loading, setLoading] = React.useState(false);
    const navigation = useNavigation();

    React.useLayoutEffect(() => {
        navigation.setOptions({
          headerSearchBarOptions: {
            placeholder: "Search People",
            onChangeText: (event) => searchUsers(event.nativeEvent.text),
            hideWhenScrolling: false,
          },
        });
      }, [navigation]);

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
        if(position !== pos) {
            setLoading(true);
            setSearch('');
            setPos(position);
            setFilteredUsers(users.filter(user => user.Position === position));
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <ScrollView keyboardDismissMode='on-drag' contentInsetAdjustmentBehavior='automatic'>
            <View style={styles.buttonsContainer}>
            <Pressable 
                style={[styles.unselectedButton, pos == 0 && styles.selectedButton]}
                onPress={() => changePosition(0)}
            >
                <Text style={[{color: 'black'}, pos == 0 && {color: 'white', fontWeight: 'bold'}]}>Rushees</Text>
            </Pressable>
            {user.Position >= 1 && (
                <>
                <Pressable 
                    style={[styles.unselectedButton, pos == 1 && styles.selectedButton]}
                    onPress={() => changePosition(1)}
                >
                    <Text style={[{color: 'black'}, pos == 1 && {color: 'white', fontWeight: 'bold'}]}>Pledges</Text>
                </Pressable>
                </>
            )}
            <Pressable 
                style={[styles.unselectedButton, pos == 2 && styles.selectedButton]}
                onPress={() => changePosition(2)}
            >
                <Text style={[{color: 'black'}, pos == 2 && {color: 'white', fontWeight: 'bold'}]}>Brothers</Text>
            </Pressable>
            <Pressable 
                style={[styles.unselectedButton, pos == 3 && styles.selectedButton]}
                onPress={() => changePosition(3)}
            >
                <Text style={[{color: 'black'}, pos == 3 && {color: 'white', fontWeight: 'bold'}]}>E-Board</Text>
            </Pressable>
            {user.Position >= 1 && (
                <>
                <Pressable 
                    style={[styles.unselectedButton, pos == 4 && styles.selectedButton]}
                    onPress={() => changePosition(4)}
                >
                    <Text style={[{color: 'black'}, pos == 4 && {color: 'white', fontWeight: 'bold'}]}>Alumni</Text>
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
                    <Text style={styles.noMembers}>No members found</Text>
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
        backgroundColor: 'white',
    },
    buttonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 10,
        marginHorizontal: 10
    },
    unselectedButton: {
        backgroundColor: 'lightgray',
        paddingVertical: 10,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    selectedButton: {
        backgroundColor: '#134b91'
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