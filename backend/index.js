import { config } from 'dotenv';
config();
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

// Calendar webhook (for Google Calendar push notifications → Firestore)
// The calendarWebhook file is CommonJS (exports.calendarWebhook).
// We use createRequire so it works from this ESM file.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const calendarWebhookMod = require('./cloudFunctions/calendarWebhook/main.js');
const calendarWebhookHandler = calendarWebhookMod.calendarWebhook;

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin (server SDK) for Node/Express.
// Priority:
// 1) Explicit service account JSON file at backend/serviceAccountKey.json (local dev)
// 2) GOOGLE_APPLICATION_CREDENTIALS env var (or gcloud ADC)
// 3) Fall back with explicit projectId/storageBucket (may still require a credential source)
let credential;
let effectiveProjectId = process.env.GOOGLE_FIREBASE_PROJECT_ID;

const keyPath = path.join(__dirname, 'serviceAccountKey.json');
if (fs.existsSync(keyPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  credential = admin.credential.cert(serviceAccount);

  // Prefer the project_id embedded in the service account key file.
  // This is the most reliable way to avoid "Unable to detect a Project Id" errors.
  if (serviceAccount.project_id) {
    effectiveProjectId = serviceAccount.project_id;
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  credential = admin.credential.applicationDefault();
} else {
  // Last resort: try ADC (may fail until user sets it up)
  credential = admin.credential.applicationDefault();
}

// Derive storageBucket defensively.
let storageBucket = process.env.GOOGLE_FIREBASE_STORAGE_BUCKET;
if (!storageBucket && effectiveProjectId) {
  storageBucket = `${effectiveProjectId}.appspot.com`;
}

if (!admin.apps.length) {
  const initConfig = {
    credential,
    projectId: effectiveProjectId,
  };
  if (storageBucket) {
    initConfig.storageBucket = storageBucket;
  }
  admin.initializeApp(initConfig);
}

if (effectiveProjectId) {
  console.log(`[backend] Firebase Project ID: ${effectiveProjectId}`);
}
if (storageBucket) {
  console.log(`[backend] Firebase Storage bucket: ${storageBucket}`);
} else {
  console.warn('[backend] No storageBucket configured. Photo upload routes (/photo2) will be disabled.');
}

const db = admin.firestore();
const storage = admin.storage();

const app = express();

// Mount photo upload routes defensively.
// We only mount /photo2 if we actually have a storage bucket.
// This completely prevents the "Bucket name not specified" crash at startup.
if (storageBucket) {
  try {
    app.use('/photo2', appphotosRoute(storage));
  } catch (err) {
    console.warn('[backend] /photo2 (image uploads) disabled:', err.message);
  }
} else {
  console.log('[backend] Skipping /photo2 (image uploads) — no storage bucket configured.');
}

app.use(express.json());

const corsOptions = {
  // Production origins + local development (simulator / LAN)
  origin: [
    'https://www.ktpbostonu.com',
    'https://website-swart-ten-95.vercel.app',
    'https://www.ktp-bostonu.com',
    'http://localhost',
    'http://127.0.0.1',
    // Allow common LAN ranges (covers 10.0.0.155, 192.168.x.x, etc.)
    /^http:\/\/10\./,
    /^http:\/\/192\.168\./,
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,
  ],
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
    region: ['us-central1'],
    memory: "512MiB",
  },
  app
);

/**
 * Google Calendar push notification webhook (receives events.watch calls from Google)
 * Now enabled — syncs public calendar (via calendarTokens/main config) to Firestore `events` collection.
 * The mobile app now reads from /events endpoint (populated by this function).
 */

export const calendarWebhook = onRequest(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  calendarWebhookHandler
);

// Also mount the same handler on the local Express app so you can run the webhook
// receiver locally (useful as a temporary workaround when you cannot deploy the
// Cloud Function due to IAM restrictions).
// Example usage with ngrok:
//   1. npx ngrok http 5000
//   2. Use the https ngrok URL + /calendar-webhook when registering watches
//   3. node registerCalendarWatch.js personal   (after setting CALENDAR_WEBHOOK_URL env var or editing config)
app.post('/calendar-webhook', (req, res) => {
  // The handler is designed for functions-framework style (req, res)
  calendarWebhookHandler(req, res);
});