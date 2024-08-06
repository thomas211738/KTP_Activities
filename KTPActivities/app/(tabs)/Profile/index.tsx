
// React Imports
import { View, Button, StyleSheet, ScrollView, Text,Image, TouchableOpacity, useColorScheme} from 'react-native';
import React, { useState, useEffect } from 'react';

// Sign Out Functionality
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";
import { router } from 'expo-router';
import { GoogleSignin} from '@react-native-google-signin/google-signin';

// Icons
import Octicons from '@expo/vector-icons/Octicons';
import { AntDesign } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Other Imports
import { getUserInfo } from '../../components/userInfoManager'; 
import colleges from '../../components/buinfo';
import AddInterestModal from '../../components/addInterestModal';
import EditInterestModal from '../../components/editInterestModal';
import axios from 'axios';
import { BACKEND_URL } from '@env';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import CircleLoader from '../../components/loaders/circleLoader';
import { GetImage } from '../../components/pictures';
import AddigModal from '../../components/igModal';
import AddLinkedinModal from '../../components/linkedinModal';


const Index = () => {
    const userInfo = getUserInfo();
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [userInterests, setUserInterests] = useState(userInfo.Interests);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [originalInterest, setOriginalInterest] = useState('');
    const [interestIndex, setInterestIndex] = useState(null);
    const [image, setImage] = useState(null);
    const [imageLoading, setImageLoading] = useState(true);
    const [igModalVisible, setIgModalVisible] = useState(false);
    const [linkedinModalVisible, setLinkedinModalVisible] = useState(false);
    const [instagram, setInstagram] = useState(userInfo.Instagram);
    const [linkedIn, setLinkedIn] = useState(userInfo.LinkedIn);
    const [userClass, setUserClass] = useState(`(${userInfo.Class})` || "");
    const colorScheme = useColorScheme();


    
    const fetchProfile = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/users/${userInfo._id}`);
            
            if (response.data.ProfilePhoto) {
                const image = await GetImage(response.data.ProfilePhoto);
                setImage(image);
                setImageLoading(false);
            } else {
                setImageLoading(false);
            }
            if (response.data.Interests){
                setUserInterests(response.data.Interests);
            }
            if (response.data.Instagram) setInstagram(response.data.Instagram);
            if (response.data.LinkedIn) setLinkedIn(response.data.LinkedIn);
            
            
        } catch (err) {
            console.log(err.message);
        }
    }
    
    useEffect(() => {
        fetchProfile();
    },[]);


    const posName = ["Rushee", "Pledge", "Brother", userInfo.Eboard_Position , "Alumni", "Super Administrator"][userInfo.Position] || "";

    

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
    }[userInfo.GradYear] || "Alumni";

    const postInterest = async (interest) => {
        try {
            userInfo.Interests.push(interest);
            let updateduser = (({ BUEmail, FirstName, LastName, GradYear, Major, Colleges, Interests, Position }) => ({ BUEmail, FirstName, LastName, GradYear, Major ,Colleges, Interests, Position: Position.toString() }))(userInfo);
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
        

        if (!result.canceled) {
            setImageLoading(true);
            const compressedImage = await compressImage(result.assets[0].uri);
            postimage(compressedImage);
        }
    };

    const compressImage = async (uri) => {
        const manipResult = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 800 } }], // Resize to a width of 800px, adjust as needed
            { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG } // Adjust compression and format as needed
        );
        return manipResult;
    };

    const postIg = async (instagram) => {
        try {
            const updateduser = {Position: userInfo.Position.toString(), Instagram: instagram};
            await axios.put(`${BACKEND_URL}/users/${userInfo._id}`,
                updateduser
            );
            setIgModalVisible(false);
            fetchProfile();
        } catch (err) {
            console.log(err);
        }
    }
    const postLinkedIn = async (linkedin) => {
        try {
            const updateduser = {Position: userInfo.Position.toString(), LinkedIn: linkedin};
            await axios.put(`${BACKEND_URL}/users/${userInfo._id}`,
                updateduser
            );
            setLinkedinModalVisible(false);
            fetchProfile();
        } catch (err) {
            console.log(err);
        }
    }




    const postimage = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                name: 'photo.jpg',
                type: 'image/jpeg',
            });

            if(userInfo.ProfilePhoto) {
                await axios.delete(`${BACKEND_URL}/users/photo/${userInfo.ProfilePhoto}`);
            }

            const imageID = await axios.post(`${BACKEND_URL}/users/photo`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                  },
            });
            const image = await GetImage(imageID.data.fileId);

            setImage(image);
            setImageLoading(false);
            addFileIDToUser(imageID.data.fileId);
        } catch (err) {
            console.log(err.message);
        }
    }

      const addFileIDToUser = async (fileID) => {
        try {

            const updateduser = {Position: userInfo.Position.toString(), ProfilePhoto: fileID};
            await axios.put(`${BACKEND_URL}/users/${userInfo._id}`,
                updateduser
            );
        } catch (err) {
            console.log(err);
        }
    }

    const containerTheme = colorScheme === 'dark' ? styles.containerLight : styles.containerDark;
    const textTheme = colorScheme === 'dark' ? styles.lightText : styles.darkText;

    const eventTheme = colorScheme === 'dark' ? styles.lightEvent : styles.darkEvent;
    const interestTheme = colorScheme === 'dark' ? styles.darkEvent : styles.lightEvent;
    const interestTextTheme = colorScheme === 'dark' ? styles.darkText: styles.lightText;


    return (
        <View style={[styles.container, containerTheme]}>
            <ScrollView contentInsetAdjustmentBehavior='automatic'>
                {/* MODALS */}
                <EditInterestModal visible={editModalVisible} onDelete={deleteInterest} onCancel={() => setEditModalVisible(false)} onPut={putInterest} interest={originalInterest}/>
                <AddInterestModal visible={addModalVisible} onCancel={() => setAddModalVisible(false)} onPost={postInterest} />
                <AddigModal visible={igModalVisible} onCancel={() => setIgModalVisible(false)} onPost={postIg} Instagram={instagram}/>
                <AddLinkedinModal visible={linkedinModalVisible} onCancel={() => setLinkedinModalVisible(false)} onPost={postLinkedIn} LinkedIn={linkedIn}/>

                {/* IMAGE COMPONENT */}
                {imageLoading ? <CircleLoader/> : 
                    image ? (
                        <Image source={{ uri: `data:image/png;base64,${image}` }} style={styles.profileimage} />
                    ) : (
                        <Octicons name="feed-person" size={175} color="#242424" style={styles.profilepic} />
                    )}



                <FontAwesome name="circle" size={50} color={colorScheme === 'dark' ? "white" : "#1a1a1a"} style={styles.profilepiccircle}/>
                <TouchableOpacity onPress={pickImage}>
                    <FontAwesome name="circle" size={40} color={colorScheme === 'dark' ? "#134b91" : "#86ebba"} style={[styles.profilepiccirclebg]}/>
                    <Feather name="edit-2" size={20} color={colorScheme === 'dark' ? "white" : "black"} style={styles.editpic}/>
                </TouchableOpacity>
                

                {/* PROFILE CARD */}
                <View style={[styles.card, eventTheme]}>
                    <Text style={[styles.name, textTheme]}>{userInfo.FirstName} {userInfo.LastName}</Text>
                    <Text style={styles.status}>{posName} {userClass}</Text>
                    <View style={styles.divider} />
                    <Text style={[styles.faculty, textTheme]}>{college}</Text>
                    <Text style={[styles.details, textTheme]}>
                        Major in {userInfo.Major.join(' and')}
                        {userInfo.Minor.length > 0 && ` | Minor in ${userInfo.Minor.join(' and')}`}
                    </Text>
                    <Text style={[styles.details, textTheme]}>{grade} ({userInfo.GradYear})</Text>
                    <View style={styles.divider} />
                    <View style={[styles.interestsContainer]}>
                        <View style={styles.interestTitlerow}>
                            <Text style={[styles.interestsTitle, textTheme]}>Interests</Text>
                            <TouchableOpacity style={styles.addInterestIcon} onPress={() => setAddModalVisible(true)}>
                                <Ionicons name="add" size={30} color={colorScheme === 'dark' ? "white" : "black"} />
                            </TouchableOpacity>    
                        </View>
                    <View style={[styles.interests]}>
                        {userInterests.length > 0 ? userInterests.map((interest, index) => (
                            <View key={index} style={[styles.interest, interestTheme]}>
                                <TouchableOpacity onPress={() => {setInterestIndex(index); setOriginalInterest(interest); setEditModalVisible(true)}}>
                                    <Text style={[styles.interestText, interestTextTheme]}>{interest}</Text>
                                </TouchableOpacity>    
                            </View>
                        )) : ""}
                    </View>
                    </View>
                    <View style={styles.socialIcons}>
                        <TouchableOpacity onPress={() => setLinkedinModalVisible(true)}>
                            <AntDesign name="linkedin-square" size={24} color={colorScheme === 'dark' ? "white" : "black"} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIgModalVisible(true)}>
                            <AntDesign name="instagram" size={24} color={colorScheme === 'dark' ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* SIGNOUT CARD */}
                <View style={[styles.signOutCard, eventTheme]}>
                    <TouchableOpacity onPress={async () => {
                        await signOut(auth);
                        await AsyncStorage.removeItem("@user");
                        await GoogleSignin.signOut()
                        router.replace("/");
                    }}>
                        <Text style={styles.signOutButtonText}>Sign Out</Text>
                    </TouchableOpacity>
                    <Entypo name="log-out" size={20} color={colorScheme === 'dark' ? "white" : "black"} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',        
        marginTop: 10,
    },
    containerLight: {
        backgroundColor: 'white',
    },
    containerDark: {
        backgroundColor: '#1a1a1a',
    },
    lightText: {
        color: 'white',
    },
    darkText: {
        color: 'black',
    },
    lightEvent:{
        backgroundColor: '#134b91',
    },
    darkEvent: {
        backgroundColor: '#86ebba',
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
        borderBottomColor: 'black',
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
