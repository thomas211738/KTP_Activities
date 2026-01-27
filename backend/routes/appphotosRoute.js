
import express from 'express';
import Busboy from 'busboy'; // Import busboy
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const router = express.Router();

export default function imagesRoute(storage) {

  // POST: Upload Image
  router.post('/', async (request, response) => {
    try {
      // 1. Initialize Busboy with request headers
      const busboy = Busboy({ headers: request.headers });
      
      const fields = {}; // To store text fields (folder, userId)
      let fileBuffer = null;
      let fileMimeType = null;
      let originalName = null;

      // 2. Handle Text Fields
      busboy.on('field', (fieldname, val) => {
        fields[fieldname] = val;
      });

      // 3. Handle File Upload
      busboy.on('file', (fieldname, file, { filename, mimeType }) => {
        if (fieldname !== 'image') {
          file.resume(); // Skip non-image files
          return;
        }

        originalName = filename;
        fileMimeType = mimeType;

        // Collect the file data into a buffer
        const chunks = [];
        file.on('data', (data) => chunks.push(data));
        file.on('end', () => {
          fileBuffer = Buffer.concat(chunks);
        });
      });

      // 4. On Finish: Process the upload to Firebase
      busboy.on('finish', async () => {
        if (!fileBuffer) {
          return response.status(400).send({ message: 'No image file provided.' });
        }

        const folder = fields.folder || 'misc';
        const userId = fields.userId;

        // --- Naming Logic (Same as your original code) ---
        let fileName;
        const fileExtension = originalName.split('.').pop(); 
        
        if (userId) {
          fileName = `${userId}.${fileExtension}`;
        } else {
          const timestamp = Date.now();
          const name = originalName.split(".")[0];
          fileName = `${name}_${timestamp}.${fileExtension}`;
        }
        // -----------------------------------------------

        // Upload to Firebase Storage
        const storageRef = ref(storage, `${folder}/${fileName}`);
        const metadata = { contentType: fileMimeType };

        try {
          const snapshot = await uploadBytes(storageRef, fileBuffer, metadata);
          const downloadURL = await getDownloadURL(snapshot.ref);

          return response.status(200).json({
            message: 'Image uploaded successfully',
            folder: folder,
            name: fileName,
            type: fileMimeType,
            downloadURL: downloadURL,
          });
        } catch (err) {
          console.error('Error uploading to storage:', err);
          return response.status(500).send({ message: err.message });
        }
      });

      // 5. CRITICAL: Feed the raw body buffer into Busboy
      // Firebase Functions provides the raw buffer in request.rawBody
      if (request.rawBody) {
        // Firebase Functions: The body is already buffered
        busboy.end(request.rawBody);
      } else {
        // Localhost: Stream the request directly to busboy
        request.pipe(busboy);
      }
      
    } catch (error) {
      console.error('Error processing upload:', error);
      response.status(500).send({ message: error.message });
    }
  });

  // DELETE: Delete an Image (Your original delete code remains unchanged)
  router.delete('/:filename', async (request, response) => {
    try {
      const { filename } = request.params;
      const folder = request.query.folder || 'misc';

      if (!filename) {
        return response.status(400).send({ message: 'Filename is required' });
      }

      const deleteRef = ref(storage, `${folder}/${filename}`);
      await deleteObject(deleteRef);

      return response.status(200).send({ message: 'Image deleted successfully' });

    } catch (error) {
      console.error('Error deleting image:', error);
      if (error.code === 'storage/object-not-found') {
        return response.status(404).send({ message: 'Image not found' });
      }
      response.status(500).send({ message: error.message });
    }
  });

  return router;
}