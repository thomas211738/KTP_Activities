import express from 'express';
import Busboy from 'busboy';
import { randomUUID } from 'crypto';

const router = express.Router();

function getBucket(adminStorage) {
  try {
    const envBucket = process.env.GOOGLE_FIREBASE_STORAGE_BUCKET;
    const projectId = process.env.GOOGLE_FIREBASE_PROJECT_ID;
    const bucketName = envBucket || (projectId ? `${projectId}.appspot.com` : null);
    if (!bucketName) return null;
    return adminStorage.bucket(bucketName);
  } catch (e) {
    console.warn('[eventPhotosRoute] Could not resolve storage bucket:', e.message);
    return null;
  }
}

function sanitizeName(str) {
  return (str || 'event').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 80);
}

export default function eventPhotosRoute(db, adminStorage) {

  // POST /event-photos
  router.post('/', async (req, res) => {
    const bucket = getBucket(adminStorage);
    if (!bucket) {
      return res.status(503).json({ message: 'Image uploads unavailable (storage not configured).' });
    }
    try {
      const busboy = Busboy({ headers: req.headers });
      const fields = {};
      let fileBuffer = null;
      let fileMimeType = null;
      let originalName = null;

      busboy.on('field', (name, val) => { fields[name] = val; });
      busboy.on('file', (fieldname, file, { filename, mimeType }) => {
        if (fieldname !== 'image') { file.resume(); return; }
        originalName = filename;
        fileMimeType = mimeType;
        const chunks = [];
        file.on('data', d => chunks.push(d));
        file.on('end', () => { fileBuffer = Buffer.concat(chunks); });
      });

      busboy.on('finish', async () => {
        if (!fileBuffer) return res.status(400).json({ message: 'No image file provided.' });
        const { eventId, eventName, eventDay, uploadedBy } = fields;
        if (!eventId) return res.status(400).json({ message: 'eventId is required.' });

        const folderName = `${sanitizeName(eventName)}_${sanitizeName(eventDay)}`;
        const ext = (originalName || 'photo.jpg').split('.').pop().toLowerCase() || 'jpg';
        const storagePath = `eventPhotos/${folderName}/${randomUUID()}.${ext}`;
        const fileRef = bucket.file(storagePath);

        try {
          await fileRef.save(fileBuffer, { contentType: fileMimeType || 'image/jpeg', resumable: false });
          const [downloadURL] = await fileRef.getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60 * 24 * 365 * 10,
          });
          const uploadedAt = new Date().toISOString();
          const photoMeta = { downloadURL, storagePath, uploadedBy: uploadedBy || '', uploadedAt };
          const docRef = await db.collection('eventPhotos').doc(eventId).collection('photos').add(photoMeta);
          return res.status(200).json({ message: 'Photo uploaded successfully', id: docRef.id, ...photoMeta });
        } catch (err) {
          console.error('[eventPhotosRoute] upload error:', err);
          return res.status(500).json({ message: err.message });
        }
      });

      if (req.rawBody) { busboy.end(req.rawBody); } else { req.pipe(busboy); }
    } catch (error) {
      console.error('[eventPhotosRoute] Error processing upload:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // GET /event-photos/:eventId
  router.get('/:eventId', async (req, res) => {
    try {
      const { eventId } = req.params;
      const snap = await db.collection('eventPhotos').doc(eventId).collection('photos')
        .orderBy('uploadedAt', 'desc').get();
      const photos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.status(200).json({ count: photos.length, data: photos });
    } catch (error) {
      console.error('[eventPhotosRoute] list error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // DELETE /event-photos/:eventId/:photoId
  router.delete('/:eventId/:photoId', async (req, res) => {
    const bucket = getBucket(adminStorage);
    try {
      const { eventId, photoId } = req.params;
      const docRef = db.collection('eventPhotos').doc(eventId).collection('photos').doc(photoId);
      const snap = await docRef.get();
      if (!snap.exists) return res.status(404).json({ message: 'Photo not found.' });
      const { storagePath } = snap.data();
      if (bucket && storagePath) {
        try { await bucket.file(storagePath).delete(); } catch (e) {
          console.warn('[eventPhotosRoute] Storage delete warning:', e.message);
        }
      }
      await docRef.delete();
      return res.status(200).json({ message: 'Photo deleted successfully.' });
    } catch (error) {
      console.error('[eventPhotosRoute] delete error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  return router;
}
