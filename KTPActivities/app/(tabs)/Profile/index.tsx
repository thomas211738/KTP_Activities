
// React Imports
import { View, Button, StyleSheet, ScrollView, Text,Image, TouchableOpacity, useColorScheme, Switch, Appearance} from 'react-native';
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
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Other Imports
import { getUserInfo } from '../../components/userInfoManager'; 
import colleges from '../../components/buinfo';
import AddInterestModal from '../../components/addInterestModal';
import EditInterestModal from '../../components/editInterestModal';
import axios from 'axios';
import { BACKEND_URL } from '@env';
import * as ImagePicker from 'expo-image-picker';
import CircleLoader from '../../components/loaders/circleLoader';
import { GetImage } from '../../components/pictures';
import AddigModal from '../../components/igModal';
import AddLinkedinModal from '../../components/linkedinModal';
import ProfileLoader from '../../components/loaders/profileLoader';
import { add, set } from 'date-fns';

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
    const [isEnabled, setIsEnabled] = useState((colorScheme === 'light') ? false : true);
    const [loading, setLoading] = useState(true);
    const [profileID, setProfileID] = useState(null);

    const [imageURI, setImageURI] = useState(null);  

    
    const fetchProfile = async () => {
        try {

            let response;

            if (userInfo.id) {
                response = await axios.get(`${BACKEND_URL}/users/${userInfo.id}`);
            } else{
                response = await axios.get(`${BACKEND_URL}/users/email/${userInfo.BUEmail}`);
            }

            
            if (response.data.Interests){
                setUserInterests(response.data.Interests);
            }
            if (response.data.Instagram) setInstagram(response.data.Instagram);
            if (response.data.LinkedIn) setLinkedIn(response.data.LinkedIn);
            if (response.data.AppPhotoURL) {
                setImageURI(response.data.AppPhotoURL);
            }
            setImageLoading(false);

        } catch (err) {
            console.error("Error fetching profile:", err.response ? err.response.data : err.message);
        }
    }

    useEffect(() => {
        fetchProfile();
    }, []);


    const posName = ["Rushee", "Pledge", "Brother", userInfo.Eboard_Position , "Alumni", "Super Administrator"][userInfo.Position] || "";

    

    function getLabelByValue(value) {
        const college = colleges.find(college => college.value === value);
        return college ? college.label : 'Value not found';
    }
    const college = getLabelByValue(userInfo.Colleges[0]);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-11 for Jan-Dec
    const academicYearOffset = currentMonth < 5 ? 0 : 1; // Before June: 0, June or later: 1
    const seniorGradYear = currentYear + academicYearOffset;
    const grade = {
        [seniorGradYear]: "Senior",
        [seniorGradYear + 1]: "Junior",
        [seniorGradYear + 2]: "Sophomore",
        [seniorGradYear + 3]: "Freshman"
    }[userInfo.GradYear] || "Alumni";

    const postInterest = async (interest) => {
        try {
            userInfo.Interests.push(interest);
            let updateduser = (({ BUEmail, FirstName, LastName, GradYear, Major, Colleges, Interests, Position }) => ({ BUEmail, FirstName, LastName, GradYear, Major ,Colleges, Interests, Position: Position.toString() }))(userInfo);
            await axios.put(`${BACKEND_URL}/users/${userInfo.id}`,
                updateduser
            );
            setAddModalVisible(false);
            fetchProfile();
        } catch (err) {
            console.error("Error posting interest:", err.response ? err.response.data : err.message);
        }
    }


    const putInterest = async (interest) => {
        try {
            let updateduser = (({ BUEmail, FirstName, LastName, GradYear, Major, Minor, Colleges, Interests, Position }) => ({ BUEmail, FirstName, LastName, GradYear, Major, Minor ,Colleges, Interests, Position: Position.toString() }))(userInfo);
            updateduser.Interests[interestIndex] = interest;
            await axios.put(`${BACKEND_URL}/users/${userInfo.id}`,
                updateduser
            );
            setEditModalVisible(false);
            fetchProfile();
        } catch (err) {
            console.error("Error updating interest:", err.response ? err.response.data : err.message);
        }
    }

    const deleteInterest = async () => {
        try {
            let updateduser = (({ BUEmail, FirstName, LastName, GradYear, Major, Minor, Colleges, Interests, Position }) => ({ BUEmail, FirstName, LastName, GradYear, Major, Minor ,Colleges, Interests, Position: Position.toString() }))(userInfo);
            updateduser.Interests.splice(interestIndex, 1);
            await axios.put(`${BACKEND_URL}/users/${userInfo.id}`,
                updateduser
            );
            setEditModalVisible(false);
            fetchProfile();
        } catch (err) {
            console.error("Error deleting interest:", err.response ? err.response.data : err.message);
        }
    }

    const postIg = async (instagram) => {
        try {
            const updateduser = {Position: userInfo.Position.toString(), Instagram: instagram};
            await axios.put(`${BACKEND_URL}/users/${userInfo.id}`,
                updateduser
            );
            setIgModalVisible(false);
            fetchProfile();
        } catch (err) {
            console.error("Error posting Instagram:", err.response ? err.response.data : err.message);
        }
    }
    const postLinkedIn = async (linkedin) => {
        try {
            const updateduser = {Position: userInfo.Position.toString(), LinkedIn: linkedin};
            await axios.put(`${BACKEND_URL}/users/${userInfo.id}`,
                updateduser
            );
            setLinkedinModalVisible(false);
            fetchProfile();
        } catch (err) {
            console.error("Error posting LinkedIn:", err.response ? err.response.data : err.message);
        }
    }

      const pickImage = async () => { 
        // Open image picker
        let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Updated: use array of MediaType strings
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        });

        if (!result.canceled) {
            setImageLoading(true);
            deleteImage(getFileNameFromUrl(userInfo.AppPhotoURL), 'App Photos');
            console.log('Deleted old image:', userInfo.AppPhotoURL);

            const downloadURL = await postimage(result.assets[0], userInfo.id);
            setImageURI(downloadURL);
            console.log('Downloaded URL:', downloadURL);

            addFileIDToUser(downloadURL);

            await new Promise(resolve => setTimeout(resolve, 1000));
            setImageLoading(false);


        }
    };

      
    const postimage = async (imageAsset, userId) => {
        try {
            // 1. Create a FormData object
            const formData = new FormData();

            // 2. Create the file object
            const fileToUpload = {
            uri: imageAsset.uri,             
            name: imageAsset.fileName || 'image.jpg', 
            type: imageAsset.type || 'image/jpeg',  
            };

            formData.append('image', fileToUpload as any);
            formData.append('folder', 'App Photos'); 
            formData.append('userId', userId);
        
        const response = await fetch(`${BACKEND_URL}/photo2`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        
        if (response.ok) {
            return data.downloadURL;
        } else {
            console.error('Upload failed:', data);
            return null;
        }

        } catch (error) {
            console.error('Network error:', error);
            return null;
        } 
    };

    const getFileNameFromUrl = (url) => {
        try {

            const cleanUrl = url.split('?')[0];
            const decodedUrl = decodeURIComponent(cleanUrl);
            let storagePath = '';

            if (decodedUrl.includes('/o/')) {
                storagePath = decodedUrl.split('/o/')[1];
            
            } else if (decodedUrl.includes('storage.googleapis.com')) {
                const pathAfterDomain = decodedUrl.split('storage.googleapis.com/')[1];
                const firstSlashIndex = pathAfterDomain.indexOf('/');
            if (firstSlashIndex !== -1) {
                storagePath = pathAfterDomain.substring(firstSlashIndex + 1);
            } else {
                storagePath = pathAfterDomain;
            }
            } else {
                storagePath = decodedUrl;
            }

            // 3. Return everything after the last slash
            const lastSlashIndex = storagePath.lastIndexOf('/');
            return lastSlashIndex !== -1 ? storagePath.substring(lastSlashIndex + 1) : storagePath;

        } catch (error) {
            console.error('Error parsing filename:', error);
            return null;
        }   
    };

    const addFileIDToUser = async (Photo_url) => {
        try {
            const updateduser = {Position: userInfo.Position, AppPhotoURL: Photo_url};
            await axios.put(`${BACKEND_URL}/users/${userInfo.id}`,
                updateduser
            );
        } catch (err) {
            console.error("Error adding file ID to user:", err.response ? err.response.data : err.message);
        }
    }

    const deleteImage = async (filename, folder = 'profile-pics') => {
        try {
            if (!filename) {
                console.log('No filename provided to delete');
                return;
            }

            const url = `${BACKEND_URL}/photo2/${encodeURIComponent(filename)}?folder=${encodeURIComponent(folder)}`;

            const response = await fetch(url, {
            method: 'DELETE',
            });

            const result = await response.json();

            if (response.ok) {
            console.log('Image deleted successfully');
            return true;
            } else {
            console.error('Failed to delete image:', result.message);
            return false;
            }

        } catch (error) {
            console.error('Network error deleting image:', error);
            return false;
        }
    };


    const containerTheme = colorScheme === 'light' ? styles.containerLight : styles.containerDark;
    const textTheme = colorScheme === 'light' ? styles.lightText : styles.darkText;

    const eventTheme = colorScheme === 'light' ? styles.lightEvent : styles.darkEvent;
    const interestTheme = colorScheme === 'light' ? styles.darkEvent : styles.lightEvent;
    const interestTextTheme = colorScheme === 'light' ? styles.darkText: styles.lightText;
    const dividerTheme = colorScheme === 'light' ? styles.dividerlight : styles.dividerdark;

    const toggleSwitch = () => {
        setIsEnabled(previousState => !previousState);
        const newScheme = isEnabled ? 'light' : 'dark';
        Appearance.setColorScheme(newScheme);
      };


    return (
        <View style={[styles.container, containerTheme]}>
            <ScrollView contentInsetAdjustmentBehavior='automatic' contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
                {/* MODALS */}
                <EditInterestModal visible={editModalVisible} onDelete={deleteInterest} onCancel={() => setEditModalVisible(false)} onPut={putInterest} interest={originalInterest}/>
                <AddInterestModal visible={addModalVisible} onCancel={() => setAddModalVisible(false)} onPost={postInterest} />
                <AddigModal visible={igModalVisible} onCancel={() => setIgModalVisible(false)} onPost={postIg} Instagram={instagram}/>
                <AddLinkedinModal visible={linkedinModalVisible} onCancel={() => setLinkedinModalVisible(false)} onPost={postLinkedIn} LinkedIn={linkedIn}/>

                {/* IMAGE COMPONENT */}
                {imageLoading ? <CircleLoader/> : 
                    imageURI ? (
                        <Image source={{ uri: imageURI }} style={styles.profileimage} />
                    ) : (
                        <Octicons name="feed-person" size={175} color={colorScheme === 'light' ? "#242424" : "white"} style={styles.profilepic} />
                    )}


                <FontAwesome name="circle" size={50} color={colorScheme === 'light' ? "white" : "#1a1a1a"} style={styles.profilepiccircle}/>
                <TouchableOpacity onPress={pickImage}>
                    <FontAwesome name="circle" size={40} color={colorScheme === 'light' ? "#134b91" : "#86ebba"} style={[styles.profilepiccirclebg]}/>
                    <Feather name="edit-2" size={20} color={colorScheme === 'light' ? "white" : "black"} style={styles.editpic}/>
                </TouchableOpacity>
                

                {/* PROFILE CARD */}
                
                {userInfo ? (
                <>
                    <View style={[styles.card, eventTheme]}>
                    <Text style={[styles.name, textTheme]}>{userInfo.FirstName} {userInfo.LastName}</Text>
                    <Text style={styles.status}>{posName} { userClass != "(undefined)" ? userClass : ""}</Text>
                    <View style={[styles.divider, dividerTheme]} />
                    <Text style={[styles.faculty, textTheme]}>{college}</Text>
                    <Text style={[styles.details, textTheme]}>
                        Major in {userInfo.Major.join(' and')}
                        {userInfo.Minor.length > 0 && ` | Minor in ${userInfo.Minor.join(' and')}`}
                    </Text>
                    <Text style={[styles.details, textTheme]}>{grade} ({userInfo.GradYear})</Text>
                    <View style={[styles.divider, dividerTheme]} />
                    <View style={[styles.interestsContainer]}>
                        <View style={styles.interestTitlerow}>
                            <Text style={[styles.interestsTitle, textTheme]}>Interests</Text>
                            <TouchableOpacity style={styles.addInterestIcon} onPress={() => setAddModalVisible(true)}>
                                <Ionicons name="add" size={30} color={colorScheme === 'light' ? "white" : "black"} />
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
                            <AntDesign name="linkedin-square" size={24} color={colorScheme === 'light' ? "white" : "black"} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIgModalVisible(true)}>
                            <AntDesign name="instagram" size={24} color={colorScheme === 'light' ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.signOutCard, eventTheme]}>
                    <Text style={[styles.darkmodeButtonText, textTheme]}>Dark Mode</Text>
                    <Switch
                    ios_backgroundColor="#3e3e3e"
                    onChange={toggleSwitch}
                    value={isEnabled}
                    />
                </View>

                {userInfo.Position.toString() === '3' || userInfo.Position.toString() === '5' && (
                    <View style={[styles.resourcesCard, eventTheme]}>
                        <TouchableOpacity onPress={() => {
                            // Add your functionality for the resources button here
                            router.push({pathname: "(tabs)/Profile/notifications",  params: { userID: userInfo.id }} );
                        }}>
                            <Text style={styles.resourcesButtonText}>Send new notification</Text>
                        </TouchableOpacity>
                        <Ionicons name="notifications" size={20} color={colorScheme === 'light' ? "white" : "black"} />
                    </View>
                )}

                {/* {userInfo.Position === 5 && (
                    <View style={[styles.resourcesCard, eventTheme]}>
                        <TouchableOpacity onPress={() => {
                            // Add your functionality for the resources button here
                            router.push({pathname: "(tabs)/Profile/leaderboard",  params: { userID: userInfo.id }} );
                        }}>
                            <Text style={styles.resourcesButtonText}>Clout Leaderboard</Text>
                        </TouchableOpacity>
                        <MaterialIcons name="leaderboard" size={20} color={colorScheme === 'light' ? "white" : "black"} />
                    </View>
                )} */}

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
                    <Entypo name="log-out" size={20} color={colorScheme === 'light' ? "white" : "black"} />
                </View>

                </>) : (<ProfileLoader/>)}


                
            </ScrollView>
        </View>
     );
}

const styles = StyleSheet.create({
    scrollViewContent:{
        paddingBottom: 20,

    },
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
    dividerlight: {
        borderBottomColor: 'white',
    },
    dividerdark: {
        borderBottomColor: 'black',
    },
    divider: {
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
        columnGap: 5, // Added horizontal spacing between icons
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
        alignItems: "center",
    },
    darkmodeButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    signOutButtonText: {
        color: '#ff4f4f',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resourcesCard: {
            padding: 10,
            borderRadius: 10,
            width: '95%',
            alignSelf: 'center',
            marginTop: 20,
            flexDirection: 'row',
            justifyContent: "space-between",
            alignItems: "center",
    },
     resourcesButtonText: {
            color: '#0a9bf5', // You can customize this color
            fontSize: 16,
            fontWeight: 'bold',
    }

});

export default Index;
