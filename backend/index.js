import { config } from 'dotenv';
config();
import express from 'express';
import cors from 'cors';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import usersRoute from './routes/userRoutes.js';
import eventsRoute from './routes/eventsRoutes.js';
import taskRoute from './routes/taskRoutes.js';
import alertsRoute from './routes/alertsRoutes.js';
import completedTaskRoute from './routes/completedTaskRoutes.js';
import userphotosRoute from './routes/userphotosRoutes.js';
import notificationRoute from './routes/notificationsRoutes.js';
import websitePicsRoute from './routes/websitePicsRoutes.js';
// import emailRoute from './routes/emailRoute.js'; Not working?
import { onRequest } from 'firebase-functions/v2/https';
import appphotosRoute from './routes/appphotosRoute.js';


// Firebase configuration (replace with your own config from Firebase Console)
const firebaseConfig = {
  apiKey: process.env.GOOGLE_FIREBASE_API_KEY,
  authDomain: process.env.GOOGLE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.GOOGLE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.GOOGLE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.GOOGLE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.GOOGLE_FIREBASE_APP_ID,
};


// Initialize Firebase
const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase);
const storage = getStorage(appFirebase);

const app = express();
app.use(express.json());

const corsOptions = {
  origin: ['https://www.ktpbostonu.com', 'https://website-swart-ten-95.vercel.app', 'https://www.ktp-bostonu.com' ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors());

const PORT = process.env.APP_PORT;

// Pass the Firestore db instance to each route
app.use('/users', usersRoute(db));
app.use('/events', eventsRoute(db));
app.use('/tasks', taskRoute(db));
app.use('/alerts', alertsRoute(db));
app.use('/completed-tasks', completedTaskRoute(db));
app.use('/photo', userphotosRoute(db));
app.use('/notifications', notificationRoute(db));
app.use('/websitePics', websitePicsRoute(db));
app.use('/photo2', appphotosRoute(storage));
// app.use('/api/email', emailRoute); // No db needed

app.get('/', (request, response) => {
  return response.status(234).send('Welcome To the KTP App');
});

app.listen(PORT, () => {
  console.log(`App is listening to port: ${PORT}`);
});

export const api = onRequest(
  {
    cors: ['https://www.ktpbostonu.com'],
    region: ['us-central1'], // Specify region for consistency
    memory: "512MiB",
  },
  app
);