import axios from "axios";
import { BACKEND_URL } from "@env";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

export async function CheckNotificationStatus(userID) {

    try {
        const response = await axios.get(`${BACKEND_URL}/notifications/token/${userID}`);
        let token = response.data.token;
        return token;

    } catch (err) {
        console.error("Error checking notification status:", err.response ? err.response.data : err.message);
    }
}


function handleRegistrationError(errorMessage: string) {
    // throw new Error(errorMessage);
    console.log(errorMessage);
}

export async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            handleRegistrationError('Permission not granted to get push token for push notification!');
            return null;
        }
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

        if (!projectId) {
            handleRegistrationError('Project ID not found');
        }
        try {
            
            // const token = await Notifications.getExpoPushTokenAsync();
            const pushTokenString = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

            return pushTokenString;
        } catch (e: unknown) {
            handleRegistrationError(`${e}`);
        }
    } else {
        handleRegistrationError('Must use physical device for push notifications');
    }
}
