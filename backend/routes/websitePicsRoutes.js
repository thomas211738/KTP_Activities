import express from "express";
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

const router = express.Router();

export default function websitePicsRoute(db) {
    // Post a photo
    router.post("/", async (request, res) => {
        try {
            const { data } = request.body;
            if (!data) {
                return res.status(400).send({ message: "Send data" });
            }
            const websitePicsCollection = collection(db, 'web_pics');
            const newWebsitePic = { data };
            const docRef = await addDoc(web_picsCollection, newWebsitePic);
            const fileId = { fileID: docRef.id };
            res.status(200).send(fileId);
        } catch (err) {
            console.error('Error uploading file:', err);
            res.status(500).send('An error occurred during the file upload.');
        }
    });

    // Get one photo by ID
    router.get('/:id', async (request, response) => {
        try {
            const { id } = request.params;
            const websitePicDoc = doc(db, 'web_pics', id);
            const web_picsnapshot = await getDoc(websitePicDoc);
            if (web_picsnapshot.exists()) {
                return response.status(200).json({ id: web_picsnapshot.id, ...web_picsnapshot.data() });
            }
            return response.status(404).json({ message: 'Website pic not found' });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Get all photos
    router.get('/', async (request, response) => {
        try {
            const web_picsCollection = collection(db, 'web_pics');
            const web_picsSnapshot = await getDocs(web_picsCollection);
            const web_picsList = web_picsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return response.status(200).json({
                count: web_picsList.length,
                data: web_picsList,
            });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Update a photo
    router.put("/:id", async (request, response) => {
        try {
            const { data } = request.body;
            if (!data) {
                return response.status(400).send({ message: "Send data" });
            }
            const { id } = request.params;
            const websitePicDoc = doc(db, 'web_pics', id);
            await updateDoc(websitePicDoc, { data });
            const fileId = { fileID: id };
            return response.status(200).json(fileId);
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Delete a photo by ID
    router.delete("/:id", async (request, response) => {
        try {
            const { id } = request.params;
            const websitePicDoc = doc(db, 'web_pics', id);
            await deleteDoc(websitePicDoc);
            return response.status(200).send({ message: "Website Pic deleted successfully" });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    return router;
}