import { config } from 'dotenv';
config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import usersRoute from './routes/userRoutes.js';
import eventsRoute from './routes/eventsRoutes.js';


const app = express();
app.use(express.json());

app.use(cors());

const mongoDBURL = process.env.mongoDBURL;
const PORT = process.env.PORT;

app.use('/users', usersRoute);
app.use('/events', eventsRoute);


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