import { View, Button, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";
import { router } from 'expo-router';
import Octicons from '@expo/vector-icons/Octicons';
import { AntDesign } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import { getUserInfo } from '../../components/userInfoManager'; 
import colleges from '../../components/buinfo';
import { Ionicons } from '@expo/vector-icons';
import AddInterestModal from '../../components/addInterestModal';
import EditInterestModal from '../../components/editInterestModal';
import axios from 'axios';
import { BACKEND_URL } from '@env';

const Index = () => {
    const userInfo = getUserInfo();
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [userInterests, setUserInterests] = useState(userInfo.Interests);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [originalInterest, setOriginalInterest] = useState('');
    const [interestIndex, setInterestIndex] = useState(null);


    const posName = ["Rushee", "Pledge", "Brother", "Executive Board Member", "Super Administrator"][userInfo.Position] || "";

    function getLabelByValue(value) {
        const college = colleges.find(college => college.value === value);
        return college ? college.label : 'Value not found';
    }
    const college = getLabelByValue(userInfo.Colleges[0]);

    const grade = {
        2025: "Senior",
        2026: "Junior",
        2027: "Sophomore",
        2028: "Freshman"
    }[userInfo.GradYear] || "";

    const postInterest = async (interest) => {
        try {
            userInfo.Interests.push(interest);
            let updateduser = (({ BUEmail, FirstName, LastName, GradYear, Major, Minor, Colleges, Interests, Position }) => ({ BUEmail, FirstName, LastName, GradYear, Major, Minor ,Colleges, Interests, Position: Position.toString() }))(userInfo);
            await axios.put(`${BACKEND_URL}/users/${userInfo._id}`,
                updateduser
            );
            setAddModalVisible(false);
            fetchProfile();
        } catch (err) {
            console.log(err);
        }
    }

    const putInterest = async (interest) => {
        try {
            let updateduser = (({ BUEmail, FirstName, LastName, GradYear, Major, Minor, Colleges, Interests, Position }) => ({ BUEmail, FirstName, LastName, GradYear, Major, Minor ,Colleges, Interests, Position: Position.toString() }))(userInfo);
            updateduser.Interests[interestIndex] = interest;
            await axios.put(`${BACKEND_URL}/users/${userInfo._id}`,
                updateduser
            );
            setEditModalVisible(false);
            fetchProfile();
        } catch (err) {
            console.log(err);
        }
    }

    const deleteInterest = async () => {
        try {
            let updateduser = (({ BUEmail, FirstName, LastName, GradYear, Major, Minor, Colleges, Interests, Position }) => ({ BUEmail, FirstName, LastName, GradYear, Major, Minor ,Colleges, Interests, Position: Position.toString() }))(userInfo);
            updateduser.Interests.splice(interestIndex, 1);
            await axios.put(`${BACKEND_URL}/users/${userInfo._id}`,
                updateduser
            );
            setEditModalVisible(false);
            fetchProfile();
        } catch (err) {
            console.log(err);
        }
    }

    const fetchProfile = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/users/${userInfo._id}`);
            setUserInterests(response.data.data.Interests);
        } catch (err) {
            console.log(err.message);
        }
    }

    return (
        <View style={styles.container}>
            <ScrollView contentInsetAdjustmentBehavior='automatic'>
                {/* MODALS */}
                <EditInterestModal visible={editModalVisible} onDelete={deleteInterest} onCancel={() => setEditModalVisible(false)} onPut={putInterest} interest={originalInterest}/>

                <AddInterestModal visible={addModalVisible} onCancel={() => setAddModalVisible(false)} onPost={postInterest} />
                {/* IMAGE COMPONENT */}
                <Octicons name="feed-person" size={175} color="#242424" style={styles.profilepic} />

                {/* PROFILE CARD */}
                <View style={styles.card}>
                    <Text style={styles.name}>{userInfo.FirstName} {userInfo.LastName}</Text>
                    <Text style={styles.status}>{posName}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.faculty}>{college}</Text>
                    <Text style={styles.details}>
                        Major in {userInfo.Major.join(', ')}
                        {userInfo.Minor.length > 0 && ` | Minor in ${userInfo.Minor.join(', ')}`}
                    </Text>
                    <Text style={styles.details}>{grade} ({userInfo.GradYear})</Text>
                    <View style={styles.divider} />
                    <View style={styles.interestsContainer}>
                        <View style={styles.interestTitlerow}>
                            <Text style={styles.interestsTitle}>Interests</Text>
                            <TouchableOpacity style={styles.addInterestIcon} onPress={() => setAddModalVisible(true)}>
                                <Ionicons name="add" size={30} color="white" />
                            </TouchableOpacity>    
                        </View>
                    <View style={styles.interests}>
                        {userInterests.map((interest, index) => (
                            <View key={index} style={styles.interest}>
                                <TouchableOpacity onPress={() => {setInterestIndex(index); setOriginalInterest(interest); setEditModalVisible(true)}}>
                                    <Text style={styles.interestText}>{interest}</Text>
                                </TouchableOpacity>    
                            </View>
                        ))}
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
    );
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
    interestTitlerow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    interestsTitle: {
        color: 'white',
        fontSize: 20,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    addInterestIcon: {
        marginTop: -5,
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

export default Index;
