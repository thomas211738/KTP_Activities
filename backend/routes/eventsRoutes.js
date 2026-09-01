import express from "express";

const router = express.Router();

export default function eventsRoute(db) {
    // Get all events
    router.get("/", async (request, response) => {
        try {
            const eventsCollection = db.collection('events');
            const eventsSnapshot = await eventsCollection.get();
            const eventsList = eventsSnapshot.docs.map(d => {
                const data = d.data();
                // Coerce Position to Number — some legacy docs stored it as a string
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
            await eventsCollection.add(newEvent);
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
            if (!Name || !Name.trim()) {
                return response.status(400).send({ message: "Name is required." });
            }
            const { id } = request.params;
            const eventDoc = db.collection('events').doc(id);
            await eventDoc.update({
                Name: Name.trim(),
                Day: Day || '',
                Time: Time || '',
                Location: Location || '',
                Description: Description || '',
                Position: Position !== undefined ? Number(Position) : 0,
            });
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