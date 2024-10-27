import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Linking, useColorScheme, Pressable} from 'react-native'
import React, {useState} from 'react'
import { useLocalSearchParams, router } from 'expo-router';
import {BACKEND_URL} from '@env';
import axios from 'axios';
import { AntDesign } from '@expo/vector-icons';
import colleges from '../../components/buinfo';
import { Octicons } from '@expo/vector-icons';
import CircleLoader from '../../components/loaders/circleLoader';
import ViewProfileLoader from '../../components/loaders/viewProfileLoader';
import { getUserInfo } from '../../components/userInfoManager';
import ScheduleChatModal from '../../components/scheduleChatModal';

const profileId = () => {
    const { userID, userImage } = useLocalSearchParams();
    const [userFirstName, setuserFirstName] = useState('');
    const [userLastName, setuserLastName] = useState('');
    const [userGradYear, setUserGradYear] = useState("");
    const [userColleges, setUserColleges] = useState("");
    const [userMajor, setUserMajor] = useState("");
    const [userMinor, setUserMinor] = useState("");
    const [position, setPosition] = useState(null);
    const [eboardPosition, setEboardPosition] = useState("");
    const [userInterests, setUserInterests] = useState([]);
    const [image, setImage] = useState(null);
    const [imageLoading, setImageLoading] = useState(true);
    const [instagram, setInstagram] = useState(null);
    const [linkedin, setLinkedin] = useState(null);
    const [userClass, setUserClass] = useState("");
    const [loading, setLoading] = useState(true);
    const [scheduleChatVisible, setScheduleChatVisible] = useState(false);
    const userInfo = getUserInfo();
    const colorScheme = useColorScheme();

    React.useEffect(() => {
        axios.get(`${BACKEND_URL}/users/${userID}`)
        .then((response) => {
            setuserFirstName(response.data.FirstName);
            setuserLastName(response.data.LastName);
            setUserGradYear(response.data.GradYear);
            setUserColleges(response.data.Colleges);
            setUserMajor(response.data.Major.join(' and '));
            if (response.data.Minor.length > 0) setUserMinor(response.data.Minor.join(' and '));
            setPosition(response.data.Position);
            setEboardPosition(response.data.Eboard_Position);
            setUserInterests(response.data.Interests);
            if (response.data.Instagram) setInstagram(response.data.Instagram);
            if (response.data.LinkedIn) setLinkedin(response.data.LinkedIn);
            if (response.data.Class) setUserClass(`(${response.data.Class})`);
            setLoading(false);
            if (response.data.ProfilePhoto) {
                setImage(userImage);
                setImageLoading(false);
            }else{
                setImageLoading(false);
            }
        })
        .catch((error) => {
            console.log(error);
        });
    }, [userID, BACKEND_URL]);

    const posName = ["Rushee", "Pledge", "Brother", eboardPosition, "Alumni", "Super Administrator"][position] || "";

    function getLabelByValue(value) {
        const college = colleges.find(college => college.value === value[0]);
        return college ? college.label : 'Value not found';
    }
    const college = getLabelByValue(userColleges);

    const grade = {
        2025: "Senior",
        2026: "Junior",
        2027: "Sophomore",
        2028: "Freshman"
    }[userGradYear] || "Alumni";

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
    
        try {
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
          } catch (error) {
            console.error("An error occurred while opening the URL:", error);
          }
      };

      const changePosition = async (position) => {
        try {
            let newPosition = 0;
            if (position == 0) newPosition = 0.5;

            const updateduser = {Position: newPosition.toString()};
            await axios.put(`${BACKEND_URL}/users/${userID}`,
                updateduser
            );
        } catch (err) {
            console.log(err);
        }
    }

    const scheduleCoffeeChat = () => {
        setScheduleChatVisible(true);
    }

    const containerTheme = colorScheme === 'light' ? styles.containerLight : styles.containerDark;
    const textTheme = colorScheme === 'light' ? styles.lightText : styles.darkText;

    const eventTheme = colorScheme === 'light' ? styles.lightEvent : styles.darkEvent;
    const interestTheme = colorScheme === 'light' ? styles.darkEvent : styles.lightEvent;
    const interestTextTheme = colorScheme === 'light' ? styles.darkText: styles.lightText;
    const dividerTheme = colorScheme === 'light' ? styles.dividerlight : styles.dividerdark;



  return (

    <View style={[styles.pageView, containerTheme]}>
        <ScrollView>
        <View style={[styles.container, containerTheme]}>
            {imageLoading ? <CircleLoader/> : 
                image ? (
                    <Image source={{ uri: image }} style={styles.profileimage} />
                ) : (
                    <Octicons name="feed-person" size={175} color={colorScheme === 'light' ? "#242424" : "white"} style={styles.profilepic} />
                )}
        </View>

        

        {loading ? <ViewProfileLoader/> : 
        <>
        <View style={[styles.card, eventTheme]}>
            <Text style={[styles.name, textTheme]}>{userFirstName} {userLastName}</Text>
            <Text style={styles.status}>{posName} { userClass == "undefined" ? userClass : ""}</Text>
            <View style={[styles.divider, dividerTheme]} />
            <Text style={[styles.faculty, textTheme]}>{college}</Text>
            <Text style={[styles.details, textTheme]}>
                Major in {userMajor}
                {userMinor.length > 0 && ` | Minor in ${userMinor}`}
            </Text>
            <Text style={[styles.details, textTheme]}>{grade} ({userGradYear})</Text>
            <View style={[styles.divider, dividerTheme]} />
            <View style={styles.interestsContainer}>
                <View style={styles.interestTitlerow}>
                    <Text style={[styles.interestsTitle, textTheme]}>Interests</Text> 
                </View>
            <View style={[styles.interests]}>
                {userInterests.map((interest, index) => (
                    <View key={index} style={[styles.interest, interestTheme]}>
                            <Text style={[styles.interestText, interestTextTheme]}>{interest}</Text>
                    </View>
                ))}
            </View>
            </View>

            <View style={styles.socialIcons}>
                {linkedin ? 
                <TouchableOpacity onPress={() => openLinkedInProfile(linkedin)}>
                    <AntDesign name="linkedin-square" size={24} color={colorScheme === 'light' ? "white" : "black"} />
                </TouchableOpacity> : ""}
                {instagram ? 
                <TouchableOpacity onPress={() => openInstagramProfile(instagram)}>
                    <AntDesign name="instagram" size={24} color={colorScheme === 'light' ? "white" : "black"} />
                </TouchableOpacity> : ""}
            </View>
        </View>

        {
            userInfo.Position === 3 || userInfo.Position === 5 ? 
            position === 0 || position === 0.5 ? 
                <View style={[styles.signOutCard, eventTheme]}>
                    <TouchableOpacity onPress={() => changePosition(position)}>
                        {position === 0 ? 
                        <Text style={[styles.darkmodeButtonText, textTheme]}>Promote to Closed Rush</Text> :
                        <Text style={[styles.darkmodeButtonText, textTheme]}>Remove from Closed Rush</Text>
                        }
                    </TouchableOpacity>
                </View> 
            : "" : ""
        }

        {
            loading ? <View style={styles.scheduleButtonContainer}>Loading</View>
            : 
            userInfo.Position >= 0 && position >= 2 ? 
            <TouchableOpacity style={styles.scheduleButtonContainer} onPress={() => scheduleCoffeeChat()}>
                <ScheduleChatModal visible={scheduleChatVisible} onCancel={() => setScheduleChatVisible(false)} onSend={() => {}}>

                </ScheduleChatModal>
                <Text style={styles.scheduleButton}>
                    Schedule coffee chat
                </Text>
            </TouchableOpacity>
            : ""
        }

        </>}
        </ScrollView>
        

    </View>
    
  )
}

const styles = StyleSheet.create({
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
    dividerlight: {
        borderBottomColor: 'white',
    },
    dividerdark: {
        borderBottomColor: 'black',
    },
    pageView: {
        flex: 1,
        backgroundColor: 'white',
    },
    container: {
        flex: 1,
        backgroundColor: 'white',
        marginTop: 20,
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
    },
    profilepiccircle: {
        alignSelf: 'center',
    },
    profilepiccirclebg: {
        marginTop: 10,

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
    scheduleButtonContainer: {
        flex: 1,
        backgroundColor: '#134b91',
        width: '90%',
        padding: 15,
        margin: 10,
        alignSelf: 'center',
        borderRadius: 10,
        alignItems: 'center'
    },
    scheduleButton: {
        color: 'white'
    },
    darkmodeButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default profileId