import express from "express";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { notifyEventChange } = require('../utils/notifyEvent.js');

const router = express.Router();

export default function eventsRoute(db) {
    // Get all events
    router.get("/", async (request, response) => {
        try {
            const eventsCollection = db.collection('events');
            const eventsSnapshot = await eventsCollection.get();
            const eventsList = eventsSnapshot.docs.map(d => {
                const data = d.data();
                if (data.Position !== undefined) {
                    data.Position = Number(data.Position);
                }
                return { id: d.id, ...data };
            });
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
            const eventDoc = db.collection('events').doc(id);
            const eventSnapshot = await eventDoc.get();
            if (eventSnapshot.exists) {
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
            if (!Name || !Name.trim()) {
                return response.status(400).send({ message: "Name is required." });
            }
            const eventsCollection = db.collection('events');
            const newEvent = {
                Name: Name.trim(),
                Day: Day || '',
                Time: Time || '',
                Location: Location || '',
                Description: Description || '',
                Position: Position !== undefined ? Number(Position) : 0,
            };
            const docRef = await eventsCollection.add(newEvent);
            // Fire-and-forget push notification — non-blocking
            notifyEventChange(newEvent, 'created').catch(err =>
                console.error('[eventsRoute] notifyEvent (create) error:', err.message)
            );
            return response.status(200).send({ message: "event added successfully", id: docRef.id });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    // Update an event
    router.put("/:id", async (request, response) => {
        try {
            const { Name, Day, Time, Location, Description, Position } = request.body;
            if (!Name || !Name.trim()) {
                return response.status(400).send({ message: "Name is required." });
            }
            const { id } = request.params;
            const eventDoc = db.collection('events').doc(id);
            const updatedFields = {
                Name: Name.trim(),
                Day: Day || '',
                Time: Time || '',
                Location: Location || '',
                Description: Description || '',
                Position: Position !== undefined ? Number(Position) : 0,
            };
            await eventDoc.update(updatedFields);
            // Fire-and-forget push notification — non-blocking
            notifyEventChange(updatedFields, 'updated').catch(err =>
                console.error('[eventsRoute] notifyEvent (update) error:', err.message)
            );
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
            const eventDoc = db.collection('events').doc(id);
            await eventDoc.delete();
            return response.status(200).send({ message: "event deleted successfully" });
        } catch (error) {
            console.log(error.message);
            response.status(500).send({ message: error.message });
        }
    });

    return router;
}
