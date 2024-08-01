import express from 'express';
import { Users } from "../models/userModel.js";
import { Events } from '../models/eventsModel.js'
import fetch from 'node-fetch'; 
import Expo from 'expo-server-sdk';
import { getAllUsersInfo, fetchAndSetAllUsersInfo } from '../utils/userUtils.js';
import cron from 'node-cron'


const router = express.Router();


router.post('/register', async (request, response) => {
    const { expoPushToken, userID } = request.body;

    try {
        let user = await Users.findById(userID);

        if (user) {
            user.expoPushToken = expoPushToken;
            await user.save();
            response.status(200).send('Registered successfully!');

            // Send a notification
            sendNotification(user.expoPushToken, "Welcome!", "You have successfully registered.");
        } else {
            console.log('No User Found');
            response.status(404).send('User not found');
        }
    } catch (error) {
        console.error(error);
        response.status(500).send('An error occurred while registering the token.');
    }
});

// Function to send a notification
const sendNotification = (pushToken, title, body) => {
    if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        return;
    }

    let messages = [];
    messages.push({
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: { withSome: 'data' },
    });

    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    (async () => {
        for (let chunk of chunks) {
            try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log(ticketChunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error(error);
            }
        }
    })();
};

export const scheduleEventsNotifications = async (event) => {
    const eventTime = new Date(`${event.Day}T${event.Time}:00`); 

    await fetchAndSetAllUsersInfo();

    const users = getAllUsersInfo()

    if (!users){
        console.error('No users returned')
        return
    }

    users.forEach(user => {
        try{
            if (user && user.pos != 4){
                if (user.expoPushToken){
                    const pushToken = user.expoPushToken

                    //right now
                    sendNotification(pushToken, event.Name, "KTP added a new event")

                    //tomorrow
                    const timeDayBefore = new Date(eventTime.getTime() - 24 * 60 * 60 * 1000)
                    const cronExpression24hrs = `${timeDayBefore.getUTCMinutes()} ${timeDayBefore.getUTCHours()} ${timeDayBefore.getUTCDate()} ${timeDayBefore.getUTCMonth() + 1} *`;
                    cron.schedule(cronExpression24hrs, () => {
                        sendNotification(pushToken, event.Name, event.Name + " is tomorrow!");
                    });
    
                    //one hour
                    const time1hrBefore = new Date(eventTime.getTime() - 1 * 60 * 60 * 1000);
                    const cronExpression1hr = `${time1hrBefore.getUTCMinutes()} ${time1hrBefore.getUTCHours()} ${time1hrBefore.getUTCDate()} ${time1hrBefore.getUTCMonth() + 1} *`;
                    cron.schedule(cronExpression1hr, () => {
                        sendNotification(pushToken, event.Name, event.Name + " is in an hour!");
                    });
                }
                else{
                    console.log("NO PUSH TOKEN FOR " + user.FirstName + " " + user.LastName)
                }
            

            }
        }catch(error){
            console.error(error)
        }
    })
    
};


export default router;
