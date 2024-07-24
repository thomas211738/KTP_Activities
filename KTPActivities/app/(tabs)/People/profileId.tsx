import { View, Text, TouchableOpacity, StyleSheet} from 'react-native'
import React, {useState} from 'react'
import { useLocalSearchParams, router } from 'expo-router';
import {BACKEND_URL} from '@env';
import axios from 'axios';
import { AntDesign } from '@expo/vector-icons';
import colleges from '../../components/buinfo';
import { Octicons } from '@expo/vector-icons';



const profileId = () => {
    const { userID } = useLocalSearchParams();
    const [userFirstName, setuserFirstName] = useState('');
    const [userLastName, setuserLastName] = useState('');
    const [userGradYear, setUserGradYear] = useState("");
    const [userColleges, setUserColleges] = useState("");
    const [userMajor, setUserMajor] = useState("");
    const [userMinor, setUserMinor] = useState("");
    const [position, setPosition] = useState(null);
    const [eboardPosition, setEboardPosition] = useState("");
    const [userInterests, setUserInterests] = useState([]);

    React.useEffect(() => {
        axios.get(`${BACKEND_URL}/users/${userID}`)
        .then((response) => {
            setuserFirstName(response.data.FirstName);
            setuserLastName(response.data.LastName);
            setUserGradYear(response.data.GradYear);
            setUserColleges(response.data.Colleges.join(', '));
            setUserMajor(response.data.Major.join(' and '));
            setUserMinor(response.data.Minor.join(' and '));
            setPosition(response.data.Position);
            setEboardPosition(response.data.Eboard_Position);
            setUserInterests(response.data.Interests);
        })
        .catch((error) => {
            console.log(error);
        });
    }, [userID, BACKEND_URL]);

    const posName = ["Rushee", "Pledge", "Brother", eboardPosition, "Alumni", "Super Administrator"][position] || "";

    function getLabelByValue(value) {
        const college = colleges.find(college => college.value === value);
        return college ? college.label : 'Value not found';
    }
    const college = getLabelByValue(userColleges);

    const grade = {
        2025: "Senior",
        2026: "Junior",
        2027: "Sophomore",
        2028: "Freshman"
    }[userGradYear] || "Alumni";


  return (

    <View style={styles.pageView}>
        <View style={styles.profilepiccirclebg}>
            <Octicons name="feed-person" size={175} color="#242424" style={styles.profilepiccircle} />
        </View>

        <View style={styles.card}>
            <Text style={styles.name}>{userFirstName} {userLastName}</Text>
            <Text style={styles.status}>{posName}</Text>
            <View style={styles.divider} />
            <Text style={styles.faculty}>{college}</Text>
            <Text style={styles.details}>
                Major in {userMajor}
                {userMinor.length > 0 && ` | Minor in ${userMinor}`}
            </Text>
            <Text style={styles.details}>{grade} ({userGradYear})</Text>
            <View style={styles.divider} />
            <View style={styles.interestsContainer}>
                <View style={styles.interestTitlerow}>
                    <Text style={styles.interestsTitle}>Interests</Text> 
                </View>
            <View style={styles.interests}>
                {userInterests.map((interest, index) => (
                    <View key={index} style={styles.interest}>
                            <Text style={styles.interestText}>{interest}</Text>
                    </View>
                ))}
            </View>
            </View>
            {/* <View style={styles.socialIcons}>
                <TouchableOpacity onPress={() => openLinkedInProfile('thomasyousef21')}>
                    <AntDesign name="linkedin-square" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openInstagramProfile('thomas.bowls21')}>
                    <AntDesign name="instagram" size={24} color="white" />
                </TouchableOpacity>
            </View> */}
        </View>

    </View>
    
  )
}

const styles = StyleSheet.create({
    pageView: {
        flex: 1,
        backgroundColor: 'white',
    },
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

export default profileId