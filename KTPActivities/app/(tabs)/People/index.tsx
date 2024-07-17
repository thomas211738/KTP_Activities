
import { View, Text, ScrollView, StyleSheet, Image, Pressable } from 'react-native'
import React from 'react'
import { getAllUsersInfo } from '../../components/allUsersManager'

const Person = (props) => {
    return (
        <View style={styles.personContainer}>
            <Image source={require("../../../img/ktplogopng.png")} style={styles.personImage} />
            <View>
                <Text style={styles.personName}>
                    {props.user.FirstName + " " + props.user.LastName}
                </Text>
                <Text style={styles.personMajors}>
                    {props.user.Position == 3 ? 
                        props.user.Eboard_Position :
                        `${props.user.Major.toString()} Major${props.user.Minor[0] !== "" ? `, ${props.user.Minor.toString()} Minor` : ''}`
                    }
                </Text>
            </View>
        </View>
    )
}

const index = () => {
    const [pos, setPos] = React.useState(2);
    const users = getAllUsersInfo();
    const filteredUsers = users.filter(user => user.Position === pos);
    return (
        <View style={styles.container}>
            <ScrollView keyboardDismissMode='on-drag' contentInsetAdjustmentBehavior='automatic'>
                <View style={styles.buttonsContainer}>
                    <Pressable 
                        style={[styles.unselectedButton, pos <= 1 && styles.selectedButton]}
                        onPress={() => setPos(1)}
                    >
                        <Text style={[{color: 'black'}, pos <= 1 && {color: 'white'}]}>Rushee/Pledges</Text>
                    </Pressable>
                    <Pressable 
                        style={[styles.unselectedButton, pos == 2 && styles.selectedButton]}
                        onPress={() => setPos(2)}
                    >
                        <Text style={[{color: 'black'}, pos == 2 && {color: 'white'}]}>Brothers</Text>
                    </Pressable>
                    <Pressable 
                        style={[styles.unselectedButton, pos == 3 && styles.selectedButton]}
                        onPress={() => setPos(3)}
                    >
                        <Text style={[{color: 'black'}, pos == 3 && {color: 'white'}]}>E-Board</Text>
                    </Pressable>
                </View>
                {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                    <Person
                        key={user._id}
                        user={user}
                    />
                )) : (
                    <View style={styles.noMembersContainer}>
                        <Text style={styles.noMembers}>No members found</Text>
                    </View>
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
        margin: 10,
        borderRadius: 10,
        overflow: 'hidden'
    },
    unselectedButton: {
        backgroundColor: 'lightgray',
        padding: 12,
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
        fontSize: 14
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