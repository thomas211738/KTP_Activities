import express from "express";

const router = express.Router();

export default function userphotosRoute(db) {
    // Post a photo
    router.post("/photo", async (request, res) => {
        try {
            const { data } = request.body;
            if (!data) {
                return res.status(400).send({ message: "Send data" });
            }
            const photosCollection = db.collection('photos');
            const docRef = await photosCollection.add({ data });
            const fileId = { fileID: docRef.id };
            res.status(200).send(fileId);
        } catch (err) {
            console.error('Error uploading file:', err);
            res.status(500).send('An error occurred during the file upload.');
        }
    });

    // Get one photo by ID
    router.get('/photo/:id', async (request, response) => {
        try {
            const { id } = request.params;
            const userPhotoDoc = db.collection('photos').doc(id);
            const photosnapshot = await userPhotoDoc.get();
            if (photosnapshot.exists) {
                return response.status(200).json({ id: photosnapshot.id, ...photosnapshot.data() });
            }
            return response.status(404).json({ message: 'User photo not found' });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Get all photos
    router.get('/photos', async (request, response) => {
        try {
            const photosCollection = db.collection('photos');
            const photosSnapshot = await photosCollection.get();
            const photosList = photosSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            return response.status(200).json({
                count: photosList.length,
                data: photosList,
            });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Update a photo
    router.put("/photo/:id", async (request, response) => {
        try {
            const { data } = request.body;
            if (!data) {
                return response.status(400).send({ message: "Send data" });
            }
            const { id } = request.params;
            const userPhotoDoc = db.collection('photos').doc(id);
            await userPhotoDoc.update({ data });
            const fileId = { fileID: id };
            return response.status(200).json(fileId);
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Delete a photo by ID
    router.delete("/photo/:id", async (request, response) => {
        try {
            const { id } = request.params;
            const userPhotoDoc = db.collection('photos').doc(id);
            await userPhotoDoc.delete();
            return response.status(200).send({ message: "User Photo deleted successfully" });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    return router;
}