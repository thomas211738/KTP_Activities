import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
    ScrollView,
  } from "react-native";
import React, { useState } from "react";
import AntDesign from '@expo/vector-icons/AntDesign';
import { getAllUsersInfo } from '../../components/allUsersManager';
import axios from "axios";
import * as Notifications from 'expo-notifications';
import { BACKEND_URL } from "@env";
import { useLocalSearchParams, router } from 'expo-router';
import Toast from 'react-native-root-toast';
import { RootSiblingParent } from 'react-native-root-siblings';

  const SNotifications = () => {
    const { userID } = useLocalSearchParams();
    const [state, setState] = useState({
        OpenRushees: false,
        ClosedRushees: false,
        Pledges: false,
        Brothers: false,
        Eboard: false,
        Alumni: false,
      });

    const [messageTitle, setMessageTitle] = useState("");
    const [body, setBody] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [showTextInputs, setShowTextInputs] = useState(false);

    const colorScheme = useColorScheme();

    const toggleItem = (key) => {
      setState((prevState) => ({
        ...prevState,
        [key]: !prevState[key],
      }));
    };


    const containerTheme = colorScheme === 'light' ? styles.containerLight : styles.containerDark;
    const cardTheme = colorScheme === 'light' ? styles.cardSlightlyDarker : styles.cardDark;
    const textTheme = colorScheme === 'light' ? styles.lightText : styles.darkText;
    const separatorTheme = colorScheme === 'light' ? styles.separatorLight : styles.separatorDark;
    const buttonTheme = colorScheme === 'light' ? styles.lightButton : styles.darkButton;
    const buttonTextTheme = () => colorScheme === 'light' ? styles.whiteText : styles.blackText;
    const users = getAllUsersInfo();

    const handleSubmit = async () => {
        console.log("Submitting message...");
        const filteredUserIDs = users.filter(user => {
            // Map the user position to the corresponding state property
            const roles = {
            0: 'OpenRushees',
            0.5: 'ClosedRushees',
            1: 'Pledges',
            2: 'Brothers',
            3: 'Eboard',
            4: 'Alumni'
            };
            const role = roles[user.Position]; // Find the role name based on position
            return state[role] || user.Position === 5; // Check if the corresponding state property is true or if the position is 5
        }).map(user => user.id); // Return only the userID
        console.log(filteredUserIDs.length)
        let notifiableUsers;
        try {
            notifiableUsers = await axios.get(`${BACKEND_URL}/notifications/`);
        } catch (err) {
            console.error("Error fetching notifiable users:", err.response ? err.response.data : err.message);
            return;
        }

        const filteredTokens = filteredUserIDs.map(userID => {
            // Find the user object in notifiableUsers that matches the current userID
            const userWithToken = notifiableUsers.data.data.find(user => user.userID === userID);
            return userWithToken ? userWithToken.token : null; // Return the token if found, otherwise null
        }).filter(token => token !== null);

        for (const token of filteredTokens) {
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
    };

    const handletest = async () => {
        let usertocken;
        try {
            usertocken = await axios.get(`${BACKEND_URL}/notifications/token/${userID}`);
        } catch (err) {
            console.error("Error fetching user token:", err.response ? err.response.data : err.message);
            return;
        }
        const token = usertocken.data.token;
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

    return (
        <RootSiblingParent>
        <View style={[styles.container, containerTheme]}>
          <ScrollView contentInsetAdjustmentBehavior='automatic' automaticallyAdjustKeyboardInsets>
            {!showTextInputs ? (
              <View style={styles.centeredContent}>
                <Text style={[styles.subtitle, textTheme]}>Recipients</Text>
                <View style={[styles.card, cardTheme]}>
                  {Object.keys(state).map((key, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.cardItem}
                      onPress={() => toggleItem(key)}
                    >
                      <View style={styles.cardContent}>
                        <View style={styles.checkboxContainer}>
                          {state[key] && <AntDesign name="checkcircle" size={18} color={colorScheme === 'light' ? "#333" : "#ccc"} />}
                        </View>
                        <Text style={[styles.cardText, textTheme]}>
                            {key.replace(/([a-z])([A-Z])/g, '$1 $2')} {/* Add a space before uppercase letters */}
                        </Text>
                      </View>
                      {index < Object.keys(state).length - 1 && (
                        <View style={[styles.separator, separatorTheme]} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                    style={[styles.nextButton, buttonTheme]}
                    onPress={() => {
                        const hasSelectedRecipient = Object.values(state).some((value) => value);
                        if (hasSelectedRecipient) {
                        setShowTextInputs(true);
                        } else {
                        alert("Please select at least one recipient before proceeding.");
                        }
                    }}
                    >
                    <Text style={[styles.nextButtonText, buttonTextTheme()]}>Next</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.centeredContent}>
                <Text style={[styles.subtitle, textTheme]}>Message</Text>
                <View style={[styles.card, cardTheme, styles.inputCard]}>
                  <Text style={[styles.label, textTheme]}>Title</Text>
                  <TextInput
                    style={[styles.textInput, cardTheme, textTheme]}
                    placeholder="Enter Message Title"
                    placeholderTextColor={colorScheme === 'light' ? "#999" : "#666"}
                    value={messageTitle}
                    onChangeText={setMessageTitle}
                  />

                  <Text style={[styles.label, textTheme]}>Subtitle</Text>
                  <TextInput
                    style={[styles.textInput, cardTheme, textTheme]}
                    placeholder="Enter Subtitle"
                    placeholderTextColor={colorScheme === 'light' ? "#999" : "#666"}
                    value={subtitle}
                    onChangeText={setSubtitle}
                  />
      
                  <Text style={[styles.label, textTheme]}>Body</Text>
                  <TextInput
                    style={[styles.textInput, cardTheme, textTheme]}
                    placeholder="Enter Body"
                    placeholderTextColor={colorScheme === 'light' ? "#999" : "#666"}
                    value={body}
                    onChangeText={setBody}
                  />
                </View>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.navigationButton, styles.backButton, buttonTheme]}
                        onPress={() => setShowTextInputs(false)}
                    >
                        <Text style={[styles.navigationButtonText, buttonTextTheme()]}>Back</Text>
                    </TouchableOpacity>
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
              </View>
            )}
          </ScrollView>
        </View>
        </RootSiblingParent>
      );      
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
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
    centeredContent: {
      flex: 1,
      justifyContent: "center",
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

  export default SNotifications;
