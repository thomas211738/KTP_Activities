import { config } from 'dotenv';
config();
import express from 'express';

const app = express();

const mongoDBURL = process.env.mongoDBURL;
const PORT = process.env.PORT_N;

app.get('/', (request, response) => {
    console.log(request);
    return response.status(234).send('Welcome To the KTP App');
  });

app.listen(PORT, () => {
    console.log(`App is listening to port: ${PORT}`)
});