import { config } from 'dotenv';
config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import usersRoute from './routes/userRoutes.js';
import eventsRoute from './routes/eventsRoutes.js';
import taskRoute from './routes/taskRoutes.js';
import alertsRoute from './routes/alertsRoutes.js';
import completedTaskRoute from './routes/completedTaskRoutes.js';
import { onRequest } from 'firebase-functions/v2/https';
import userphotosRoute from './routes/userphotosRoutes.js';
import notificationRoute from './routes/notificationsRoutes.js';
import websitePicsRoute from './routes/websitePicsRoutes.js';

const mongoDBURL = process.env.MONGODB_URL

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.APP_PORT;

app.use('/users', usersRoute);
app.use('/events', eventsRoute);
app.use('/tasks', taskRoute);
app.use('/alerts', alertsRoute);
app.use('/completed-tasks', completedTaskRoute);
app.use('/photo', userphotosRoute);
app.use('/notifications', notificationRoute);
app.use('/websitePics', websitePicsRoute);

app.get('/', (request, response) => {
    return response.status(234).send('Welcome To the KTP App');
});


mongoose
.connect(mongoDBURL)
.then(() => {
console.log('App connected to database');
app.listen(PORT, () => {
    console.log(`App is listening to port: ${PORT}`);
});
})
.catch((error) => {
console.log(error);
});

export const api = onRequest(app);

