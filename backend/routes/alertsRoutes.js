import express from "express";
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

const router = express.Router();

export default function alertsRoute(db) {
    // Get all alerts
    router.get("/", async (request, response) => {
        try {
            const alertsCollection = collection(db, 'alerts');
            const alertsSnapshot = await getDocs(alertsCollection);
            const alertsList = alertsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return response.status(200).json({
                count: alertsList.length,
                data: alertsList,
            });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Get an alert by ID
    router.get("/:id", async (request, response) => {
        try {
            const { id } = request.params;
            const alertDoc = doc(db, 'alerts', id);
            const alertSnapshot = await getDoc(alertDoc);
            if (alertSnapshot.exists()) {
                return response.status(200).json({ id: alertSnapshot.id, ...alertSnapshot.data() });
            }
            return response.status(404).json({ message: "Alert not found" });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Add an alert
    router.post("/", async (request, response) => {
        try {
            const { AlertName, Description } = request.body;
            if (!AlertName || !Description) {
                return response.status(400).send({
                    message: "Send all required fields: AlertName, Description",
                });
            }
            const alertsCollection = collection(db, 'alerts');
            const newAlert = { 
                AlertName, 
                Description,
                updatedAt: new Date().toISOString()
            };
            const docRef = await addDoc(alertsCollection, newAlert);
            return response.status(201).send({ id: docRef.id, ...newAlert });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Update an alert
    router.put("/:id", async (request, response) => {
        try {
            const { AlertName, Description } = request.body;
            if (!AlertName || !Description) {
                return response.status(400).send({
                    message: "Send all required fields: AlertName, Description",
                });
            }
            const { id } = request.params;
            const alertDoc = doc(db, 'alerts', id);
            await updateDoc(alertDoc, { AlertName, Description });
            return response.status(200).send({ message: "alert updated successfully" });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Delete an alert
    router.delete("/:id", async (request, response) => {
        try {
            const { id } = request.params;
            const alertDoc = doc(db, 'alerts', id);
            await deleteDoc(alertDoc);
            return response.status(200).send({ message: "alert deleted successfully" });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    return router;
}