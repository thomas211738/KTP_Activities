import { View, Button, StyleSheet, ScrollView,Text, TouchableOpacity} from 'react-native'
import React from 'react'
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";
import { router } from 'expo-router';
import Octicons from '@expo/vector-icons/Octicons';
import { AntDesign } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';

const index = () => {
  return (
    <View style={styles.container}>
        <ScrollView contentInsetAdjustmentBehavior='automatic'>
        {/* IMAGE COMPONENT */}
        <Octicons name="feed-person" size={175} color="#242424" style={styles.profilepic}/>

        {/* PROFILE CARD */}
        <View style={styles.card}>
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.status}>Rushee</Text>
        <View style={styles.divider} />
        <Text style={styles.faculty}>Faculty of Computing & Data Sciences</Text>
        <Text style={styles.details}>Major in Data Science | Minor in Business</Text>
        <Text style={styles.details}>Junior (2026)</Text>
        <View style={styles.divider} />
        <View style={styles.interestsContainer}>
        <Text style={styles.interestsTitle}>Interests</Text>
        <View style={styles.interests}>
            <View style={styles.interest}><Text style={styles.interestText}>Soccer</Text></View>
            <View style={styles.interest}><Text style={styles.interestText}>Machine Learning</Text></View>
            <View style={styles.interest}><Text style={styles.interestText}>Brawl Stars</Text></View>
            <View style={styles.interest}><Text style={styles.interestText}>Finance</Text></View>
        </View>
        </View>
        <View style={styles.socialIcons}>
        <TouchableOpacity>
        <AntDesign name="linkedin-square" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity>
        <AntDesign name="instagram" size={24} color="white" />
        </TouchableOpacity>
        </View>
        </View>

        {/* SIGNOUT CARD */}
        <View style={styles.signOutCard}>
        <TouchableOpacity onPress={async () => {
            await signOut(auth);
            await AsyncStorage.removeItem("@user");
            router.replace("/");
        }}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
        <Entypo name="log-out" size={20} color="white" />
        </View>
    </ScrollView>

    </View>
    
  )
}

const styles = StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: 'white',
      },
    profilepic: {
        marginTop: 10,
        alignSelf: 'center',
    },
    card: {
      backgroundColor: '#134b91',
      padding: 20,
      borderRadius: 10,
      width: '95%',
      alignSelf: 'center',
      marginTop: 20,
    },
    name: {
      color: 'white',
      fontSize: 22,
      fontWeight: 'bold',
    },
    status: {
      color: '#0a9bf5',
      fontSize: 16,
    },
    divider: {
      borderBottomColor: 'white',
      borderBottomWidth: 1,
      marginVertical: 10,
    },
    faculty: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    details: {
      color: 'white',
      fontSize: 14,
    },
    interestsContainer: {
      marginTop: 2,
    },
    interestsTitle: {
      color: 'white',
      fontSize: 20,
      marginBottom: 10,
      fontWeight: 'bold',
    },
    interests: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    interest: {
      backgroundColor: '#86ebba',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      marginRight: 10,
      marginBottom: 10,
    },
    interestText: {
        color: 'black',
        fontWeight: '500',
      },
    socialIcons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 10,
    },
    icon: {
      width: 24,
      height: 24,
      marginLeft: 10,
    },
    signOutCard: {
        backgroundColor: '#134b91',
        padding: 10,
        borderRadius: 10,
        width: '95%',
        alignSelf: 'center',
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: "space-between",
      },
      signOutButtonText: {
        color: '#ff4f4f',
        fontSize: 16,
        fontWeight: 'bold',
      },
  });
export default index;