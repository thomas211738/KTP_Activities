import axios from "axios";
import { BACKEND_URL } from "@env";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { getMessaging, onMessage } from "firebase/messaging";
import { firebaseApp } from "../firebaseConfig";

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

export type PushNotificationRegistrationResult =
    | { status: 'registered'; token: string }
    | { status: 'permission-denied'; token: null }
    | { status: 'unavailable'; token: null };

export async function registerForPushNotificationsAsync(): Promise<PushNotificationRegistrationResult> {
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
            return { status: 'permission-denied', token: null };
        }
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

        if (!projectId) {
            handleRegistrationError('Project ID not found');
        }
        try {
            
            // const token = await Notifications.getExpoPushTokenAsync();
            const pushTokenString = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

            // Subscribe to calendar event notifications via FCM topic
            if (pushTokenString) {
                await subscribeToEventNotifications();
            }

            return { status: 'registered', token: pushTokenString };
        } catch (e: unknown) {
            handleRegistrationError(`${e}`);
            return { status: 'unavailable', token: null };
        }
    } else {
        handleRegistrationError('Must use physical device for push notifications');
        return { status: 'unavailable', token: null };
    }
}

// Subscribe to EventNotification topic (for calendar event push notifications)
// Currently using legacy client-side calendar flow. Push notifications are optional.
export async function subscribeToEventNotifications() {
    try {
        const { getApps, getApp } = require('firebase/app');
        const app = getApps().length > 0 ? getApp() : null;

        if (!app) {
            console.log('[FCM] Firebase app not initialized, skipping topic subscription');
            return;
        }

        const messaging = getMessaging(app);

        console.log('✅ Client initialized for EventNotification topic');
        console.log('[FCM] Ready to receive calendar event push notifications (legacy flow)');

        // Optional: Listen for foreground messages
        onMessage(messaging, (payload) => {
            console.log('[FCM] Foreground message received:', payload);
            // You can trigger local notification or refresh calendar here
        });

    } catch (error) {
        console.error('[FCM] Failed to setup EventNotification subscription:', error);
    }
}
