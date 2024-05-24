import { config } from 'dotenv';
config();
import express from 'express';
import mongoose from 'mongoose';

const app = express();
const mongoDBURL = process.env.mongoDBURL;
const PORT = process.env.PORT;

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