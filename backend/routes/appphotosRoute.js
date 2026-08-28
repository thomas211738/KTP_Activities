import express from 'express';
import Busboy from 'busboy';

const router = express.Router();

/**
 * Resolve the Storage bucket safely.
 * This function is deliberately defensive:
 * - Never throws.
 * - Only called inside request handlers (lazy).
 * - Returns null when no bucket name can be determined.
 */
function getBucket(adminStorage) {
  try {
    const envBucket = process.env.GOOGLE_FIREBASE_STORAGE_BUCKET;
    const projectId = process.env.GOOGLE_FIREBASE_PROJECT_ID;
    const bucketName = envBucket || (projectId ? `${projectId}.appspot.com` : null);

    if (!bucketName) {
      return null;
    }
    return adminStorage.bucket(bucketName);
  } catch (e) {
    console.warn('[appphotosRoute] Could not resolve storage bucket:', e.message);
    return null;
  }
}

export default function imagesRoute(adminStorage) {
  // This factory MUST be safe to call at startup.
  // We never call adminStorage.bucket() at the top level.

  // POST: upload image
  router.post('/', async (req, res) => {
    const bucket = getBucket(adminStorage);

    if (!bucket) {
      return res.status(503).json({
        message: 'Image uploads are temporarily unavailable (storage bucket not configured on this server).'
      });
    }

    try {
      const busboy = Busboy({ headers: req.headers });

      const fields = {};
      let fileBuffer = null;
      let fileMimeType = null;
      let originalName = null;

      busboy.on('field', (name, val) => { fields[name] = val; });

      busboy.on('file', (fieldname, file, { filename, mimeType }) => {
        if (fieldname !== 'image') {
          file.resume();
          return;
        }
        originalName = filename;
        fileMimeType = mimeType;

        const chunks = [];
        file.on('data', (d) => chunks.push(d));
        file.on('end', () => { fileBuffer = Buffer.concat(chunks); });
      });

      busboy.on('finish', async () => {
        if (!fileBuffer) {
          return res.status(400).send({ message: 'No image file provided.' });
        }

        const folder = fields.folder || 'misc';
        const userId = fields.userId;

        let fileName;
        const ext = (originalName || 'file').split('.').pop();
        if (userId) {
          fileName = `${userId}.${ext}`;
        } else {
          fileName = `${(originalName || 'upload').split('.')[0]}_${Date.now()}.${ext}`;
        }

        const dest = `${folder}/${fileName}`;
        const fileRef = bucket.file(dest);

        try {
          await fileRef.save(fileBuffer, {
            contentType: fileMimeType || 'application/octet-stream',
            resumable: false,
          });

          const [downloadURL] = await fileRef.getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60 * 24 * 365 * 10,
          });

          return res.status(200).json({
            message: 'Image uploaded successfully',
            folder,
            name: fileName,
            type: fileMimeType,
            downloadURL,
          });
        } catch (err) {
          console.error('[appphotosRoute] upload error:', err);
          return res.status(500).send({ message: err.message });
        }
      });

      if (req.rawBody) {
        busboy.end(req.rawBody);
      } else {
        req.pipe(busboy);
      }
    } catch (error) {
      console.error('Error processing upload:', error);
      res.status(500).send({ message: error.message });
    }
  });

  // DELETE /photo2/:filename
  router.delete('/:filename', async (req, res) => {
    const bucket = getBucket(adminStorage);

    if (!bucket) {
      return res.status(503).send({ message: 'Image deletion is not configured on this server.' });
    }

    try {
      const { filename } = req.params;
      const folder = req.query.folder || 'misc';

      if (!filename) return res.status(400).send({ message: 'Filename is required' });

      const fileRef = bucket.file(`${folder}/${filename}`);

      try {
        await fileRef.delete();
      } catch (e) {
        if (e.code === 404 || (e.errors && e.errors[0] && e.errors[0].reason === 'notFound')) {
          return res.status(404).send({ message: 'Image not found' });
        }
        throw e;
      }

      return res.status(200).send({ message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).send({ message: error.message });
    }
  });

  return router;
}
