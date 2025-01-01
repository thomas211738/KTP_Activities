import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
    ScrollView,
  } from "react-native";
import React from 'react'
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { IP_ADDRESS } from '@env';
import { useLocalSearchParams } from "expo-router";
import { getUserInfo } from "../../components/userInfoManager";
import Toast from 'react-native-root-toast';
import { RootSiblingParent } from 'react-native-root-siblings';



const indivisualNotification = () => {
    const { userID } = useLocalSearchParams();
    const [messageTitle, setMessageTitle] = React.useState('');
    const [body, setBody] = React.useState('');
    const [subtitle, setSubtitle] = React.useState('');
    const userInfo = getUserInfo();

    const colorScheme = useColorScheme();
    const containerTheme = colorScheme === 'light' ? styles.containerLight : styles.containerDark;
    const cardTheme = colorScheme === 'light' ? styles.cardSlightlyDarker : styles.cardDark;
    const textTheme = colorScheme === 'light' ? styles.lightText : styles.darkText;
    const buttonTheme = colorScheme === 'light' ? styles.lightButton : styles.darkButton;
    const buttonTextTheme = () => colorScheme === 'light' ? styles.whiteText : styles.blackText;


    const handletest = async () => {
        const usertocken = await axios.get(`${IP_ADDRESS}/notifications/token/${userInfo._id}`);
        const token = usertocken.data.token;
        if (!token) {
            console.log('No token found for sender');
        }
        await sendPushNotification(token);
    };

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
      
      
      async function sendPushNotification(expoPushToken: string) {
        const message = {
          to: expoPushToken,
          sound: 'default',
          title: messageTitle,
          body: body,
          subtitle: subtitle,
          data: { someData: 'goes here' },
        };
      
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });
      }

    const handleSubmit = async () => {
        const user2token = await axios.get(`${IP_ADDRESS}/notifications/token/${userID}`);

        const token = user2token.data.token;
        if (token === 0){
            console.log('No token found for reciever');
            Toast.show('User doesnt have a notification token', {
                duration: Toast.durations.SHORT,
                position: Toast.positions.BOTTOM,
                shadow: true,
                animation: true,
                hideOnPress: true,
                delay: 0,
                backgroundColor: 'red',
                textColor: 'white',
                opacity: 1,
            });
        } else{
            await sendPushNotification(token);
            Toast.show('Notification sent successfully', {
                duration: Toast.durations.SHORT,
                position: Toast.positions.BOTTOM,
                shadow: true,
                animation: true,
                hideOnPress: true,
                delay: 0,
                backgroundColor: 'green',
                textColor: 'white',
                opacity: 1,
            });
        }
        
    }

    return (
        <RootSiblingParent>
        <View style={[styles.container, containerTheme]}>
          <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={styles.centeredContent}>
            <View style={[styles.card, cardTheme, styles.inputCard]}>
              <Text style={[styles.label, textTheme]}>Title</Text>
              <TextInput
                style={[styles.textInput, cardTheme, textTheme]}
                placeholder="Enter Message Title"
                placeholderTextColor={colorScheme === 'light' ? "#999" : "white"}
                value={messageTitle}
                onChangeText={setMessageTitle}
              />
      
              <Text style={[styles.label, textTheme]}>Subtitle</Text>
              <TextInput
                style={[styles.textInput, cardTheme, textTheme]}
                placeholder="Enter Subtitle"
                placeholderTextColor={colorScheme === 'light' ? "#999" : "white"}
                value={subtitle}
                onChangeText={setSubtitle}
              />
      
              <Text style={[styles.label, textTheme]}>Body</Text>
              <TextInput
                style={[styles.textInput, cardTheme, textTheme]}
                placeholder="Enter Body"
                placeholderTextColor={colorScheme === 'light' ? "#999" : "white"}
                value={body}
                onChangeText={setBody}
              />
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.navigationButton, styles.testButton, buttonTheme]}
                onPress={handletest}
              >
                <Text style={[styles.navigationButtonText, buttonTextTheme()]}>Test</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navigationButton, styles.submitButton, buttonTheme]}
                onPress={handleSubmit}
              >
                <Text style={[styles.navigationButtonText, buttonTextTheme()]}>Submit</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
        </RootSiblingParent>
      );      
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
      },
      centeredContent: {
        flex: 1,
        justifyContent: "center", // Centers content vertically
        alignItems: "center",    // Centers content horizontally
        paddingHorizontal: 16,   // Adds padding for responsiveness
      },
    subtitle: {
        paddingLeft: 10, // Add some spacing between the left of the screen and the subtitle
        paddingTop: 20, // Add some spacing between the top of the screen and the subtitle
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 5, // Add some spacing between the subtitle and the card
      },
    containerLight: {
      backgroundColor: 'white',
    },
    containerDark: {
      backgroundColor: '#1a1a1a',
    },
    card: {
      width: "100%",
      borderRadius: 8,
      paddingVertical: 8,
      elevation: 2,
    },
    cardSlightlyDarker: {
      backgroundColor: "#ededed",
    },
    cardDark: {
      backgroundColor: "#333",
    },
    cardItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    cardContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    checkboxContainer: {
      width: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    testButton: {
        marginHorizontal: 5, // Ensures spacing between buttons
      },      
    cardText: {
      fontSize: 16,
      fontWeight: "600",
    },
    lightText: {
      color: "#333",
    },
    darkText: {
      color: "#ccc",
    },
    separator: {
      height: 1,
      marginVertical: 8,
    },
    separatorLight: {
      backgroundColor: "#ddd",
    },
    separatorDark: {
      backgroundColor: "#444",
    },
    nextButton: {
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 20,
      marginTop: 20,
      alignSelf: "center",
    },
    lightButton: {
      backgroundColor: "#134b91",
    },
    darkButton: {
      backgroundColor: "#86ebba",
    },
    whiteText: {
      color: "white",
    },
    blackText: {
      color: "black",
    },
    nextButtonText: {
      fontSize: 16,
      fontWeight: "bold",
    },
    inputContainer: {
      width: "100%",
      paddingHorizontal: 16,
    },
    inputCard: {
      padding: 20,
      paddingVertical: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 4,
    },
    textInput: {
      height: 40,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 8,
      fontSize: 14,
      marginBottom: 12,
    },
    buttonRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 20,
      width: "100%",
      paddingHorizontal: 16,
    },
    navigationButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      marginHorizontal: 5,
      alignItems: "center",
    },
    backButton: {},
    submitButton: {},
    navigationButtonText: {
      fontSize: 16,
      fontWeight: "bold",
    },
  });

export default indivisualNotification