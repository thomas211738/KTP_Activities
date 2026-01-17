import express from 'express';
import multer from 'multer';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

export default function imagesRoute(storage) {

  // POST: Upload Image to specific folder
  // Body requires: 'image' (file) AND 'folder' (text)
  router.post('/', upload.single('image'), async (request, response) => {
    try {
      const file = request.file;
      const folder = request.body.folder || 'misc';
      const userId = request.body.userId;

      if (!file) {
        return response.status(400).send({ message: 'No image file provided.' });
      }

      let fileName;
      const fileExtension = file.originalname.split('.').pop(); 
      
      if (userId) {
        fileName = `${userId}.${fileExtension}`;
      } else {
        // Fallback to random timestamp if no ID provided
        const timestamp = Date.now();
        const name = file.originalname.split(".")[0];
        fileName = `${name}_${timestamp}.${fileExtension}`;
      }

      // 2. Use the dynamic folder in the reference path
      const storageRef = ref(storage, `${folder}/${fileName}`);

      const metadata = {
        contentType: file.mimetype,
      };

      const snapshot = await uploadBytes(storageRef, file.buffer, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return response.status(200).json({
        message: 'Image uploaded successfully',
        folder: folder,
        name: fileName,
        type: file.mimetype,
        downloadURL: downloadURL,
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      response.status(500).send({ message: error.message });
    }
  });

  // DELETE: Delete an Image
  // Usage: DELETE /my_image_123.jpg?folder=profile_pics
  router.delete('/:filename', async (request, response) => {
    try {
      const { filename } = request.params;
      // 3. Get folder from query params (defaults to 'misc' if not sent)
      const folder = request.query.folder || 'misc';

      if (!filename) {
        return response.status(400).send({ message: 'Filename is required' });
      }

      // 4. Construct path using the folder query param
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