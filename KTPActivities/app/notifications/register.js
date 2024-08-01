import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';

export async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }
  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log(token);
  return token;
}

export async function registerUserWithBackend(expoPushToken, userID) {
  const response = await fetch(`${BACKEND_URL}/notifications/register`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({expoPushToken, userID }),
  });

  const responseData = await response.json();
  if (response.ok) {
    alert('Registered successfully!');
  } else {
    alert(`Failed to register: ${responseData.message}`);
  }
}

export function setupNotificationListeners(setNotification) {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });
  
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });
  
    return { notificationListener, responseListener };
  }
  
export function removeNotificationListeners(notificationListener, responseListener) {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  }