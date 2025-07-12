import express from "express";
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

const router = express.Router();

export default function eventsRoute(db) {
    // Get all events
    router.get("/", async (request, response) => {
        try {
            const eventsCollection = collection(db, 'events');
            const eventsSnapshot = await getDocs(eventsCollection);
            const eventsList = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return response.status(200).json({
                count: eventsList.length,
                data: eventsList,
            });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Get an event by ID
    router.get("/:id", async (request, response) => {
        try {
            const { id } = request.params;
            const eventDoc = doc(db, 'events', id);
            const eventSnapshot = await getDoc(eventDoc);
            if (eventSnapshot.exists()) {
                return response.status(200).json({ id: eventSnapshot.id, ...eventSnapshot.data() });
            }
            return response.status(404).json({ message: 'Event not found' });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Add an event
    router.post("/", async (request, response) => {
        try {
            const { Name, Day, Time, Location, Description, Position } = request.body;
            if (!Name || !Day || !Time || !Location || !Description || !Position) {
                return response.status(400).send({
                    message: "Send all required fields: Name, Day, Time, Location, Description, Position",
                });
            }
            const eventsCollection = collection(db, 'events');
            const newEvent = { Name, Day, Time, Location, Description, Position };
            await addDoc(eventsCollection, newEvent);
            return response.status(200).send({ message: "event added successfully" });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Update an event
    router.put("/:id", async (request, response) => {
        try {
            const { Name, Day, Time, Location, Description, Position } = request.body;
            if (!Name || !Day || !Time || !Location || !Description || !Position) {
                return response.status(400).send({
                    message: "Send all required fields: Name, Day, Time, Location, Description, Position",
                });
            }
            const { id } = request.params;
            const eventDoc = doc(db, 'events', id);
            await updateDoc(eventDoc, { Name, Day, Time, Location, Description, Position });
            return response.status(200).send({ message: "event updated successfully" });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Delete an event
    router.delete("/:id", async (request, response) => {
        try {
            const { id } = request.params;
            const eventDoc = doc(db, 'events', id);
            await deleteDoc(eventDoc);
            return response.status(200).send({ message: "event deleted successfully" });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    return router;
}