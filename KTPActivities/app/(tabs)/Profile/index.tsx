import { View, Button, StyleSheet, ScrollView, Text,Image, TouchableOpacity } from 'react-native';
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
import * as Linking from 'expo-linking';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';


const Index = () => {
    const userInfo = getUserInfo();
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [userInterests, setUserInterests] = useState(userInfo.Interests);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [originalInterest, setOriginalInterest] = useState('');
    const [interestIndex, setInterestIndex] = useState(null);
    const [image, setImage] = useState(null);
    const [image1, setImage1] = useState(null);


    const posName = ["Rushee", "Pledge", "Brother", "Executive Board Member", "Super Administrator"][userInfo.Position] || "";

    const openInstagramProfile = async (username) => {
        const url = `instagram://user?username=${username}`;
    
        // Check if the Instagram app can be opened
        const supported = await Linking.canOpenURL(url);
    
        if (supported) {
          // Open the Instagram app to the specified profile
          await Linking.openURL(url);
        } else {
          // If the Instagram app is not installed, open the profile in the web browser
          const webUrl = `https://www.instagram.com/${username}/`;
          await Linking.openURL(webUrl);
        }
      };

      const openLinkedInProfile = async (username) => {
        const url = `linkedin://in/${username}`;
    
        // Check if the LinkedIn app can be opened
        const supported = await Linking.canOpenURL(url);
    
        if (supported) {
          // Open the LinkedIn app to the specified profile
          await Linking.openURL(url);
        } else {
          // If the LinkedIn app is not installed, open the profile in the web browser
          const webUrl = `https://www.linkedin.com/in/${username}/`;
          await Linking.openURL(webUrl);
        }
      };

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

    const pickImage = async () => {
        
        // Open image picker
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
    
        // if (!result.canceled) {
        //     setImage(result.assets[0].uri);
        // }

        postimage(result.assets[0]);
        
    
      };

      

      const postimage = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                name: 'photo.jpg',
                type: 'image/jpeg',
            });
            console.log(formData);

            const imageID = await axios.post(`${BACKEND_URL}/users/photo`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                  },
            });

            console.log(imageID.data.fileId);
            getimage(imageID.data.fileId);
        } catch (err) {
            console.log(err.message);
        }
    }

    const getimage = async (picid) => {
        try {
            const response = await axios.get(`${BACKEND_URL}/users/photo/all/${picid}`);
            setImage(response.data.data[0].data);
            console.log(response.data.data[0].data);


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
                {image ? (
                    <Image source={{ uri: `data:image/png;base64,${image}` }} style={styles.profileimage} />
                ) : (
                    <Octicons name="feed-person" size={175} color="#242424" style={styles.profilepic} />
                )}

                <FontAwesome name="circle" size={50} color="white" style={styles.profilepiccircle}/>
                <TouchableOpacity onPress={pickImage}>
                    <FontAwesome name="circle" size={40} color="#134b91" style={styles.profilepiccirclebg}/>
                    <Feather name="edit-2" size={20} color="white" style={styles.editpic}/>
                </TouchableOpacity>
                

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
                        <TouchableOpacity onPress={() => openLinkedInProfile('thomasyousef21')}>
                            <AntDesign name="linkedin-square" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openInstagramProfile('thomas.bowls21')}>
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
    profileimage: {
        width: 175,
        height: 175,
        borderRadius: 100,
        alignSelf: 'center',
        marginTop: 10,
    },
    profilepiccircle: {
        alignSelf: 'center',
        marginTop: -30,

    },
    profilepiccirclebg: {
        alignSelf: 'center',
        marginTop: -46,
    },
    editpic: {
        alignSelf: 'center',
        marginTop: -30,
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
