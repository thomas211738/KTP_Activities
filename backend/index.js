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
import multer from 'multer';
import { Readable } from 'stream';
import { MongoClient, GridFSBucket } from 'mongodb';
import userphotosRoute from './routes/userphotosRoutes.js';


const mongoDBURL = process.env.MONGODB_URL

let db, gfs;
MongoClient.connect(mongoDBURL)
  .then((client) => {
    db = client.db('test');
    gfs = new GridFSBucket(db, { bucketName: 'uploads' });
    console.log('Connected to MongoDB and GridFS initialized');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

export { db, gfs };


const app = express();
app.use(express.json());
app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage });


const PORT = process.env.APP_PORT;

app.use('/users', usersRoute);
app.use('/events', eventsRoute);
app.use('/tasks', taskRoute);
app.use('/alerts', alertsRoute);
app.use('/completed-tasks', completedTaskRoute);
app.use('/photo', userphotosRoute);

app.get('/', (request, response) => {
    console.log(request);
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

